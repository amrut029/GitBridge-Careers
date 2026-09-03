from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
from pymongo import MongoClient
import os
import certifi

from auth import router as auth_router

load_dotenv()

app = FastAPI(
    title="GitBridge Careers API"
)

app.add_middleware(
    SessionMiddleware,
    secret_key="gitbridge_super_secret_key_123456"
)

app.include_router(auth_router)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# MongoDB URL
MONGO_URL = os.getenv("MONGO_URL")

client = None
db = None


@app.on_event("startup")
def startup_db_client():
    global client, db

    print("🚀 Starting GitBridge Careers API...")

    if not MONGO_URL:
        print("❌ MONGO_URL not found in .env")
        return

    try:
        client = MongoClient(
            MONGO_URL,
            tls=True,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=10000
        )

        client.admin.command("ping")

        db = client["gitbridge"]

        print("✅ MongoDB Connected Successfully!")

    except Exception as e:
        print("❌ MongoDB Connection Error:")
        print(e)


@app.on_event("shutdown")
def shutdown_db_client():
    global client

    if client:
        client.close()
        print("🔴 MongoDB connection closed")


@app.get("/")
def home():
    return {
        "message": "GitBridge Careers API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "mongodb": "connected" if db is not None else "not connected"
    }