import os
import secrets
from datetime import datetime, timedelta
from pathlib import Path
import httpx
from bson import ObjectId
from fastapi import (
    APIRouter,
    HTTPException,
    UploadFile,
    File,
    Header,
    Body
)
from fastapi.responses import RedirectResponse
from jose import jwt, JWTError
from dotenv import load_dotenv

from database import get_users_collection
from resume_service import extract_pdf_text, extract_docx_text, calculate_ats_score

load_dotenv()

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)

JWT_SECRET = os.getenv("JWT_SECRET", "GitBridge_Super_Secret_Key_2026_Change_This_987654321")
JWT_ALGORITHM = "HS256"

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_REDIRECT_URI = os.getenv(
    "GITHUB_REDIRECT_URI",
    "http://localhost:8000/api/dashboard/github/callback"
)

UPLOAD_DIR = Path("uploads/resumes")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# =========================================================
# AUTHENTICATION DEPENDENCY
# =========================================================
def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authentication token required. Please log in."
        )

    token = authorization.replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format."
        )

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid session token.")

        users = get_users_collection()
        if users is None:
            raise HTTPException(status_code=500, detail="Database is not connected.")

        user = users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found.")

        return user

    except (JWTError, Exception) as err:
        if isinstance(err, HTTPException):
            raise err
        raise HTTPException(status_code=401, detail="Session expired or invalid token.")


def serialize_user(user):
    github = user.get("github")
    safe_github = None
    if github:
        safe_github = {k: v for k, v in github.items() if k != "access_token"}
        safe_github["has_private_access"] = bool(github.get("access_token"))

    return {
        "id": str(user["_id"]),
        "name": user.get("name") or user.get("email", "").split("@")[0],
        "email": user.get("email"),
        "github": safe_github,
        "resume": user.get("resume"),
        "roast": user.get("roast"),
        "notifications": user.get("notifications", [])
    }


def create_github_oauth_state(user_id: str):
    payload = {
        "sub": str(user_id),
        "purpose": "github_connect",
        "nonce": secrets.token_urlsafe(16),
        "exp": datetime.utcnow() + timedelta(minutes=15)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


# =========================================================
# GITHUB DATA FETCHER (SUPPORTS BOTH PUBLIC & PRIVATE REPOS)
# =========================================================
async def fetch_github_user_data(username: str = None, access_token: str = None):
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "GitBridge-App"
    }

    token = access_token or os.getenv("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    async with httpx.AsyncClient(timeout=30) as client:
        # 1. Fetch Profile
        if token:
            profile_res = await client.get("https://api.github.com/user", headers=headers)
        else:
            clean_username = username.strip().lstrip("@")
            profile_res = await client.get(f"https://api.github.com/users/{clean_username}", headers=headers)

        if profile_res.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail=f"GitHub user '{username}' was not found on GitHub."
            )
        elif profile_res.status_code == 401:
            raise HTTPException(
                status_code=401,
                detail="GitHub Token is invalid or expired."
            )
        elif profile_res.status_code >= 400:
            raise HTTPException(
                status_code=profile_res.status_code,
                detail=f"GitHub API error: {profile_res.text}"
            )

        profile = profile_res.json()
        current_username = profile.get("login")

        # 2. Fetch Repositories (Public + Private if token provided)
        if token:
            repos_res = await client.get(
                "https://api.github.com/user/repos",
                headers=headers,
                params={
                    "visibility": "all",
                    "affiliation": "owner,collaborator",
                    "sort": "updated",
                    "direction": "desc",
                    "per_page": 100
                }
            )
        else:
            repos_res = await client.get(
                f"https://api.github.com/users/{current_username}/repos",
                headers=headers,
                params={"per_page": 100, "sort": "updated", "direction": "desc"}
            )

        repos = repos_res.json() if repos_res.status_code == 200 else []

    total_stars = sum(int(r.get("stargazers_count", 0)) for r in repos)
    total_forks = sum(int(r.get("forks_count", 0)) for r in repos)
    private_count = sum(1 for r in repos if r.get("private"))

    languages = {}
    for r in repos:
        lang = r.get("language")
        if lang:
            languages[lang] = languages.get(lang, 0) + 1

    clean_repos = []
    for r in repos[:30]:
        clean_repos.append({
            "id": r.get("id"),
            "name": r.get("name"),
            "full_name": r.get("full_name"),
            "description": r.get("description") or "No description provided.",
            "html_url": r.get("html_url"),
            "language": r.get("language") or "Code",
            "stargazers_count": r.get("stargazers_count", 0),
            "forks_count": r.get("forks_count", 0),
            "updated_at": r.get("updated_at"),
            "private": bool(r.get("private")),
            "visibility": "Private" if r.get("private") else "Public"
        })

    return {
        "username": current_username,
        "connected": True,
        "access_token": token if access_token else None,
        "profile": {
            "avatar_url": profile.get("avatar_url"),
            "name": profile.get("name") or current_username,
            "login": current_username,
            "bio": profile.get("bio") or "",
            "html_url": profile.get("html_url"),
            "followers": profile.get("followers", 0),
            "following": profile.get("following", 0),
            "public_repos": profile.get("public_repos", 0),
            "total_private_repos": profile.get("total_private_repos", private_count),
            "location": profile.get("location") or "",
            "company": profile.get("company") or ""
        },
        "stats": {
            "repositories": len(repos),
            "private_repositories": private_count,
            "public_repositories": len(repos) - private_count,
            "stars": total_stars,
            "forks": total_forks,
            "followers": profile.get("followers", 0),
            "following": profile.get("following", 0),
            "languages": languages
        },
        "repositories": clean_repos,
        "last_synced": datetime.utcnow().isoformat()
    }

# =========================================================
# GET DASHBOARD (ME)
# =========================================================
@router.get("/me")
def get_dashboard(authorization: str = Header(None)):
    user = get_current_user(authorization)
    return serialize_user(user)

# =========================================================
# CONNECT / CHANGE GITHUB PROFILE (USERNAME OR TOKEN)
# =========================================================
@router.post("/github/connect")
async def connect_github(
    payload: dict = Body(...),
    authorization: str = Header(None)
):
    user = get_current_user(authorization)
    username = payload.get("username", "").strip()
    token = payload.get("token", "").strip()

    if not username and not token:
        raise HTTPException(status_code=400, detail="Please provide a GitHub username or Access Token.")

    github_data = await fetch_github_user_data(username=username, access_token=token or None)
    github_data["connected_at"] = datetime.utcnow().isoformat()

    users = get_users_collection()

    has_private = bool(github_data.get("stats", {}).get("private_repositories", 0) > 0)
    notification = {
        "id": f"gh_{int(datetime.utcnow().timestamp())}",
        "title": "GitHub Connected",
        "message": f"Connected @{github_data['username']} ({github_data['stats']['repositories']} repos{', including private' if has_private else ''}).",
        "time": datetime.utcnow().isoformat(),
        "read": False
    }

    users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "github": github_data,
                "updated_at": datetime.utcnow().isoformat()
            },
            "$push": {
                "notifications": {
                    "$each": [notification],
                    "$position": 0,
                    "$slice": 15
                }
            }
        }
    )

    safe_response = {k: v for k, v in github_data.items() if k != "access_token"}
    safe_response["has_private_access"] = bool(token)

    return {
        "message": f"GitHub account @{github_data['username']} connected successfully!",
        "github": safe_response
    }

# =========================================================
# GITHUB OAUTH (FOR 1-CLICK PRIVATE + PUBLIC AUTHORIZATION)
# =========================================================
@router.get("/github/connect-url")
def github_connect_url(authorization: str = Header(None)):
    user = get_current_user(authorization)

    if not GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=400,
            detail="GitHub OAuth is not configured in backend/.env. You can connect using GitHub Username or Personal Access Token directly."
        )

    state = create_github_oauth_state(user["_id"])
    url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&redirect_uri={GITHUB_REDIRECT_URI}"
        f"&scope=read:user%20repo"
        f"&state={state}"
        "&prompt=consent"
    )

    return {"url": url}

@router.get("/github/callback")
async def github_callback(code: str = None, state: str = None, error: str = None):
    if error or not code or not state:
        return RedirectResponse(f"{FRONTEND_URL}/dashboard?github_error=cancelled")

    try:
        state_data = jwt.decode(state, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if state_data.get("purpose") != "github_connect":
            return RedirectResponse(f"{FRONTEND_URL}/dashboard?github_error=invalid_state")
        user_id = state_data.get("sub")
    except Exception:
        return RedirectResponse(f"{FRONTEND_URL}/dashboard?github_error=expired_state")

    async with httpx.AsyncClient(timeout=30) as client:
        token_res = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": GITHUB_REDIRECT_URI
            }
        )

        token_data = token_res.json()
        access_token = token_data.get("access_token")

    if not access_token:
        return RedirectResponse(f"{FRONTEND_URL}/dashboard?github_error=no_token")

    github_data = await fetch_github_user_data(access_token=access_token)
    github_data["connected_at"] = datetime.utcnow().isoformat()

    users = get_users_collection()
    users.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "github": github_data,
                "updated_at": datetime.utcnow().isoformat()
            }
        }
    )

    return RedirectResponse(f"{FRONTEND_URL}/dashboard?github=connected")

# =========================================================
# REFRESH GITHUB LIVE DATA
# =========================================================
@router.post("/github/refresh")
async def refresh_github(authorization: str = Header(None)):
    user = get_current_user(authorization)
    existing_github = user.get("github")

    if not existing_github or not existing_github.get("username"):
        raise HTTPException(status_code=400, detail="No GitHub account connected to refresh.")

    saved_token = existing_github.get("access_token")
    fresh_github = await fetch_github_user_data(
        username=existing_github["username"],
        access_token=saved_token
    )
    fresh_github["connected_at"] = existing_github.get("connected_at", fresh_github["last_synced"])

    users = get_users_collection()
    users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "github": fresh_github,
                "updated_at": datetime.utcnow().isoformat()
            }
        }
    )

    safe_response = {k: v for k, v in fresh_github.items() if k != "access_token"}
    safe_response["has_private_access"] = bool(saved_token)
    return safe_response

# =========================================================
# DISCONNECT GITHUB
# =========================================================
@router.delete("/github")
def disconnect_github(authorization: str = Header(None)):
    user = get_current_user(authorization)
    users = get_users_collection()

    users.update_one(
        {"_id": user["_id"]},
        {
            "$unset": {
                "github": "",
                "roast": ""
            }
        }
    )

    return {"message": "GitHub account disconnected successfully."}

# =========================================================
# UPLOAD / UPDATE RESUME
# =========================================================
@router.post("/resume")
async def upload_resume(
    file: UploadFile = File(...),
    authorization: str = Header(None)
):
    user = get_current_user(authorization)

    allowed_extensions = {".pdf", ".doc", ".docx"}
    ext = Path(file.filename or "").suffix.lower()

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PDF, DOC, and DOCX files are allowed."
        )

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File is too large. Maximum allowed size is 5MB."
        )

    old_resume = user.get("resume")
    if old_resume and old_resume.get("path"):
        old_file = Path(old_resume["path"])
        if old_file.exists():
            try:
                old_file.unlink()
            except Exception:
                pass

    safe_filename = f"{user['_id']}_{int(datetime.utcnow().timestamp())}{ext}"
    dest_path = UPLOAD_DIR / safe_filename
    dest_path.write_bytes(content)

    extracted_text = ""
    try:
        if ext == ".pdf":
            with open(dest_path, "rb") as f:
                extracted_text = extract_pdf_text(f)
        elif ext in (".doc", ".docx"):
            with open(dest_path, "rb") as f:
                extracted_text = extract_docx_text(f)
    except Exception as parse_err:
        print(f"⚠️ Resume parsing error: {parse_err}")
        extracted_text = ""

    ats_data = calculate_ats_score(extracted_text)

    resume_data = {
        "original_name": file.filename,
        "path": str(dest_path),
        "size": len(content),
        "uploaded_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "ats_score": ats_data.get("score", 70),
        "skills": ats_data.get("skills", []),
        "feedback": ats_data.get("feedback", ["Resume uploaded successfully."]),
        "preview_length": len(extracted_text)
    }

    notification = {
        "id": f"res_{int(datetime.utcnow().timestamp())}",
        "title": "Resume Uploaded",
        "message": f"Resume '{file.filename}' uploaded and analyzed successfully.",
        "time": datetime.utcnow().isoformat(),
        "read": False
    }

    users = get_users_collection()
    users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "resume": resume_data,
                "updated_at": datetime.utcnow().isoformat()
            },
            "$push": {
                "notifications": {
                    "$each": [notification],
                    "$position": 0,
                    "$slice": 15
                }
            }
        }
    )

    return {
        "message": "Resume saved and analyzed successfully!",
        "resume": resume_data
    }

# =========================================================
# GENERATE AI ROAST (LOCKED UNTIL GITHUB + RESUME EXIST)
# =========================================================
@router.post("/roast")
def generate_roast_endpoint(authorization: str = Header(None)):
    user = get_current_user(authorization)

    github = user.get("github")
    resume = user.get("resume")

    if not github or not github.get("username"):
        raise HTTPException(
            status_code=400,
            detail="Connect your GitHub account first before generating a roast."
        )

    if not resume:
        raise HTTPException(
            status_code=400,
            detail="Upload your resume first before generating a roast."
        )

    username = github.get("username", "developer")
    stats = github.get("stats", {})
    repo_count = stats.get("repositories", 0)
    stars = stats.get("stars", 0)
    forks = stats.get("forks", 0)
    followers = stats.get("followers", 0)
    private_count = stats.get("private_repositories", 0)
    languages = list(stats.get("languages", {}).keys())
    top_language = languages[0] if languages else "Markdown"

    resume_skills = resume.get("skills", [])
    ats_score = resume.get("ats_score", 70)

    punchlines = []

    if repo_count == 0:
        punchlines.append(
            f"@{username}, you connected your GitHub with 0 repositories! Even your README is waiting for its first commit. 😂🔥"
        )
    elif repo_count < 4:
        punchlines.append(
            f"{repo_count} repositories? That's not a portfolio, that's a weekend trial version of coding. 🎵"
        )
    elif repo_count > 25:
        punchlines.append(
            f"{repo_count} repositories?! At this point even you don't know what half of them do. Looks like a productivity graveyard! 💀🚀"
        )
    else:
        punchlines.append(
            f"{repo_count} repositories with {stars} stars... your GitHub has potential, like a phone on 1% battery fighting for its life! 🔋😂"
        )

    if private_count > 0:
        punchlines.append(
            f"I see you have {private_count} private repos... hiding all the unfinished tutorial projects, aren't you? 🤫"
        )

    if stars == 0:
        punchlines.append("Not a single star yet? Don't worry, your own mom would star your repo if she had GitHub. ⭐")
    elif stars < 5:
        punchlines.append(f"{stars} stars? One of them is probably your alternate account, admit it! 😉")

    if resume_skills:
        skill_sample = ", ".join(resume_skills[:3])
        punchlines.append(
            f"Your resume claims expertise in {skill_sample}, but your commits say 'I will fix it tomorrow'. 😎"
        )

    punchlines.append("Verdict: Keep shipping code, stop tweaking your CSS, and push to main! 🚀🔥")

    roast_text = " ".join(punchlines)

    roast_data = {
        "text": roast_text,
        "created_at": datetime.utcnow().isoformat(),
        "repo_count": repo_count,
        "stars": stars,
        "ats_score": ats_score
    }

    notification = {
        "id": f"rst_{int(datetime.utcnow().timestamp())}",
        "title": "AI Roast Ready",
        "message": "Your personalized AI developer roast is ready! 🔥",
        "time": datetime.utcnow().isoformat(),
        "read": False
    }

    users = get_users_collection()
    users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "roast": roast_data,
                "updated_at": datetime.utcnow().isoformat()
            },
            "$push": {
                "notifications": {
                    "$each": [notification],
                    "$position": 0,
                    "$slice": 15
                }
            }
        }
    )

    return roast_data

# =========================================================
# CLEAR NOTIFICATIONS
# =========================================================
@router.post("/notifications/clear")
def clear_notifications(authorization: str = Header(None)):
    user = get_current_user(authorization)
    users = get_users_collection()

    users.update_one(
        {"_id": user["_id"]},
        {"$set": {"notifications": []}}
    )
    return {"message": "Notifications cleared."}
