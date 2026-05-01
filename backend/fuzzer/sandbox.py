"""
sandbox.py — Safely executes user code against malformed inputs in an isolated subprocess.
"""
import subprocess
import pickle
import base64
import tempfile
import os
import sys
import json

def run_code_safely(code_str: str, input_data, timeout: float = 1.0) -> dict:
    """
    Runs the provided Python function with `input_data` in a separate process.
    Returns a dict with pass/fail status and error info.
    """
    try:
        # We pickle the input so we can pass complex objects (bytes, sets, etc) easily
        pickled_input = base64.b64encode(pickle.dumps(input_data)).decode('ascii')
    except Exception as e:
        return {"passed": False, "error": f"Serialization error: {e}", "error_type": "ValueError"}

    wrapper_script = f"""
import pickle
import base64
import sys
import json
import traceback

def run():
    try:
        input_data = pickle.loads(base64.b64decode('{pickled_input}'))
        
        user_globals = {{}}
        exec({repr(code_str)}, user_globals)
        
        # Find the first defined function
        func = None
        for k, v in user_globals.items():
            if callable(v) and not k.startswith("__"):
                func = v
                break
                
        if not func:
            print(json.dumps({{"passed": False, "error": "No function found in code", "error_type": "ParseError"}}))
            return
            
        import inspect
        sig = inspect.signature(func)
        # Pass the input to all parameters for simplicity
        args = [input_data] * len(sig.parameters)
        
        # Execute!
        func(*args)
        print(json.dumps({{"passed": True}}))
        
    except Exception as e:
        print(json.dumps({{
            "passed": False, 
            "error": str(e) or "Empty exception", 
            "error_type": type(e).__name__
        }}))

if __name__ == "__main__":
    run()
"""

    fd, path = tempfile.mkstemp(suffix=".py")
    with os.fdopen(fd, 'w', encoding='utf-8') as f:
        f.write(wrapper_script)
        
    try:
        # Run the script with a strict timeout
        result = subprocess.run(
            [sys.executable, path], 
            capture_output=True, 
            text=True, 
            timeout=timeout
        )
        
        try:
            # We expect the last line of stdout to be our JSON result
            out_lines = result.stdout.strip().split('\\n')
            if not out_lines or not out_lines[-1].strip():
                raise ValueError("Empty output")
            return json.loads(out_lines[-1])
            
        except (json.JSONDecodeError, IndexError, ValueError):
            # This happens if there's a syntax error in user code or a segfault
            err = result.stderr.strip()
            error_type = "SystemError"
            if "SyntaxError" in err: error_type = "SyntaxError"
            elif "IndentationError" in err: error_type = "IndentationError"
            
            return {
                "passed": False,
                "error": err[-500:] if err else "Process crashed unexpectedly (e.g., Segfault or Out of Memory)",
                "error_type": error_type
            }
            
    except subprocess.TimeoutExpired:
        return {
            "passed": False,
            "error": f"Execution timed out after {timeout}s",
            "error_type": "TimeoutError"
        }
    finally:
        try:
            os.remove(path)
        except OSError:
            pass
