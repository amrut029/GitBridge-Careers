import os

from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Request

from fastapi.responses import RedirectResponse

from dotenv import load_dotenv

from passlib.context import CryptContext

from jose import jwt

from authlib.integrations.starlette_client import OAuth

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

JWT_SECRET = os.getenv("JWT_SECRET")

JWT_ALGORITHM = "HS256"


FRONTEND_URL = os.getenv(

    "FRONTEND_URL",

    "http://localhost:5173"

)


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
# OAUTH
# =========================================================

oauth = OAuth()


# =========================================================
# GOOGLE OAUTH CONFIGURATION
# =========================================================

if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:

    oauth.register(

        name="google",

        client_id=GOOGLE_CLIENT_ID,

        client_secret=GOOGLE_CLIENT_SECRET,

        server_metadata_url=(
            "https://accounts.google.com/"
            ".well-known/openid-configuration"
        ),

        client_kwargs={

            "scope": "openid email profile"

        }

    )


# =========================================================
# CREATE JWT TOKEN
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

    token = jwt.encode(

        payload,

        JWT_SECRET,

        algorithm=JWT_ALGORITHM

    )

    return token


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


    existing_user = users_collection.find_one(

        {

            "email": user.email.lower()

        }

    )


    if existing_user:

        raise HTTPException(

            status_code=400,

            detail="Email already registered"

        )


    hashed_password = pwd_context.hash(

        user.password

    )


    new_user = {

        "name": user.name,

        "email": user.email.lower(),

        "password": hashed_password,

        "provider": "email",

        "created_at": datetime.utcnow()

    }


    result = users_collection.insert_one(

        new_user

    )


    token = create_access_token(

        str(result.inserted_id)

    )


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


    existing_user = users_collection.find_one(

        {

            "email": user.email.lower()

        }

    )


    if not existing_user:

        raise HTTPException(

            status_code=401,

            detail="Invalid email or password"

        )


    if existing_user.get("provider") == "google":

        raise HTTPException(

            status_code=400,

            detail="Please login using Google"

        )


    password_hash = existing_user.get("password")


    if (

        not password_hash

        or not pwd_context.verify(

            user.password,

            password_hash

        )

    ):

        raise HTTPException(

            status_code=401,

            detail="Invalid email or password"

        )


    token = create_access_token(

        str(existing_user["_id"])

    )


    return {

        "message": "Login successful",

        "access_token": token,

        "token_type": "bearer",

        "user": {

            "id": str(existing_user["_id"]),

            "name": existing_user.get("name"),

            "email": existing_user.get("email"),

            "provider": existing_user.get(

                "provider",

                "email"

            )

        }

    }


# =========================================================
# GOOGLE LOGIN
# =========================================================

@router.get("/google")

async def google_login(request: Request):

    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:

        raise HTTPException(

            status_code=500,

            detail="Google OAuth is not configured"

        )


    return await oauth.google.authorize_redirect(

        request,

        GOOGLE_REDIRECT_URI

    )


# =========================================================
# GOOGLE CALLBACK
# =========================================================

@router.get("/google/callback")

async def google_callback(request: Request):

    try:

        token = await oauth.google.authorize_access_token(

            request

        )


        user_info = token.get("userinfo")


        if not user_info:

            user_info = await oauth.google.parse_id_token(

                request,

                token

            )


        email = user_info.get("email")

        name = user_info.get("name")

        google_id = user_info.get("sub")


        if not email:

            raise HTTPException(

                status_code=400,

                detail="Google did not provide email"

            )


        users_collection = get_users_collection()


        if users_collection is None:

            raise HTTPException(

                status_code=500,

                detail="Database is not connected"

            )


        existing_user = users_collection.find_one(

            {

                "email": email.lower()

            }

        )


        # =============================================
        # CREATE NEW GOOGLE USER
        # =============================================

        if not existing_user:


            new_user = {

                "name": name or "Google User",

                "email": email.lower(),

                "google_id": google_id,

                "provider": "google",

                "created_at": datetime.utcnow()

            }


            result = users_collection.insert_one(

                new_user

            )


            user_id = str(

                result.inserted_id

            )


        # =============================================
        # EXISTING USER
        # =============================================

        else:


            user_id = str(

                existing_user["_id"]

            )


            users_collection.update_one(

                {

                    "_id": existing_user["_id"]

                },

                {

                    "$set": {

                        "google_id": google_id,

                        "name": (

                            name

                            or existing_user.get("name")

                        )

                    }

                }

            )


        # =============================================
        # CREATE JWT
        # =============================================

        jwt_token = create_access_token(

            user_id

        )


        # =============================================
        # REDIRECT FRONTEND
        # =============================================

        redirect_url = (

            f"{FRONTEND_URL}"

            f"/google-success"

            f"?token={jwt_token}"

        )


        return RedirectResponse(

            url=redirect_url

        )


    except HTTPException:

        raise


    except Exception as error:


        print("❌ Google Login Error:")

        print(error)


        return RedirectResponse(

            url=(

                f"{FRONTEND_URL}"

                f"/login?error=google_login_failed"

            )

        )


# =========================================================
# GET USER
# =========================================================

@router.get("/user/{user_id}")

def get_user(user_id: str):

    from bson import ObjectId


    users_collection = get_users_collection()


    if users_collection is None:

        raise HTTPException(

            status_code=500,

            detail="Database is not connected"

        )


    try:

        user = users_collection.find_one(

            {

                "_id": ObjectId(user_id)

            }

        )


    except Exception:

        raise HTTPException(

            status_code=400,

            detail="Invalid user ID"

        )


    if not user:

        raise HTTPException(

            status_code=404,

            detail="User not found"

        )


    return {

        "id": str(user["_id"]),

        "name": user.get("name"),

        "email": user.get("email"),

        "provider": user.get("provider")

    }