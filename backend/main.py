from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from auth import router as auth_router
from dashboard import router as dashboard_router
from database import connect_database, close_database


app = FastAPI(
    title="GitBridge API"
)


# SESSION
app.add_middleware(
    SessionMiddleware,
    secret_key="gitbridge_super_secret_key_123456"
)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ROUTERS
app.include_router(auth_router)
app.include_router(dashboard_router)


@app.on_event("startup")
def startup_database():

    print("🚀 Starting GitBridge API...")

    success = connect_database()

    if success:
        print("✅ MongoDB Connected Successfully!")
    else:
        print("❌ MongoDB Connection Failed!")


@app.on_event("shutdown")
def shutdown_database():

    close_database()


@app.get("/")
def home():

    return {
        "message": "GitBridge API Running Successfully"
    }


@app.get("/health")
def health():

    return {
        "status": "healthy"
    }