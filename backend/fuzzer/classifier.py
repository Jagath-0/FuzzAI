"""
classifier.py — Maps crash error types to severity levels.
"""

_CRITICAL = {
    "RecursionError", "MemoryError", "SystemError", "SystemExit",
    "OverflowError", "TimeoutError", "KeyboardInterrupt",
}
_MEDIUM = {
    "TypeError", "AttributeError", "NameError", "UnboundLocalError",
    "RuntimeError", "NotImplementedError", "ImportError",
}
_INJECTION_KEYWORDS = [
    "' OR", "DROP TABLE", "SELECT *", "$(", "| cat",
    "passwd", "; ls", "whoami", "cmd.exe",
]


def classify(error_type: str, error_msg: str, raw_input: str) -> str:
    if error_type in _CRITICAL:
        return "critical"
    if any(kw.lower() in raw_input.lower() for kw in _INJECTION_KEYWORDS):
        return "critical"
    if error_type in _MEDIUM:
        return "medium"
    return "low"
