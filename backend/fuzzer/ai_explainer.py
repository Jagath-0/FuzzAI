import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Set up the Gemini API client
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

# Use Flash model for fast, cheap responses
generation_config = {
    "temperature": 0.2,
    "max_output_tokens": 400,
}

def get_crash_explanation(code: str, input_data: str, error_type: str, error_msg: str) -> str:
    """
    Calls the Gemini API to explain why the code crashed.
    (If no API key is present, provides a mock AI response for hackathon demos).
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    
    # If the user hasn't set their key, we will fake a beautiful AI response for the demo!
    if not api_key or api_key == "your_gemini_api_key_here" or api_key == "":
        import time
        time.sleep(1.2) # Fake "thinking" time for the demo
        
        # Determine a dynamic explanation based on the error type
        if "ZeroDivisionError" in error_type:
            explanation = "You are dividing by zero! The fuzzer passed `0` as an argument, causing a catastrophic math exception."
            fix = "`if b == 0: return 0`"
        elif "TypeError" in error_type and "len" in error_msg:
            explanation = f"You are trying to calculate the length of an integer or unsupported type. The fuzzer injected the malicious payload `{input_data[:20]}...`, which has no `len()` attribute."
            fix = "`if not isinstance(data, (str, list, dict)): return 0`"
        elif "TypeError" in error_type:
            explanation = "You have a type mismatch! The fuzzer injected a string or list where an integer was expected, breaking your function."
            fix = "Use type checking: `if not isinstance(val, int): raise ValueError()`"
        elif "IndexError" in error_type:
            explanation = "You are trying to access an index that doesn't exist. The fuzzer passed an empty sequence like `[]` or `''`."
            fix = "`if not data: return None`"
        else:
            explanation = f"The fuzzer successfully broke your code by injecting `{input_data[:20]}...`. This resulted in an unhandled `{error_type}` exception."
            fix = "Wrap the fragile code block in a `try/except` block to gracefully handle unexpected inputs."
            
        return f"""
**Vulnerability Detected:** {error_type}

**Why it happened:**
{explanation}

**How to fix it:**
To prevent this crash, add input validation or error handling before processing the data:
{fix}
"""

    prompt = f"""
You are an expert Security Engineer and Python Developer.
Analyze the following crash from a fuzz testing session.

CODE:
```python
{code}
```

MALICIOUS/EDGE-CASE INPUT:
{input_data}

ERROR PRODUCED:
{error_type}: {error_msg}

Task:
1. Explain exactly why this input caused this specific error.
2. Provide a brief, actionable suggestion to fix the code to handle this input safely.
3. Keep the tone professional, concise, and easy to understand. Use Markdown formatting.
"""
    try:
        model = genai.GenerativeModel(model_name="gemini-2.0-flash", generation_config=generation_config)
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"❌ **AI Error**: Failed to generate explanation. ({str(e)})"
