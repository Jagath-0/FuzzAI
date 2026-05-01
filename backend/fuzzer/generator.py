"""
generator.py — Produces a rich set of malformed/edge-case fuzz inputs.
"""
import random
import string


# ── Static payload bank ────────────────────────────────────────────────────
_STATIC: list = [
    # Null / empty
    None, "", [], {}, (), set(),
    # Booleans
    True, False,
    # Zero variants
    0, 0.0, -0, 0j,
    # Integer boundaries
    1, -1, 2**31 - 1, 2**31, -2**31, 2**63, -2**63, 2**64, -(2**64),
    # Float edge-cases
    float("inf"), float("-inf"), float("nan"), 1e308, -1e308, 1e-308,
    # Strings — whitespace / control
    " ", "  ", "\n", "\t", "\r\n", "\x00", "\x00" * 10,
    # Strings — large
    "A" * 1_000, "A" * 10_000, "🔥" * 500,
    # SQL injection
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "1; SELECT * FROM users WHERE '1'='1",
    '" OR ""="',
    # Command injection
    "; ls -la", "| cat /etc/passwd", "$(whoami)", "`id`",
    # Path traversal
    "../../../etc/passwd", "..\\..\\..\\windows\\system32\\cmd.exe",
    # Format strings
    "%s%s%s%s%s%s%s", "%n%n%n%n", "{0}" * 50, "{{}}",
    # Unicode bombs
    "\u202e reversed", "\ufffe", "\u0000\u0001\u0002\u0003",
    "𝕳𝖊𝖑𝖑𝖔 𝖂𝖔𝖗𝖑𝖉", "日本語テスト", "مرحبا", "﷽",
    # Large integers
    10**100, -(10**100), 10**300,
    # Large containers
    list(range(10_000)),
    {str(i): i for i in range(500)},
    [None] * 1_000,
    # Type confusion
    b"bytes_data", bytearray(b"\x00\xff\xfe"),
    # Nested structures
    [[[[[1, 2, 3]]]]],
    {"a": {"b": {"c": {"d": None}}}},
    # Negative / weird numbers
    -0.0, 1 / 3, -999_999_999, 999_999_999,
]


def generate_fuzz_inputs(count: int = 50) -> list:
    """Return `count` fuzz inputs, always starting with the static bank."""
    pool = list(_STATIC)

    # Pad with random inputs if count > static bank size
    while len(pool) < count:
        r = random.randint(0, 6)
        if r == 0:
            pool.append(random.randint(-(10**9), 10**9))
        elif r == 1:
            n = random.randint(0, 300)
            pool.append("".join(random.choices(string.printable, k=n)))
        elif r == 2:
            pool.append([random.randint(-100, 100) for _ in range(random.randint(0, 100))])
        elif r == 3:
            pool.append(random.choice([None, True, False, 0, "", [], {}]))
        elif r == 4:
            pool.append(random.uniform(-1e15, 1e15))
        elif r == 5:
            pool.append("".join(random.choices(string.punctuation, k=random.randint(5, 40))))
        else:
            pool.append(random.choice(_STATIC))

    random.shuffle(pool)
    return pool[:count]

def generate_api_payloads(count: int = 50) -> list:
    """Return `count` string/JSON fuzz payloads specifically for hitting API endpoints."""
    import json
    # Convert static non-string items to JSON strings where applicable, and keep string payloads
    api_pool = []
    for item in _STATIC:
        if isinstance(item, str):
            api_pool.append(item)
        elif item is None or isinstance(item, (int, float, bool, list, dict)):
            try:
                api_pool.append(json.dumps(item))
            except (TypeError, ValueError):
                api_pool.append(str(item))
        else:
            api_pool.append(str(item))
            
    # Add some API specific headers/bodies
    api_specific = [
        '{"admin": true}',
        '{"username": "admin", "password": ""}',
        '<?xml version="1.0" encoding="ISO-8859-1"?><!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]><foo>&xxe;</foo>', # XXE
        '{"id": "../../../../etc/passwd"}',
    ]
    api_pool.extend(api_specific)

    # Pad with random items
    while len(api_pool) < count:
        api_pool.append(random.choice(api_pool))

    random.shuffle(api_pool)
    return api_pool[:count]
