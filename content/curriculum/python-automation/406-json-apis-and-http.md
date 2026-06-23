---
title: "Python for Automation — JSON, APIs & HTTP"
slug: "python-json-apis-and-http"
track: "python-automation"
trackName: "Python for Automation"
module: "Working with the System"
order: 406
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Shell & Scripting"
tags: [python, json, api, http, requests, intermediate]
cover: "/covers/curriculum/python-automation.svg"
estMinutes: 55
status: "published"
summary: "Modern infrastructure speaks JSON over HTTP. Parse and produce JSON, call REST APIs with the standard library and requests, handle status codes and errors, send headers and authentication, and turn API responses into Python data you can act on."
seoTitle: "Python for Automation 6: JSON, REST APIs & HTTP"
seoDescription: "Intermediate Python: json.loads/dumps, calling REST APIs with urllib and requests, status codes, error handling, headers, auth tokens, and parsing responses. Lab + assessment."
---

Cloud platforms, container registries, monitoring systems, CI servers, chat
webhooks — modern infrastructure talks **JSON over HTTP**. Python is the lingua
franca for scripting against these APIs. This lesson covers parsing and producing
**JSON**, making **HTTP requests** (with the standard library and the popular
`requests`), handling **status codes** and errors, and **authenticating** — so you
can read from and drive any REST API.

## Learning objectives

By the end of this lesson you will be able to:

- Parse and produce **JSON** (`json.loads`/`dumps`) and map it to Python data.
- Make HTTP **GET/POST** requests (stdlib `urllib` and `requests`).
- Read **status codes** and handle HTTP **errors**.
- Send **headers**, query parameters and **JSON bodies**.
- **Authenticate** with tokens, and parse responses into data.

## Part 1 — JSON ↔ Python

JSON maps cleanly onto Python's dicts and lists (Lesson 402):

```python
import json

text = '{"name": "web01", "cpu": 87.5, "tags": ["eu", "prod"], "up": true}'
data = json.loads(text)          # JSON string -> Python (dict/list/str/num/bool/None)
print(data["name"], data["tags"][0], data["up"])   # web01 eu True

obj = {"host": "db01", "port": 5432, "active": False}
print(json.dumps(obj))                       # Python -> compact JSON string
print(json.dumps(obj, indent=2, sort_keys=True))   # pretty-printed

# Files:
with open("config.json") as f:
    config = json.load(f)        # parse a JSON file
with open("out.json", "w") as f:
    json.dump(data, f, indent=2) # write JSON to a file
```

The mapping: JSON object↔dict, array↔list, string↔str, number↔int/float,
`true/false`↔`True/False`, `null`↔`None`. So once parsed, it's just the data
structures you already know.

> [!TIP]
> `json.dumps(obj, indent=2)` is the easiest way to pretty-print any nested data for
> debugging — far more readable than raw `print(obj)`. And because parsed JSON is
> plain dicts/lists, navigate it with `data["key"]`, `.get("key", default)`, indexing
> and loops — no special API to learn.

## Part 2 — HTTP with the standard library

No install needed — `urllib.request` ships with Python:

```python
import json
import urllib.request

url = "https://api.github.com/repos/torvalds/linux"
req = urllib.request.Request(url, headers={"User-Agent": "ops-script"})
with urllib.request.urlopen(req, timeout=10) as resp:
    status = resp.status                 # 200
    data = json.loads(resp.read())       # parse the JSON body
print(status, data["full_name"], data["stargazers_count"])
```

The stdlib is fine for simple calls and dependency-free environments, but it's
verbose. For real work, most people use **`requests`**.

## Part 3 — requests: the friendly client

```bash
pip install requests        # (inside a virtualenv — Lesson 407)
```
```python
import requests

# GET with query params
r = requests.get("https://api.example.com/servers",
                 params={"region": "eu", "status": "active"},
                 timeout=10)
print(r.status_code)         # 200
data = r.json()              # parse JSON response directly into Python

# POST a JSON body
r = requests.post("https://api.example.com/deploy",
                  json={"app": "web", "version": "1.4.2"},
                  timeout=10)
print(r.status_code, r.json())
```

`requests` handles encoding, JSON parsing (`r.json()`), query params, and headers
for you. `r.text` is the raw body; `r.status_code` the HTTP code; `r.headers` a
dict.

## Part 4 — Status codes and error handling

HTTP failures don't raise by default — you must check:

```python
import requests

try:
    r = requests.get(url, timeout=10)
    r.raise_for_status()         # raise an exception for 4xx/5xx responses
    data = r.json()
except requests.exceptions.HTTPError as e:
    print(f"HTTP error: {r.status_code} {r.reason}")
except requests.exceptions.Timeout:
    print("request timed out")
except requests.exceptions.ConnectionError:
    print("could not connect")
except requests.exceptions.RequestException as e:
    print(f"request failed: {e}")
```

Know the status-code families: **2xx** success, **3xx** redirect, **4xx** client
error (your request — `401` unauthorized, `403` forbidden, `404` not found, `429`
rate-limited), **5xx** server error (their side — `500`, `502`, `503`).

> [!IMPORTANT]
> **A returned response is not a successful one** — `requests.get` happily returns a
> `404` or `500` object without raising. Always check `r.status_code` or call
> `r.raise_for_status()`, and **always set a `timeout`** (network calls can hang
> forever). For transient `5xx`/`429`, add a **retry with backoff**; never hammer an
> API that's rate-limiting you.

## Part 5 — Headers and authentication

Most APIs need auth, usually a token in a header:

```python
headers = {
    "Authorization": f"Bearer {token}",     # bearer token
    "Accept": "application/json",
}
r = requests.get("https://api.example.com/me", headers=headers, timeout=10)

# Other common schemes:
requests.get(url, auth=("user", "pass"))                 # HTTP basic auth
requests.get(url, headers={"X-API-Key": api_key})        # API-key header
```

> [!IMPORTANT]
> **Never hard-code secrets** (tokens, passwords, API keys) in your script. Read them
> from **environment variables** (`os.environ["API_TOKEN"]`) or a secrets manager, and
> keep them out of Git (`.gitignore`, Lesson on Git). A token committed to a repo is
> a token leaked — treat your source as public. Pass secrets in at runtime, not in
> the code.

## Hands-on lab

```bash
python3 - <<'EOF'
import json, urllib.request

# 1. JSON parse/produce + pretty-print
data = json.loads('{"host":"web01","tags":["eu","prod"],"up":true,"cpu":87.5}')
print(data["host"], data["tags"], data["up"])
print(json.dumps(data, indent=2, sort_keys=True))

# 2. A real GET with the standard library (needs network)
try:
    req = urllib.request.Request("https://api.github.com/repos/python/cpython",
                                 headers={"User-Agent": "ops-lab"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        repo = json.loads(resp.read())
    print("status:", resp.status, "| stars:", repo.get("stargazers_count"))
except Exception as e:
    print("network call skipped/failed:", e)

# 3. Status code families (reference)
for code, meaning in [(200,"OK"),(401,"Unauthorized"),(404,"Not Found"),
                      (429,"Too Many Requests"),(503,"Service Unavailable")]:
    print(code, "->", meaning)

# 4. Read a secret from the environment (never hard-code)
import os
token = os.environ.get("API_TOKEN", "<unset>")
print("token from env:", "set" if token != "<unset>" else "unset (good: not in code)")
EOF
```
```python
# (If you have requests installed in a venv — Lesson 407)
# import requests
# r = requests.get("https://httpbin.org/json", timeout=10)
# r.raise_for_status(); print(r.json())
```

## Exercises

1. Parse a JSON string into Python, access a nested value, then re-serialize it
   pretty-printed with `indent=2`.
2. Read a JSON config file with `json.load` and print one of its values safely with
   `.get`.
3. Make a GET request to a public JSON API (stdlib or `requests`), print the status
   code, and extract one field from the response.
4. Add error handling that distinguishes a timeout, a connection error, and an HTTP
   4xx/5xx, printing a clear message for each.
5. Read an API token from an environment variable and build an `Authorization:
   Bearer` header (don't make a real authenticated call unless you have a token).

## Troubleshooting

- **`json.decoder.JSONDecodeError`** — the body isn't JSON (an HTML error page, or
  empty). *Fix:* check `status_code`/`Content-Type` first; print `r.text` to see what
  you actually got.
- **Got a response but the data's wrong / it's an error page** — you didn't check the
  status. *Fix:* `r.raise_for_status()` or test `r.status_code`.
- **Script hangs on a request** — no timeout. *Fix:* always pass `timeout=`.
- **`401`/`403`** — missing/invalid auth. *Fix:* check the token and header name/
  scheme the API expects.
- **`429 Too Many Requests`** — rate-limited. *Fix:* slow down; honor `Retry-After`;
  add backoff.
- **`ModuleNotFoundError: requests`** — not installed. *Fix:* `pip install requests`
  in a venv (Lesson 407), or use stdlib `urllib`.

Reproduce the "response ≠ success" point: a GET to a `/404` URL returns a response
object with `status_code == 404` and does **not** raise until you call
`raise_for_status()`.

## Assessment

**Passing requirement: at least 9 of 11 correct (≈82%).** Run the practical items.

1. How does JSON map onto Python types?
2. Which functions parse and produce JSON (string and file forms)?
3. How do you pretty-print nested data for debugging?
4. How do you make a GET request and parse the JSON response with `requests`?
5. Does `requests.get` raise on a 404/500 by default? How do you handle it?
6. What do the 2xx/4xx/5xx status families mean?
7. Why must you always set a timeout?
8. How do you send a bearer token, and where should the token come from?
9. Why never hard-code secrets in a script?
10. **Practical:** parse a JSON string and pretty-print it.
11. **Practical:** GET a JSON API and print its status code and one field.

## Solutions & validation

1. object↔dict, array↔list, string↔str, number↔int/float, true/false↔bool,
   null↔None.
2. `json.loads`/`json.dumps` (strings); `json.load`/`json.dump` (files).
3. `json.dumps(obj, indent=2)`.
4. `r = requests.get(url, timeout=10); data = r.json()`.
5. **No**; check `r.status_code` or call `r.raise_for_status()` (catch
   `HTTPError`).
6. **2xx** success, **4xx** client error (your request), **5xx** server error.
7. Network calls can **hang indefinitely** without one, freezing automation.
8. Header `{"Authorization": f"Bearer {token}"}`; the token from an **environment
   variable**/secrets manager, never the code.
9. Source should be treated as public; a committed secret is a **leaked** secret.
10. **Validation:** `print(json.dumps(json.loads(s), indent=2))`.
11. **Validation:** `r = requests.get(url, timeout=10); print(r.status_code,
    r.json()["field"])` (or stdlib equivalent).

> [!TIP]
> Once a response is parsed, it's just dicts and lists — everything you learned in
> Lesson 402 applies. The discipline that separates robust API scripts: **check the
> status, set a timeout, handle errors, and keep secrets in the environment.**

## What's next

Next: **Lesson 407 — Virtual Environments & pip.** Real Python tools have
dependencies (like `requests`). You'll isolate them with **virtual environments**,
install packages with **pip**, pin versions in `requirements.txt` for reproducible
setups, and understand why you never `sudo pip install` into the system Python.
