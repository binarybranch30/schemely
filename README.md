# Schemely

Schemely is an independent Indian government scheme discovery demo with 34 seeded records, a five-step questionnaire and explainable recommendations. Confirm current requirements and application channels through official government sources.

## Start with Docker Compose

Install Docker with Compose v2. From the repository root:

```sh
cp .env.example .env
docker compose up --build --wait
```

In PowerShell, use `Copy-Item .env.example .env` for the first command. Open http://127.0.0.1:3000. The FastAPI documentation is at http://127.0.0.1:8000/docs. To stop services while keeping the database volume, run `docker compose down`.

Compose starts PostgreSQL 17, runs Alembic migrations and seeds the catalog before starting FastAPI. Next.js waits for the backend health check. Published ports bind to loopback.

## Run the demo without Docker

Use Python 3.13 and Node.js 22 or later. This workflow uses SQLite by default. From the repository root in PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements-dev.txt
Set-Location backend
..\.venv\Scripts\python.exe -m alembic upgrade head
..\.venv\Scripts\python.exe -m app.services.seed
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

From a second terminal at the repository root:

```powershell
Set-Location frontend
npm.cmd ci
npm.cmd run dev -- --hostname 127.0.0.1
```

On macOS/Linux, use `.venv/bin/python` from the root and `../.venv/bin/python` from the backend directory. Use `npm` in place of `npm.cmd`.

## Three demo profiles

Other answers may be skipped. Expand **Why this status?** on a scheme card to show each check.

| Profile | Answers to enter | Example result |
| --- | --- | --- |
| Rural farmer | 32, Maharashtra, rural, farmer, income ₹90,000, BPL yes, farmer yes, landholding 1.5 ha | PM-KISAN likely eligible |
| College student | 20, Karnataka, urban, student, income ₹150,000, undergraduate, current student yes | PM-USP college scholarship likely eligible |
| Senior citizen | 67, West Bengal, rural, retired, income ₹75,000, BPL yes, farmer no | Indira Gandhi National Old Age Pension Scheme likely eligible |

## Tests

Backend, from `backend/` with development dependencies installed:

```powershell
..\.venv\Scripts\python.exe -m pytest -q
```

Frontend, from `frontend/` with the demo running:

```powershell
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

The browser suite exercises all three profiles through the API, checks explanations and detail navigation, and tests the explorer on a mobile viewport. Set `PLAYWRIGHT_BROWSER_CHANNEL=chrome` to use installed Chrome or `TEST_BASE_URL` to point at another instance.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| GET | /api/health | Backend and database health |
| GET | /api/schemes | Search, filters, sorting and pagination |
| GET | /api/schemes/{id} | Scheme details, rules, documents and sources |
| GET | /api/categories | Catalog categories |
| GET | /api/states | Indian states and union territories |
| POST | /api/eligibility/check | Ranked assessments, explanations and summary counts |

The engine reports the outcome of each rule. A failure takes precedence over missing answers. Missing answers or absent rules produce a possible match when there are no failures. All evaluated rules must pass for a likely match. Results are ordered by status, fewer failures, more passed checks, fewer missing answers, then name and ID. A state filter includes central schemes and records for the selected state. Combine it with the State government level to see state records only.

Profile data lives in React state and in the backend request during evaluation. The backend stores catalog records only. Reloading clears profile answers and results. Eligibility responses use `Cache-Control: no-store`.

The seeder reads `database/seed_data/catalog.tsv`, a pipe-delimited file. It updates entries by ID and reuses unchanged rule, document and source rows. Sample rules, example documents and application guidance are illustrative. Source records link to official references or department portals. Direct application URLs and verification dates are left empty pending verification.

## Integrating verified government data

Start with a small editorially reviewed catalog sourced from myScheme and responsible ministry or state portals. Capture the scheme version, official guideline URL, publication and review dates, geographic scope, application channel and a source citation for each rule. Use a permitted feed when available. Add review tooling for revised policies, expired enrollment windows, broken links and rules that require official beneficiary records.
