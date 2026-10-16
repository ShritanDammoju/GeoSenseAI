# GeoSense AI — Defensive Security Audit & Hardening Report

**Audit Date:** 2026-10-16  
**Scope:** Application Security, Input Validation, Secrets Hygiene, CORS, Path Traversal  
**Status:** **SECURE & HARDENED FOR DEMO**  

---

## 1. Executive Summary

This defensive security audit evaluates the attack surface of the GeoSense AI platform. The audit verified that no sensitive credentials or API keys exist in the repository, restricted CORS policies to authorized local development and preview origins, hardened query parameter validation against injection and unbounded allocation attacks, and confirmed that file access is strictly hardcoded to internal application constants.

---

## 2. Secrets & Credential Hygiene

### 1. Automated Secret Scanner Results
A dedicated regex-based secret scanner was executed across all source files, configurations, datasets, and documentation in the project directory:
* Scanned patterns: AWS Access Keys (`AKIA...`), GitHub Personal Access Tokens (`ghp_...`), Google API Keys (`AIza...`), Bearer tokens, passwords, and private key blocks.
* **Findings:** **0 secret candidates or private credentials found**.

### 2. Environment File Exclusion
* Verified that no `.env`, `.env.local`, or `*.env` files have been committed to version control.
* Enhanced root [`.gitignore`](file:///c:/Users/Admin/Desktop/GeoSenseAI/.gitignore) to explicitly exclude:
  ```gitignore
  .env
  .env.*
  *.env
  *.pem
  *.key
  *.cert
  secrets/
  ```
* Created [`.env.example`](file:///c:/Users/Admin/Desktop/GeoSenseAI/.env.example) containing placeholder keys and safe default configurations only.

---

## 3. Network & CORS Hardening

### Previous Vulnerability:
The FastAPI application previously initialized `CORSMiddleware` with `allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"]` combined with `allow_credentials=True` and `allow_methods=["*"]`.

Combining wildcard `*` with `allow_credentials=True` is explicitly rejected by standard browsers under the Fetch and CORS specifications, and allowing arbitrary HTTP methods (POST, PUT, DELETE) on a read-only telemetry API introduces unnecessary attack surface.

### Hardened Implementation in `backend/app/main.py`:
```python
DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]
env_origins = os.getenv("ALLOWED_ORIGINS")
allowed_origins = [o.strip() for o in env_origins.split(",") if o.strip()] if env_origins else DEFAULT_ALLOWED_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)
```
* **Security Outcome:** Wildcard access removed; methods restricted strictly to read-only `GET` and `OPTIONS`.

---

## 4. Input Validation & Bounds Checking

### 1. Query Parameter Hardening on `/api/time-series/global`
* **Integer Bounds:** `days: Optional[int] = Query(None, ge=1, le=1000)`  
  *Prevents integer overflow, negative offset indexing, or denial-of-service via huge allocations.*
* **Date Pattern Validation:** `start_date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$")` and `end_date` with identical pattern.  
  *Blocks malformed string injection and unexpected date syntax.*
* **Chronological Ordering Enforcement:**
  ```python
  if s_date and e_date and s_date > e_date:
      raise HTTPException(
          status_code=400,
          detail=f"start_date ({s_date}) cannot be later than end_date ({e_date})"
      )
  ```
  *Returns an explicit HTTP 400 Bad Request if start date is chronologically after end date.*

### 2. Sovereign Summaries Bounding on `/api/countries`
* `limit: int = Query(50, ge=1, le=250)`  
  *Prevents querying beyond the maximum 217 sovereign territories in the dataset.*

### 3. Non-Negative Clamping on Predictions
* `/api/forecast/next-day` sanitizes all output prediction values to ensure strictly non-negative integers (`max(0, ...)`), preventing impossible negative counts from reaching client dashboards.

---

## 5. Filesystem & Path Traversal Prevention

* All datasets and model binaries are referenced exclusively via hardcoded absolute paths:
  ```python
  BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
  PROCESSED_DIR = os.path.join(BASE_DIR, "DATA", "processed")
  GLOBAL_CSV_PATH = os.path.join(PROCESSED_DIR, "daily_global_hotspots.csv")
  COUNTRY_CSV_PATH = os.path.join(PROCESSED_DIR, "annual_country_summaries_2025.csv")
  ```
* **Zero User Input File Access:** No API endpoint accepts filenames, file paths, or directories from client requests. Arbitrary file read, local file inclusion (LFI), or directory traversal attacks are completely mitigated by design.

---

## 6. Residual Risks & Production Deployment Considerations

1. **Localhost Scope:** The application is configured for a local hackathon evaluation environment (`http://127.0.0.1:8000`). If deploying to a public cloud environment in the future:
   * HTTPS/TLS certificates must be provisioned (e.g. via Let's Encrypt / reverse proxy).
   * Rate limiting middleware (e.g. `slowapi`) should be attached to prevent volumetric request floods.
   * `ALLOWED_ORIGINS` should be set to the exact production domain.
2. **Read-Only Architecture:** Because GeoSense AI does not collect user data, authenticate users, or execute database writes, common web vulnerabilities such as SQL injection, CSRF, and session hijacking are non-applicable.
