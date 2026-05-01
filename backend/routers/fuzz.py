from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import asyncio

from fuzzer.generator import generate_fuzz_inputs, generate_api_payloads
from fuzzer.sandbox import run_code_safely
from fuzzer.classifier import classify
from fuzzer.ai_explainer import get_crash_explanation
import urllib.request
import urllib.error

router = APIRouter()

class CodeFuzzRequest(BaseModel):
    code: str
    inputs_count: int = 50
    ai_explain: bool = True

@router.post("/fuzz-code-stream")
async def fuzz_code_stream(req: CodeFuzzRequest):
    async def event_generator():
        # 1. Generate all the malicious/edge-case inputs
        inputs = generate_fuzz_inputs(req.inputs_count)
        loop = asyncio.get_event_loop()
        
        for i, inp in enumerate(inputs):
            # 2. Run safely in a subprocess (non-blocking)
            result = await loop.run_in_executor(
                None, 
                run_code_safely, 
                req.code, 
                inp, 
                1.0  # 1 second timeout per execution
            )
            
            # Format input for frontend display
            display_input = repr(inp)
            if len(display_input) > 80:
                display_input = display_input[:80] + "..."
                
            payload = {
                "id": i,
                "input": display_input,
                "passed": result["passed"]
            }
            
            if not result["passed"]:
                payload["error"] = result["error"]
                payload["error_type"] = result["error_type"]
                # 3. Classify the severity of the crash
                payload["severity"] = classify(result["error_type"], result["error"], display_input)
                
                # Note: AI Explanations will be added here in Step 5
                payload["explanation"] = None 
                
            # Server-Sent Events format
            yield f"data: {json.dumps(payload)}\n\n"
            
            # Tiny sleep to make the UI look like it's "thinking" for the demo
            await asyncio.sleep(0.02)
            
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

class ApiFuzzRequest(BaseModel):
    target_url: str
    inputs_count: int = 50

def hit_api_safely(url: str, payload: str):
    # Ensure URL is fully qualified
    if not url.startswith('http'):
        url = 'http://' + url
    
    # Send payload as POST body JSON
    req = urllib.request.Request(
        url, 
        data=payload.encode('utf-8', errors='ignore'), 
        headers={'Content-Type': 'application/json', 'User-Agent': 'FuzzAI/1.0'}, 
        method='POST'
    )
    try:
        resp = urllib.request.urlopen(req, timeout=1.5)
        return {"passed": True}
    except urllib.error.HTTPError as e:
        # 5xx errors are crashes. 4xx are passes (the server handled the bad input securely)
        if e.code >= 500:
            return {"passed": False, "error_type": f"HTTP {e.code}", "error": e.reason}
        return {"passed": True}
    except urllib.error.URLError as e:
        # Connection refused / timeout usually means a denial of service or critical crash
        return {"passed": False, "error_type": "ConnectionError", "error": str(e.reason)}
    except Exception as e:
        return {"passed": False, "error_type": type(e).__name__, "error": str(e)}

@router.post("/fuzz-api-stream")
async def fuzz_api_stream(req: ApiFuzzRequest):
    async def event_generator():
        inputs = generate_api_payloads(req.inputs_count)
        loop = asyncio.get_event_loop()
        
        for i, inp in enumerate(inputs):
            result = await loop.run_in_executor(
                None, 
                hit_api_safely, 
                req.target_url, 
                inp
            )
            
            display_input = str(inp)
            if len(display_input) > 80:
                display_input = display_input[:80] + "..."
                
            payload = {
                "id": i,
                "input": display_input,
                "passed": result["passed"]
            }
            
            if not result["passed"]:
                payload["error"] = result["error"]
                payload["error_type"] = result["error_type"]
                payload["severity"] = classify(result["error_type"], result["error"], display_input)
                payload["explanation"] = None 
                
            yield f"data: {json.dumps(payload)}\n\n"
            await asyncio.sleep(0.05)
            
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

class ExplainRequest(BaseModel):
    code: str
    input: str
    error_type: str
    error_msg: str

@router.post("/explain")
def explain_crash(req: ExplainRequest):
    explanation = get_crash_explanation(req.code, req.input, req.error_type, req.error_msg)
    return {"explanation": explanation}
