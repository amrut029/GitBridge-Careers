import os
import secrets
from datetime import datetime, timedelta
import urllib.parse

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from passlib.context import CryptContext
from jose import jwt, JWTError
import httpx
from bson import ObjectId

from database import get_users_collection
from schemas import RegisterUser, LoginUser

# =========================================================
# LOAD ENV
# =========================================================
load_dotenv()

# =========================================================
# ROUTER
# =========================================================
router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

# =========================================================
# ENVIRONMENT VARIABLES
# =========================================================
JWT_SECRET = os.getenv("JWT_SECRET", "GitBridge_Super_Secret_Key_2026_Change_This_987654321")
JWT_ALGORITHM = "HS256"

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI",
    "http://localhost:8000/api/auth/google/callback"
)

# =========================================================
# PASSWORD HASHING
# =========================================================
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# =========================================================
# JWT HELPERS
# =========================================================
def create_access_token(user_id: str):
    if not JWT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="JWT_SECRET is missing"
        )

    expire_time = datetime.utcnow() + timedelta(days=7)
    payload = {
        "sub": str(user_id),
        "exp": expire_time
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_oauth_state():
    """Creates a signed JWT state token for Google OAuth CSRF protection without cookies."""
    payload = {
        "purpose": "google_login",
        "nonce": secrets.token_urlsafe(16),
        "exp": datetime.utcnow() + timedelta(minutes=15)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_oauth_state(state: str):
    """Verifies the signed state parameter returned from Google."""
    try:
        data = jwt.decode(state, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return data.get("purpose") == "google_login"
    except Exception:
        return False

# =========================================================
# REGISTER USER
# =========================================================
@router.post("/register")
def register_user(user: RegisterUser):
    users_collection = get_users_collection()
    if users_collection is None:
        raise HTTPException(
            status_code=500,
            detail="Database is not connected"
        )

    existing_user = users_collection.find_one({
        "email": user.email.lower()
    })

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = pwd_context.hash(user.password)

    new_user = {
        "name": user.name,
        "email": user.email.lower(),
        "password": hashed_password,
        "provider": "email",
        "created_at": datetime.utcnow()
    }

    result = users_collection.insert_one(new_user)
    token = create_access_token(str(result.inserted_id))

    return {
        "message": "Registration successful",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(result.inserted_id),
            "name": user.name,
            "email": user.email.lower(),
            "provider": "email"
        }
    }

# =========================================================
# NORMAL LOGIN
# =========================================================
@router.post("/login")
def login_user(user: LoginUser):
    users_collection = get_users_collection()
    if users_collection is None:
        raise HTTPException(
            status_code=500,
            detail="Database is not connected"
        )

    existing_user = users_collection.find_one({
        "email": user.email.lower()
    })

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if existing_user.get("provider") == "google" and not existing_user.get("password"):
        raise HTTPException(
            status_code=400,
            detail="Please login using Google"
        )

    password_hash = existing_user.get("password")
    if not password_hash or not pwd_context.verify(user.password, password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token(str(existing_user["_id"]))

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(existing_user["_id"]),
            "name": existing_user.get("name"),
            "email": existing_user.get("email"),
            "provider": existing_user.get("provider", "email")
        }
    }

# =========================================================
# GOOGLE LOGIN INITIATION
# =========================================================
@router.get("/google")
def google_login():
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Google OAuth is not configured in backend/.env"
        )

    state = create_oauth_state()

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "select_account"
    }

    google_auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=google_auth_url)

# =========================================================
# GOOGLE CALLBACK (BULLETPROOF CSRF VERIFICATION)
# =========================================================
@router.get("/google/callback")
async def google_callback(code: str = None, state: str = None, error: str = None):
    if error:
        print(f"❌ Google Login error from provider: {error}")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=google_cancelled")

    if not code or not state:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=missing_code_or_state")

    # 1. Verify CSRF state signature
    if not verify_oauth_state(state):
        print("❌ Google Login Error: Invalid or expired OAuth state (CSRF Protection)")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=csrf_state_mismatch")

    try:
        # 2. Exchange code for Google tokens
        async with httpx.AsyncClient(timeout=30) as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": GOOGLE_REDIRECT_URI
                },
                headers={"Accept": "application/json"}
            )

            if token_response.status_code != 200:
                print(f"❌ Google Token Exchange Failed: {token_response.text}")
                return RedirectResponse(url=f"{FRONTEND_URL}/login?error=google_token_exchange_failed")

            token_data = token_response.json()
            access_token = token_data.get("access_token")

            # 3. Fetch Google User Profile
            user_response = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )

            if user_response.status_code != 200:
                print(f"❌ Google Userinfo Failed: {user_response.text}")
                return RedirectResponse(url=f"{FRONTEND_URL}/login?error=google_userinfo_failed")

            user_info = user_response.json()

        email = user_info.get("email")
        name = user_info.get("name") or email.split("@")[0]
        google_id = user_info.get("sub")

        if not email:
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=google_email_missing")

        # 4. Save/Update in MongoDB
        users_collection = get_users_collection()
        if users_collection is None:
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=database_connection_failed")

        existing_user = users_collection.find_one({"email": email.lower()})

        if not existing_user:
            new_user = {
                "name": name,
                "email": email.lower(),
                "google_id": google_id,
                "provider": "google",
                "created_at": datetime.utcnow()
            }
            result = users_collection.insert_one(new_user)
            user_id = str(result.inserted_id)
        else:
            user_id = str(existing_user["_id"])
            users_collection.update_one(
                {"_id": existing_user["_id"]},
                {
                    "$set": {
                        "google_id": google_id,
                        "name": name or existing_user.get("name", "User"),
                        "provider": "google"
                    }
                }
            )

        # 5. Generate GitBridge JWT Token
        jwt_token = create_access_token(user_id)

        # 6. Redirect to frontend dashboard with token
        return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?token={jwt_token}")

    except Exception as exc:
        print(f"❌ Google Callback Unexpected Error: {exc}")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=google_auth_exception")

# =========================================================
# GET CURRENT / SPECIFIC USER
# =========================================================
@router.get("/user/{user_id}")
def get_user(user_id: str):
    users_collection = get_users_collection()
    if users_collection is None:
        raise HTTPException(
            status_code=500,
            detail="Database is not connected"
        )

    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
        "provider": user.get("provider")
    }
