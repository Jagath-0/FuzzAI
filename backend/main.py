"""
AI-Powered Fuzz Testing Tool — FastAPI Backend
Entry point: main.py
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.fuzz import router as fuzz_router

import os

app = FastAPI(title="FuzzAI API", version="1.0.0")

# Allow both local dev and deployed frontend
FRONTEND_URL = os.getenv("FRONTEND_URL", "")
allowed_origins = ["http://localhost:5173", "http://localhost:3000"]
if FRONTEND_URL:
    allowed_origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fuzz_router)


@app.get("/health")
async def health():
    return {"status": "ok", "message": "FuzzAI backend is running 🚀"}
