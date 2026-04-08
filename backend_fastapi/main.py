from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routes import precare, assistant, disease, post_harvest, auction
from db.mongo import connect_to_mongo, close_mongo_connection
import uvicorn

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    await connect_to_mongo()
    yield
    # Shutdown logic
    await close_mongo_connection()

app = FastAPI(
    title="AgriCare AI Backend", 
    description="AI-powered farming assistant backend with MongoDB integration",
    lifespan=lifespan
)

import os

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(precare.router, prefix="/api/precare", tags=["Pre-Care"])
app.include_router(assistant.router, prefix="/api/assistant", tags=["Assistant"])
app.include_router(disease.router, prefix="/api/disease", tags=["Disease detection"])
app.include_router(post_harvest.router, prefix="/api/post-harvest", tags=["Post-Harvest"])
app.include_router(auction.router, prefix="/api/auction", tags=["Auction Hall"])

@app.get("/")
async def root():
    return {"message": "Welcome to AgriCare AI Assistant API (MongoDB Version)", "status": "running"}

if __name__ == "__main__":
    # Corrected local import for relative run
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
