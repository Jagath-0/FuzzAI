"""
AI-Powered Fuzz Testing Tool — FastAPI Backend
Entry point: main.py
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.fuzz import router as fuzz_router

app = FastAPI(title="FuzzAI API", version="1.0.0")

# Allow the Vite dev server to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fuzz_router)


@app.get("/health")
async def health():
    return {"status": "ok", "message": "FuzzAI backend is running 🚀"}
