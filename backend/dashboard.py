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
import numpy as np

from database import get_users_collection, get_support_tickets_collection, get_opportunities_collection
from resume_service import extract_pdf_text, extract_docx_text, calculate_ats_score
from ml_service import evaluate_developer_profile

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

# Comprehensive Live Opportunities Catalog with Freshers Focus, Multiple Cities & Hiring Timelines
OPPORTUNITIES_CATALOG = [
    {
        "id": "opp_startup_1",
        "title": "Cloud & DevOps Engineer Intern",
        "company": "Zepto",
        "logo": "⚡",
        "location": "Bengaluru / Mumbai (Hybrid)",
        "city": "Bengaluru",
        "type": "Internship",
        "domain": "devops",
        "stage": "🦄 Quick-Commerce Unicorn",
        "hiring_timeline": "⚡ Hiring Sprint: Q1/Q2 2026 (48-hr turnaround)",
        "stipend": "₹50,000 - ₹65,000 / month",
        "experience": "Freshers (0-1 Yrs) / 2025-2026 Batch",
        "level": "fresher",
        "required_skills": ["Kubernetes", "Docker", "Terraform", "Linux", "CI/CD", "AWS"],
        "description": "Scale 10-minute grocery delivery infrastructure, optimize Kubernetes pod autoscaling, and automate Terraform CI/CD pipelines.",
        "apply_url": "https://www.zeptonow.com/careers",
        "deadline": "Immediate Hiring",
        "featured": True
    },
    {
        "id": "opp_startup_2",
        "title": "Junior Platform & SRE Engineer",
        "company": "Blinkit",
        "logo": "🟡",
        "location": "Gurugram / Delhi-NCR",
        "city": "Delhi-NCR",
        "type": "Full-Time",
        "domain": "devops",
        "stage": "🚀 Zomato Group Startup",
        "hiring_timeline": "Active Now • Batch 2025/2026",
        "stipend": "₹12 - ₹18 LPA",
        "experience": "Freshers (0-1 Yrs)",
        "level": "fresher",
        "required_skills": ["Docker", "Kubernetes", "Linux", "Jenkins", "Terraform", "Shell", "Git"],
        "description": "Maintain sub-second checkout reliability, configure Prometheus/Grafana observability alerts, and manage cloud clusters.",
        "apply_url": "https://blinkit.com/careers",
        "deadline": "Open Now",
        "featured": True
    },
    {
        "id": "opp_startup_3",
        "title": "AI Infrastructure & MLOps Engineer",
        "company": "Sarvam AI",
        "logo": "🧠",
        "location": "Bengaluru / Remote",
        "city": "Bengaluru",
        "type": "Full-Time",
        "domain": "ai_ml",
        "stage": "🚀 Series A ($41M Funded)",
        "hiring_timeline": "Hiring Actively for Sovereign Indic LLMs",
        "stipend": "₹18 - ₹28 LPA",
        "experience": "Freshers & 0-2 Years",
        "level": "fresher",
        "required_skills": ["Python", "Kubernetes", "Docker", "Machine Learning", "FastAPI", "Linux"],
        "description": "Build high-performance GPU training clusters and inference microservices for India's foundational AI models.",
        "apply_url": "https://www.sarvam.ai/careers",
        "deadline": "Hiring Fast",
        "featured": True
    },
    {
        "id": "opp_fresher_cred",
        "title": "Product Engineering Intern / Graduate",
        "company": "CRED",
        "logo": "💎",
        "location": "Bengaluru",
        "city": "Bengaluru",
        "type": "Internship",
        "domain": "software",
        "stage": "🦄 FinTech Market Leader",
        "hiring_timeline": "🎓 2025-2026 Batch Campus & Off-Campus",
        "stipend": "₹90,000 / month (PPO: ₹24 LPA)",
        "experience": "Freshers (0 Yrs)",
        "level": "internship",
        "required_skills": ["Java", "Go", "Python", "Data Structures", "PostgreSQL", "Docker"],
        "description": "Develop high-scale backend microservices processing billions of reward and transaction events with high reliability.",
        "apply_url": "https://careers.cred.club",
        "deadline": "Active Sprint",
        "featured": True
    },
    {
        "id": "opp_fresher_swiggy",
        "title": "Associate Software Engineer - Early Careers",
        "company": "Swiggy",
        "logo": "🛵",
        "location": "Hyderabad / Bengaluru",
        "city": "Hyderabad",
        "type": "Full-Time",
        "domain": "software",
        "stage": "🚀 Public Tech Giant",
        "hiring_timeline": "Active Hiring for 2025/2026 Graduates",
        "stipend": "₹14 - ₹18 LPA",
        "experience": "Freshers (0-1 Yrs)",
        "level": "fresher",
        "required_skills": ["Java", "Python", "Node.js", "MySQL", "AWS", "Git"],
        "description": "Build low-latency delivery routing engines, real-time tracking systems, and consumer-facing checkout APIs.",
        "apply_url": "https://careers.swiggy.com",
        "deadline": "Rolling Drive",
        "featured": True
    },
    {
        "id": "opp_fresher_jio",
        "title": "Graduate Cloud & Network Systems Engineer",
        "company": "Jio Platforms",
        "logo": "📱",
        "location": "Mumbai / Navi Mumbai",
        "city": "Mumbai",
        "type": "Full-Time",
        "domain": "embedded",
        "stage": "🌐 5G & Cloud Infrastructure Pioneer",
        "hiring_timeline": "🔥 2026 Batch Fast-Track Hiring",
        "stipend": "₹8.5 - ₹12 LPA",
        "experience": "Freshers (0-1 Yrs)",
        "level": "fresher",
        "required_skills": ["C++", "Linux", "Networking", "Python", "Docker", "RTOS"],
        "description": "Develop core 5G network microservices, edge computing nodes, and distributed telecom systems.",
        "apply_url": "https://careers.jio.com",
        "deadline": "Immediate Drive",
        "featured": False
    },
    {
        "id": "opp_fresher_tcs",
        "title": "Systems Engineer (Digital & Prime Cadre)",
        "company": "TCS Digital",
        "logo": "🏢",
        "location": "Pune / Bengaluru / Mumbai",
        "city": "Pune",
        "type": "Full-Time",
        "domain": "software",
        "stage": "🏛️ Global IT & Enterprise Leader",
        "hiring_timeline": "🎓 National Qualifier Test (NQT) Drive",
        "stipend": "₹7.5 - ₹11.5 LPA",
        "experience": "Freshers (2025/2026 Graduates)",
        "level": "fresher",
        "required_skills": ["Python", "Java", "SQL", "Cloud Basics", "Data Structures"],
        "description": "Work on cutting-edge enterprise cloud transformations, AI integrations, and full-stack enterprise portals.",
        "apply_url": "https://www.tcs.com/careers",
        "deadline": "Active Registration",
        "featured": False
    },
    {
        "id": "opp_fresher_zoho",
        "title": "Junior Software Developer - Product Team",
        "company": "Zoho Corporation",
        "logo": "🧩",
        "location": "Chennai / Remote",
        "city": "Chennai",
        "type": "Full-Time",
        "domain": "software",
        "stage": "🏆 Bootstrapped SaaS Titan ($1B+ ARR)",
        "hiring_timeline": "⚡ Year-Round Direct Developer Walk-in",
        "stipend": "₹6.5 - ₹10 LPA",
        "experience": "Freshers (0-1 Yrs)",
        "level": "fresher",
        "required_skills": ["C", "C++", "Java", "Data Structures", "Algorithms", "Web Tech"],
        "description": "Write clean, proprietary SaaS code from scratch. Zero framework bloat, deep problem-solving, and database internals.",
        "apply_url": "https://www.zoho.com/careers",
        "deadline": "Open All Year",
        "featured": True
    },
    {
        "id": "opp_fresher_turtlemint",
        "title": "Backend Engineering Intern",
        "company": "Turtlemint",
        "logo": "🛡️",
        "location": "Pune / Mumbai",
        "city": "Pune",
        "type": "Internship",
        "domain": "software",
        "stage": "🦄 InsurTech Market Leader",
        "hiring_timeline": "Active Internship for Final Year Students",
        "stipend": "₹35,000 / month",
        "experience": "Freshers (0 Yrs)",
        "level": "internship",
        "required_skills": ["Python", "Django", "FastAPI", "PostgreSQL", "Git"],
        "description": "Design financial computation engines, quote comparison microservices, and partner integration webhooks.",
        "apply_url": "https://www.turtlemint.com/careers",
        "deadline": "Rolling",
        "featured": False
    },
    {
        "id": "opp_fresher_browserstack",
        "title": "Platform Infrastructure Engineer Intern",
        "company": "BrowserStack",
        "logo": "🛠️",
        "location": "Mumbai / Remote",
        "city": "Mumbai",
        "type": "Internship",
        "domain": "devops",
        "stage": "🚀 Global Developer Testing Cloud",
        "hiring_timeline": "🔥 2026 Tech Hiring Sprint",
        "stipend": "₹60,000 / month",
        "experience": "Freshers / Students",
        "level": "internship",
        "required_skills": ["Linux", "Ruby", "Python", "Docker", "DevOps", "Networking"],
        "description": "Maintain distributed real-device cloud grids, optimize virtualization hypervisors, and reduce test latency.",
        "apply_url": "https://www.browserstack.com/careers",
        "deadline": "Active Sprint",
        "featured": True
    },
    {
        "id": "opp_fresher_phonepe",
        "title": "Graduate Infrastructure & Reliability Engineer",
        "company": "PhonePe",
        "logo": "🟣",
        "location": "Pune / Bengaluru",
        "city": "Pune",
        "type": "Full-Time",
        "domain": "devops",
        "stage": "🇮🇳 India's #1 UPI FinTech SuperApp",
        "hiring_timeline": "Active Campus & Off-Campus Hiring",
        "stipend": "₹15 - ₹22 LPA",
        "experience": "Freshers (0-1 Yrs)",
        "level": "fresher",
        "required_skills": ["Linux", "Kubernetes", "Kafka", "Java", "Python", "Observability"],
        "description": "Support 45+ billion monthly transactions. Scale high-throughput Kafka clusters, automate Kubernetes deploys.",
        "apply_url": "https://www.phonepe.com/careers",
        "deadline": "Open",
        "featured": True
    },
    {
        "id": "opp_fresher_accops",
        "title": "Embedded & Systems Security Trainee",
        "company": "Accops Systems",
        "logo": "🔐",
        "location": "Pune",
        "city": "Pune",
        "type": "Full-Time",
        "domain": "embedded",
        "stage": "🔒 Enterprise Zero-Trust & VDI Pioneer",
        "hiring_timeline": "Active Hiring for IT/CS/ECE Engineers",
        "stipend": "₹6 - ₹9 LPA",
        "experience": "Freshers (0-1 Yrs)",
        "level": "fresher",
        "required_skills": ["C++", "C", "Linux Kernel", "Networking", "Socket Programming"],
        "description": "Develop low-level device drivers, virtual desktop protocols, and cryptographic tunnel endpoints.",
        "apply_url": "https://accops.com/careers",
        "deadline": "Active Now",
        "featured": False
    },
    {
        "id": "opp_startup_4",
        "title": "Backend / API Developer Intern",
        "company": "Slice",
        "logo": "🍕",
        "location": "Bengaluru",
        "city": "Bengaluru",
        "type": "Internship",
        "domain": "software",
        "stage": "🦄 Fintech Unicorn (Digital Bank)",
        "hiring_timeline": "🎓 College Final Year & 2026 Batch",
        "stipend": "₹45,000 / month",
        "experience": "Freshers (0-1 Yrs)",
        "level": "internship",
        "required_skills": ["Python", "FastAPI", "PostgreSQL", "MongoDB", "REST API", "Git"],
        "description": "Design transaction processing microservices with zero downtime, high security, and low latency.",
        "apply_url": "https://sliceit.com/careers",
        "deadline": "Rolling Applications",
        "featured": False
    },
    {
        "id": "opp_startup_5",
        "title": "Web3 & Cloud Infrastructure Developer",
        "company": "Polygon Labs",
        "logo": "🟣",
        "location": "Remote (Global / India)",
        "city": "Remote",
        "type": "Full-Time",
        "domain": "devops",
        "stage": "🌐 Leading Ethereum Layer-2 Ecosystem",
        "hiring_timeline": "Immediate Remote Hiring Sprint",
        "stipend": "₹16 - ₹26 LPA ($30k - $45k USD)",
        "experience": "Freshers & 0-2 Years",
        "level": "fresher",
        "required_skills": ["Linux", "Docker", "Kubernetes", "Go", "Terraform", "Git"],
        "description": "Deploy validator nodes, automate rollup infrastructure, and manage distributed zero-knowledge proof clusters.",
        "apply_url": "https://polygon.technology/careers",
        "deadline": "Open",
        "featured": True
    },
    {
        "id": "opp_startup_6",
        "title": "Frontend React Engineer",
        "company": "Appsmith",
        "logo": "🛠️",
        "location": "Remote (India)",
        "city": "Remote",
        "type": "Full-Time",
        "domain": "software",
        "stage": "⭐ Open-Source Leader ($50M+ Raised)",
        "hiring_timeline": "Active Q1/Q2 2026 Developer Drive",
        "stipend": "₹12 - ₹18 LPA",
        "experience": "Freshers (0-1 Yrs)",
        "level": "fresher",
        "required_skills": ["React", "TypeScript", "JavaScript", "Redux", "Tailwind", "HTML", "CSS"],
        "description": "Build drag-and-drop internal tool builders used by over 100,000 developers worldwide.",
        "apply_url": "https://www.appsmith.com/careers",
        "deadline": "Active",
        "featured": False
    },
    {
        "id": "opp_corp_1",
        "title": "Cloud & DevOps Intern",
        "company": "Groww",
        "logo": "🌱",
        "location": "Bengaluru / Hybrid",
        "city": "Bengaluru",
        "type": "Internship",
        "domain": "devops",
        "stage": "📈 Top Investment Platform",
        "hiring_timeline": "Active 2025/2026 Campus & Off-Campus",
        "stipend": "₹40,000 / month",
        "experience": "Freshers (0-1 Yrs)",
        "level": "internship",
        "required_skills": ["Kubernetes", "Docker", "Terraform", "Linux", "CI/CD", "AWS"],
        "description": "Automate Kubernetes multi-cluster infrastructure, maintain Terraform IaC modules, and configure Jenkins CI/CD deployment pipelines.",
        "apply_url": "https://groww.in/careers",
        "deadline": "Active",
        "featured": True
    },
    {
        "id": "opp_corp_2",
        "title": "Junior DevOps & Infrastructure Engineer",
        "company": "Razorpay",
        "logo": "💳",
        "location": "Bengaluru (Hybrid)",
        "city": "Bengaluru",
        "type": "Full-Time",
        "domain": "devops",
        "stage": "💳 Payments Pioneer",
        "hiring_timeline": "Immediate Hiring",
        "stipend": "₹12 - ₹18 LPA",
        "experience": "Freshers & 0-2 Years",
        "level": "fresher",
        "required_skills": ["Docker", "Kubernetes", "Linux", "Jenkins", "Terraform", "Shell", "Git"],
        "description": "Scale financial cloud infrastructure, monitor microservice latency with Prometheus/Grafana, and automate release pipelines.",
        "apply_url": "https://razorpay.com/jobs",
        "deadline": "Open Now",
        "featured": True
    }
]



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

def require_roles(allowed_roles: list):
    def role_checker(authorization: str = Header(None)):
        user = get_current_user(authorization)
        user_role = user.get("role", "student")
        if user_role not in allowed_roles:
            raise HTTPException(status_code=403, detail=f"Role '{user_role}' is not authorized to access this resource.")
        return user
    return role_checker


def serialize_user(user):
    github = user.get("github")
    safe_github = None
    if github:
        safe_github = {k: v for k, v in github.items() if k != "access_token"}
        safe_github["has_private_access"] = bool(github.get("access_token"))

    resume = user.get("resume")
    ml_insights = evaluate_developer_profile(github_data=github, resume_data=resume)

    return {
        "id": str(user["_id"]),
        "name": user.get("name") or user.get("email", "").split("@")[0],
        "email": user.get("email"),
        "role": user.get("role", "student"),
        "recruiter_status": user.get("recruiter_status"),
        "target_role": user.get("target_role", ""),
        "location_pref": user.get("location_pref", ""),
        "phone": user.get("phone", ""),
        "linkedin_url": user.get("linkedin_url", ""),
        "bio": user.get("bio", ""),
        "github": safe_github,
        "resume": resume,
        "roast": user.get("roast"),
        "ml_insights": ml_insights,
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
# GITHUB DATA FETCHER
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
            clean_username = (username or "").strip().lstrip("@")
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

        # 2. Fetch Repositories
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
    for r in repos[:40]:
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
        "access_token": token if (access_token or token) else None,
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
# UPDATE PROFILE / ONBOARDING INFO (SAVES TO MONGODB)
# =========================================================
@router.post("/profile")
def update_profile(
    payload: dict = Body(...),
    authorization: str = Header(None)
):
    user = get_current_user(authorization)
    name = payload.get("name", "").strip()
    target_role = payload.get("target_role", "").strip()
    location_pref = payload.get("location_pref", "").strip()
    phone = payload.get("phone", "").strip()
    linkedin_url = payload.get("linkedin_url", "").strip()
    bio = payload.get("bio", "").strip()

    update_fields = {"updated_at": datetime.utcnow().isoformat()}
    if name:
        update_fields["name"] = name
    if target_role:
        update_fields["target_role"] = target_role
    if location_pref:
        update_fields["location_pref"] = location_pref
    if phone:
        update_fields["phone"] = phone
    if linkedin_url:
        update_fields["linkedin_url"] = linkedin_url
    if bio:
        update_fields["bio"] = bio

    users = get_users_collection()
    users.update_one(
        {"_id": user["_id"]},
        {"$set": update_fields}
    )

    updated_user = users.find_one({"_id": user["_id"]})
    return {
        "message": "Profile updated successfully!",
        "user": serialize_user(updated_user)
    }


# =========================================================
# SUBMIT HELP CENTER QUERY (SAVES TO NOTIFICATIONS & DB)
# =========================================================
@router.post("/help")
def submit_help_query(
    payload: dict = Body(...),
    authorization: str = Header(None)
):
    user = get_current_user(authorization)
    query = payload.get("query", "").strip()
    email = payload.get("email") or user.get("email")

    if not query:
        raise HTTPException(status_code=400, detail="Query message cannot be empty.")

    notification = {
        "id": f"hlp_{int(datetime.utcnow().timestamp())}",
        "title": "Help Ticket Submitted",
        "message": f"Your ticket '{query[:40]}...' was received. Our team will follow up via {email}.",
        "time": datetime.utcnow().isoformat(),
        "read": False
    }

    users = get_users_collection()
    users.update_one(
        {"_id": user["_id"]},
        {
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
        "message": "Help inquiry submitted successfully! A support engineer will reply shortly.",
        "query": query
    }


# =========================================================
# GET OPPORTUNITIES (ACCURATE REAL-DATA MATCH SCORING)
# =========================================================
@router.get("/opportunities")
def get_opportunities(
    domain: str = None,
    location: str = None,
    type: str = None,
    source: str = None,
    authorization: str = Header(None)
):
    user = get_current_user(authorization)
    resume = user.get("resume")
    github = user.get("github")
    
    col = get_opportunities_collection()
    
    if col is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    query = {"is_active": True}
    if domain and domain != "all":
        query["domain"] = domain
    if location and location != "all":
        query["city"] = location
    if type and type != "all":
        query["type"] = type
    if source and source != "all":
        query["source"] = source

    cursor = col.find(query)
    opportunities_list = list(cursor)
    
    scored_opportunities = []
    
    from match_service import calculate_opportunity_match
    
    all_user_skills = set()
    for opp in opportunities_list:
        match_result = calculate_opportunity_match(resume, github, opp)
        
        # Merge dicts
        opp_data = {
            **opp,
            "id": str(opp.get("_id", opp.get("source_id", ""))),
            **match_result
        }
        if "_id" in opp_data:
            del opp_data["_id"]
            
        scored_opportunities.append(opp_data)
        all_user_skills = max(all_user_skills, match_result.get("user_skill_count", 0)) if isinstance(all_user_skills, int) else match_result.get("user_skill_count", 0)

    # Sort descending by match score
    scored_opportunities.sort(key=lambda x: x["match_score"], reverse=True)

    return {
        "opportunities": scored_opportunities,
        "total": len(scored_opportunities),
        "user_skill_count": all_user_skills if isinstance(all_user_skills, int) else 0
    }

@router.get("/opportunities/{opp_id}")
def get_opportunity(opp_id: str, authorization: str = Header(None)):
    user = get_current_user(authorization)
    resume = user.get("resume")
    github = user.get("github")
    
    col = get_opportunities_collection()
    if col is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    try:
        if len(opp_id) == 24:
            query = {"_id": ObjectId(opp_id)}
        else:
            query = {"source_id": opp_id}
            
        opp = col.find_one(query)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid opportunity ID")
        
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
        
    from match_service import calculate_opportunity_match
    match_result = calculate_opportunity_match(resume, github, opp)
    
    opp_data = {
        **opp,
        "id": str(opp.get("_id", opp.get("source_id", ""))),
        **match_result
    }
    if "_id" in opp_data:
        del opp_data["_id"]
        
    return opp_data


# =========================================================
# APPLICATIONS
# =========================================================
@router.post("/applications")
def apply_opportunity(
    payload: dict = Body(...),
    authorization: str = Header(None)
):
    user = get_current_user(authorization)
    opp_id = payload.get("opportunity_id")
    app_type = payload.get("application_type", "internal") # internal or external
    
    if not opp_id:
        raise HTTPException(status_code=400, detail="Opportunity ID is required")
        
    from database import get_applications_collection
    apps_col = get_applications_collection()
    
    if apps_col is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    # Check if already applied
    existing = apps_col.find_one({"student_id": str(user["_id"]), "opportunity_id": opp_id})
    if existing:
        raise HTTPException(status_code=400, detail="Already applied to this opportunity")
        
    new_app = {
        "student_id": str(user["_id"]),
        "opportunity_id": opp_id,
        "application_type": app_type,
        "status": "Applied",
        "applied_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    if app_type == "external":
        new_app["redirected_at"] = datetime.utcnow().isoformat()
        
    result = apps_col.insert_one(new_app)
    return {"message": "Application successful", "application_id": str(result.inserted_id)}


@router.get("/applications")
def get_applications(authorization: str = Header(None)):
    user = get_current_user(authorization)
    
    from database import get_applications_collection
    apps_col = get_applications_collection()
    
    if apps_col is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    cursor = apps_col.find({"student_id": str(user["_id"])})
    apps_list = []
    
    col = get_opportunities_collection()
    for app in cursor:
        app_data = {
            "id": str(app["_id"]),
            "status": app.get("status"),
            "applied_at": app.get("applied_at"),
            "application_type": app.get("application_type")
        }
        if col:
            try:
                opp_query = {"_id": ObjectId(app["opportunity_id"])} if len(app["opportunity_id"]) == 24 else {"source_id": app["opportunity_id"]}
                opp = col.find_one(opp_query)
                if opp:
                    app_data["opportunity"] = {
                        "id": str(opp.get("_id", opp.get("source_id", ""))),
                        "title": opp.get("title"),
                        "company": opp.get("company"),
                        "logo": opp.get("logo"),
                        "location": opp.get("location")
                    }
            except Exception:
                pass
        apps_list.append(app_data)
        
    return {"applications": apps_list}

# =========================================================
# BOOKMARKS
# =========================================================
@router.post("/bookmarks/{opp_id}")
def toggle_bookmark(opp_id: str, authorization: str = Header(None)):
    user = get_current_user(authorization)
    from database import get_bookmarks_collection
    bookmarks_col = get_bookmarks_collection()
    
    if bookmarks_col is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    existing = bookmarks_col.find_one({"student_id": str(user["_id"]), "opportunity_id": opp_id})
    if existing:
        bookmarks_col.delete_one({"_id": existing["_id"]})
        return {"message": "Bookmark removed", "bookmarked": False}
    else:
        bookmarks_col.insert_one({
            "student_id": str(user["_id"]),
            "opportunity_id": opp_id,
            "created_at": datetime.utcnow().isoformat()
        })
        return {"message": "Bookmark added", "bookmarked": True}

@router.get("/bookmarks")
def get_bookmarks(authorization: str = Header(None)):
    user = get_current_user(authorization)
    from database import get_bookmarks_collection
    bookmarks_col = get_bookmarks_collection()
    
    if bookmarks_col is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    cursor = bookmarks_col.find({"student_id": str(user["_id"])})
    bookmark_ids = [str(b["opportunity_id"]) for b in cursor]
    return {"bookmarks": bookmark_ids}

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
        "message": f"Connected @{github_data['username']} ({github_data['stats']['repositories']} repos{', including ' + str(github_data['stats']['private_repositories']) + ' private 🔒' if has_private else ''}).",
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
    safe_response["has_private_access"] = bool(token or github_data.get("access_token"))

    return {
        "message": f"GitHub account @{github_data['username']} connected successfully!",
        "github": safe_response
    }


# =========================================================
# GITHUB OAUTH
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
        "categorized_skills": ats_data.get("categorized_skills", {}),
        "feedback": ats_data.get("feedback", ["Resume uploaded successfully."]),
        "checklist": ats_data.get("checklist", {}),
        "preview_length": len(extracted_text)
    }

    notification = {
        "id": f"res_{int(datetime.utcnow().timestamp())}",
        "title": "Resume Uploaded & Analyzed",
        "message": f"Resume '{file.filename}' parsed with ATS Score {resume_data['ats_score']}/100.",
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
# DELETE RESUME
# =========================================================
@router.delete("/resume")
def delete_resume(authorization: str = Header(None)):
    user = get_current_user(authorization)
    old_resume = user.get("resume")
    if old_resume and old_resume.get("path"):
        old_file = Path(old_resume["path"])
        if old_file.exists():
            try:
                old_file.unlink()
            except Exception:
                pass

    users = get_users_collection()
    users.update_one(
        {"_id": user["_id"]},
        {
            "$unset": {"resume": ""},
            "$set": {"updated_at": datetime.utcnow().isoformat()}
        }
    )
    return {"message": "Resume deleted successfully."}


# =========================================================
# GENERATE HINGLISH AI ROAST (WORKS WITH GITHUB OR RESUME)
# =========================================================
@router.post("/roast")
def generate_roast_endpoint(authorization: str = Header(None)):
    user = get_current_user(authorization)

    github = user.get("github")
    resume = user.get("resume")

    if not github and not resume:
        raise HTTPException(
            status_code=400,
            detail="Connect your GitHub account or upload your resume first to generate a roast."
        )

    username = github.get("username", "developer") if github else user.get("name", "developer")
    stats = github.get("stats", {}) if github else {}
    repo_count = stats.get("repositories", 0)
    stars = stats.get("stars", 0)
    forks = stats.get("forks", 0)
    followers = stats.get("followers", 0)
    private_count = stats.get("private_repositories", 0)
    languages = list(stats.get("languages", {}).keys())
    top_language = languages[0] if languages else "Code"

    resume_skills = resume.get("skills", []) if resume else []
    ats_score = resume.get("ats_score", 0) if resume else 0

    # Authentic, witty & savage Hinglish roast punchlines
    punchlines = []

    # 1. Opening & Repo Count
    if repo_count == 0 and not resume:
        punchlines.append(
            f"Bhai @{username}, GitHub account banaya par ek bhi repository nahi daali? Lagta hai README file bhi commit hone se darr rahi hai! 😂💀"
        )
    elif repo_count < 4 and repo_count > 0:
        punchlines.append(
            f"Arre bhai @{username}, kul milakar {repo_count} repos? Ye developer ka portfolio hai ya college ka ek assignment draft? 😭"
        )
    elif repo_count > 25:
        punchlines.append(
            f"Bhai @{username}, {repo_count} repositories?! Aadhi repos me toh khud tujhe nahi pata hoga ki code kyu likha tha... Poora graveyard bana rakha hai! 💀🚀"
        )
    elif repo_count > 0:
        punchlines.append(
            f"Arre wah @{username}, {repo_count} repositories hain! Par commit history dekh kar lagta hai saare commit messages me bas 'fix bug', 'final push', aur 'ab pakka chal gaya' hi likha hai! 😂"
        )

    # 2. Private Repos Punchline
    if private_count > 0:
        punchlines.append(
            f"Aur ye jo {private_count} private repos chupa ke rakhi hain 🔒... usme kya NASA ka secret code hai ya adhoore YouTube tutorial ke copy-paste projects? Sach bata! 🤫😂"
        )
    elif repo_count > 0:
        punchlines.append(
            "Ek bhi private repo nahi hai? Ya toh tu 100% open source lover hai ya phir code itna khatarnak hai ki kisi ko dikha hi nahi sakte! 🚀"
        )

    # 3. Stars & Popularity Punchline
    if stars == 0 and repo_count > 0:
        punchlines.append(
            "GitHub par 0 stars ⭐... Tension mat le bhai, agar mummy ka GitHub account hota toh wo zaroor star kar deti! 😂❤️"
        )
    elif stars < 5 and stars > 0:
        punchlines.append(
            f"Total {stars} stars mile hain? Sach bolna, unme se ek toh tere doosre fake account ka hi star hoga na! 😉⭐"
        )
    elif stars >= 5:
        punchlines.append(
            f"{stars} stars dekh kar toh lagta hai thoda bahut swag hai market me! Par production me console.log hatana mat bhulna! 🚀"
        )

    # 4. Resume & ATS Skills Reality Check
    if resume_skills:
        skill_sample = ", ".join(resume_skills[:3])
        punchlines.append(
            f"Resume me toh bade confidence se likha hai '{skill_sample}', aur ATS score {ats_score}/100 laaye ho, par terminal me permission denied aate hi darr jaate ho! 💀😎"
        )
    elif not resume:
        punchlines.append(
            "Abhi tak resume upload nahi kiya? Lagta hai resume me 'hardworking' ke alawa likhne ke liye skills dhoondh rahe ho! 😂📄"
        )

    # 5. Savage Closing Advice
    closings = [
        "Final Verdict: Bhai CSS ki padding theek karna band kar, main branch me direct push marna chhodo, aur PR review seekh lo! Code solid hai, bass consistency badhao! 🔥🚀",
        "Final Verdict: Mehnat 10/10 hai par testing 0/10! StackOverflow ko thoda rest do aur code ko production me bina dare deploy karo! ⚡💥",
        "Final Verdict: Portfolio me dam hai, bass thoda daily commits ka streak banao aur recruiter ke inbox me aag laga do! 🚀🎯"
    ]
    punchlines.append(closings[0])

    roast_text = " ".join(punchlines)

    roast_data = {
        "text": roast_text,
        "created_at": datetime.utcnow().isoformat(),
        "repo_count": repo_count,
        "stars": stars,
        "ats_score": ats_score,
        "private_count": private_count
    }

    notification = {
        "id": f"rst_{int(datetime.utcnow().timestamp())}",
        "title": "Hinglish AI Roast Ready 🔥",
        "message": "Aapka desi developer roast taiyar hai! Padhke hasi nahi rukegi.",
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


# =========================================================
# PUBLIC & AUTHENTICATED SUPPORT TICKETS / INQUIRIES
# =========================================================
@router.post("/help/inquiry")
def submit_help_inquiry(
    payload: dict = Body(...),
    authorization: str = Header(None)
):
    """
    Saves public inquiry from Homepage footer or authenticated user ticket to MongoDB.
    """
    message = (payload.get("message") or payload.get("query") or "").strip()
    email = (payload.get("email") or "").strip()
    name = (payload.get("name") or "").strip()
    category = payload.get("category", "General Inquiry")

    if not message:
        raise HTTPException(status_code=400, detail="Inquiry message cannot be empty.")

    user_id = None
    user_email = email
    user_name = name

    # If logged in, get user details
    if authorization:
        try:
            user = get_current_user(authorization)
            user_id = str(user["_id"])
            user_email = user.get("email") or email
            user_name = user.get("name") or name or user_email.split("@")[0]
        except Exception:
            pass

    if not user_email:
        user_email = "guest@gitbridge.careers"
    if not user_name:
        user_name = "GitBridge Explorer"

    ticket_id = f"tkt_{int(datetime.utcnow().timestamp())}_{secrets.token_hex(3)}"

    ticket_doc = {
        "ticket_id": ticket_id,
        "user_id": user_id,
        "name": user_name,
        "email": user_email,
        "category": category,
        "message": message,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat(),
        "source": "homepage_footer" if not user_id else "dashboard_help_center"
    }

    tickets = get_support_tickets_collection()
    if tickets is not None:
        tickets.insert_one(ticket_doc)
        ticket_doc.pop("_id", None)

    # Also notify user if logged in
    if user_id:
        users = get_users_collection()
        notification = {
            "id": f"notif_{int(datetime.utcnow().timestamp())}",
            "title": "Support Inquiry Received 💬",
            "message": f"Your ticket ({ticket_id}) has been recorded. Our engineering team will review it shortly.",
            "time": datetime.utcnow().isoformat(),
            "read": False
        }
        users.update_one(
            {"_id": ObjectId(user_id)},
            {
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
        "success": True,
        "ticket_id": ticket_id,
        "message": "Thank you! Your inquiry has been submitted and stored in MongoDB.",
        "ticket": ticket_doc
    }


# =========================================================
# ADMIN PORTAL: INQUIRIES & PLATFORM METRICS
# =========================================================
@router.get("/admin/inquiries")
def get_admin_inquiries():
    """
    Fetches all inquiries and system stats for admin dashboard.
    """
    tickets_coll = get_support_tickets_collection()
    users_coll = get_users_collection()

    all_tickets = []
    if tickets_coll is not None:
        for t in tickets_coll.find({}).sort("created_at", -1).limit(100):
            t["id"] = str(t.pop("_id", ""))
            all_tickets.append(t)

    total_users = users_coll.count_documents({}) if users_coll is not None else 0
    total_tickets = len(all_tickets)
    pending_tickets = sum(1 for t in all_tickets if t.get("status") == "pending")
    resolved_tickets = sum(1 for t in all_tickets if t.get("status") == "resolved")

    return {
        "tickets": all_tickets,
        "stats": {
            "total_users": total_users,
            "total_tickets": total_tickets,
            "pending_tickets": pending_tickets,
            "resolved_tickets": resolved_tickets
        }
    }


@router.patch("/admin/inquiries/{ticket_id}")
def update_inquiry_status(ticket_id: str, payload: dict = Body(...)):
    new_status = payload.get("status", "resolved")
    tickets_coll = get_support_tickets_collection()

    if tickets_coll is None:
        raise HTTPException(status_code=500, detail="Database not available.")

    res = tickets_coll.update_one(
        {"ticket_id": ticket_id},
        {"$set": {"status": new_status, "updated_at": datetime.utcnow().isoformat()}}
    )

    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    return {"message": f"Ticket {ticket_id} updated to {new_status}."}

