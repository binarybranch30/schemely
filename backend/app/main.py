from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

from app.api.routes import router

app = FastAPI(title="Schemely", version="1.0.0", description="Sample scheme catalog and illustrative eligibility matching.")
app.include_router(router)


@app.middleware("http")
async def prevent_profile_caching(request: Request, call_next):
    response = await call_next(request)
    if request.url.path == "/api/eligibility/check":
        response.headers["Cache-Control"] = "no-store"
    return response


@app.exception_handler(RequestValidationError)
async def validation_error(_request: Request, exc: RequestValidationError):
    issues = [{"path": list(error["loc"]), "message": error["msg"]} for error in exc.errors()]
    return JSONResponse({"detail": "Check the submitted fields.", "issues": issues}, status_code=422)


@app.exception_handler(OperationalError)
async def unavailable(_request: Request, _exc: OperationalError):
    return JSONResponse({"detail": "The catalog database is unavailable."}, status_code=503)
