from fastapi import FastAPI
from app.api.routes import router
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import ensure_database_ready
from app.services.orchestrator import run_pipeline

app = FastAPI(
    title="Space Debris Tracking API",
    version="1.0.0"
)

@app.on_event("startup")
def startup():
    ensure_database_ready()
    run_pipeline()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://space-debris-dashboard-mocha.vercel.app"
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)