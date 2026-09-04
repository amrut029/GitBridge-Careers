import os
from datetime import datetime
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
    """Format user data for safe JSON response."""
    return {
        "id": str(user["_id"]),
        "name": user.get("name") or user.get("email", "").split("@")[0],
        "email": user.get("email"),
        "github": user.get("github"),
        "resume": user.get("resume"),
        "roast": user.get("roast"),
        "notifications": user.get("notifications", [])
    }

# =========================================================
# GITHUB DATA FETCHER (PUBLIC REST API)
# =========================================================
async def fetch_github_user_data(username: str):
    clean_username = username.strip().lstrip("@")
    if not clean_username:
        raise HTTPException(status_code=400, detail="GitHub username cannot be empty.")

    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "GitBridge-App"
    }

    gh_token = os.getenv("GITHUB_TOKEN")
    if gh_token:
        headers["Authorization"] = f"Bearer {gh_token}"

    async with httpx.AsyncClient(timeout=25) as client:
        # 1. Fetch Profile
        profile_res = await client.get(
            f"https://api.github.com/users/{clean_username}",
            headers=headers
        )

        if profile_res.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail=f"GitHub user '@{clean_username}' was not found on GitHub."
            )
        elif profile_res.status_code >= 400:
            raise HTTPException(
                status_code=profile_res.status_code,
                detail=f"GitHub API error: {profile_res.text}"
            )

        profile = profile_res.json()

        # 2. Fetch Repositories (up to 100)
        repos_res = await client.get(
            f"https://api.github.com/users/{clean_username}/repos",
            headers=headers,
            params={"per_page": 100, "sort": "updated", "direction": "desc"}
        )

        repos = repos_res.json() if repos_res.status_code == 200 else []

    # Calculate statistics
    total_stars = sum(int(r.get("stargazers_count", 0)) for r in repos)
    total_forks = sum(int(r.get("forks_count", 0)) for r in repos)

    languages = {}
    for r in repos:
        lang = r.get("language")
        if lang:
            languages[lang] = languages.get(lang, 0) + 1

    clean_repos = []
    for r in repos[:15]:
        clean_repos.append({
            "id": r.get("id"),
            "name": r.get("name"),
            "full_name": r.get("full_name"),
            "description": r.get("description") or "No description provided.",
            "html_url": r.get("html_url"),
            "language": r.get("language") or "Markdown/Other",
            "stargazers_count": r.get("stargazers_count", 0),
            "forks_count": r.get("forks_count", 0),
            "updated_at": r.get("updated_at"),
            "private": r.get("private", False)
        })

    return {
        "username": profile.get("login"),
        "connected": True,
        "profile": {
            "avatar_url": profile.get("avatar_url"),
            "name": profile.get("name") or profile.get("login"),
            "login": profile.get("login"),
            "bio": profile.get("bio") or "",
            "html_url": profile.get("html_url"),
            "followers": profile.get("followers", 0),
            "following": profile.get("following", 0),
            "public_repos": profile.get("public_repos", 0),
            "location": profile.get("location") or "",
            "company": profile.get("company") or ""
        },
        "stats": {
            "repositories": len(repos),
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
# CONNECT / CHANGE GITHUB PROFILE
# =========================================================
@router.post("/github/connect")
async def connect_github(
    payload: dict = Body(...),
    authorization: str = Header(None)
):
    user = get_current_user(authorization)
    username = payload.get("username", "").strip()

    if not username:
        raise HTTPException(status_code=400, detail="Please provide a GitHub username.")

    github_data = await fetch_github_user_data(username)
    github_data["connected_at"] = datetime.utcnow().isoformat()

    users = get_users_collection()

    notification = {
        "id": f"gh_{int(datetime.utcnow().timestamp())}",
        "title": "GitHub Connected",
        "message": f"GitHub profile @{github_data['username']} connected successfully.",
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

    return {
        "message": f"GitHub account @{github_data['username']} connected successfully!",
        "github": github_data
    }

# =========================================================
# REFRESH GITHUB LIVE DATA
# =========================================================
@router.post("/github/refresh")
async def refresh_github(authorization: str = Header(None)):
    user = get_current_user(authorization)
    existing_github = user.get("github")

    if not existing_github or not existing_github.get("username"):
        raise HTTPException(status_code=400, detail="No GitHub account connected to refresh.")

    fresh_github = await fetch_github_user_data(existing_github["username"])
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

    return fresh_github

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
    languages = list(stats.get("languages", {}).keys())
    top_language = languages[0] if languages else "Markdown"

    resume_skills = resume.get("skills", [])
    ats_score = resume.get("ats_score", 70)

    punchlines = []

    if repo_count == 0:
        punchlines.append(
            f"@{username}, you connected your GitHub with 0 public repositories! Even your README is waiting for its first commit. 😂🔥"
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
