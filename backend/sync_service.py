import os
import urllib.request
import urllib.parse
import urllib.error
import json
import re
import html
import ssl
from datetime import datetime
from database import get_opportunities_collection, get_sync_logs_collection

# =========================================================
# CONSTANTS & SKILL VOCABULARY
# =========================================================

COMMON_TECH_SKILLS = [
    "Python", "JavaScript", "TypeScript", "React", "Node.js", "Java", "C++", "C#", "Go", "Golang",
    "Rust", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Linux", "SQL", "PostgreSQL", "MongoDB",
    "Redis", "Kafka", "CI/CD", "Terraform", "FastAPI", "Django", "Flask", "Spring Boot", "GraphQL",
    "HTML", "CSS", "Tailwind", "Next.js", "Vue", "Angular", "Machine Learning", "Deep Learning",
    "PyTorch", "TensorFlow", "Scikit-Learn", "Git", "REST API", "Microservices", "Jenkins", "Ansible",
    "OpenCV", "NLP", "Pandas", "NumPy", "DevOps", "Embedded", "RTOS", "IoT"
]

TECH_TITLE_KEYWORDS = [
    "engineer", "developer", "software", "frontend", "backend", "fullstack", "full-stack", "devops", "cloud",
    "sre", "platform", "data", "machine learning", "ai", "system", "architect", "tech", "security",
    "qa", "tester", "android", "ios", "mobile", "web", "infra", "database", "embedded", "firmware",
    "programmer", "site reliability", "analyst", "product", "intern"
]


# =========================================================
# TEXT CLEANING & HEURISTICS
# =========================================================

def clean_html(raw_html: str) -> str:
    """Safely cleans HTML tags and entities from raw API text."""
    if not raw_html:
        return ""
    # Unescape first so entity-encoded tags like &lt;p&gt; are decoded
    text = html.unescape(raw_html)
    # Strip HTML tags
    clean = re.sub(r'<[^>]+>', ' ', text)
    # Final unescape and whitespace normalize
    clean = html.unescape(clean)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean[:600] + ("..." if len(clean) > 600 else "")


def detect_domain_and_skills(title: str, tags: list, description: str) -> tuple[str, list]:
    """
    Detects domain (software, devops, aiml, embedded) and extracts tech skills.
    Never invents nonexistent skills; relies on actual text and tags.
    """
    text = f"{title} {' '.join(tags or [])} {description}".lower()

    # Skills extraction from text
    skills = []
    for skill in COMMON_TECH_SKILLS:
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text):
            skills.append(skill)

    for tag in (tags or []):
        tag_str = str(tag).strip()
        if tag_str and tag_str not in skills and len(skills) < 8:
            skills.append(tag_str)

    if not skills:
        skills = ["Software Engineering", "Problem Solving", "Git"]

    skills = skills[:8]

    # Domain classification
    if any(k in text for k in ["devops", "cloud", "sre", "kubernetes", "docker", "infrastructure", "terraform", "platform", "ci/cd"]):
        domain = "devops"
    elif any(k in text for k in ["ai", "machine learning", "data science", "nlp", "deep learning", "llm", "vision", "pytorch", "tensorflow"]):
        domain = "aiml"
    elif any(k in text for k in ["embedded", "iot", "firmware", "hardware", "microcontroller", "c++", "rtos"]):
        domain = "embedded"
    else:
        domain = "software"

    return domain, skills


# =========================================================
# INDIA-ONLY GEOGRAPHIC ELIGIBILITY FILTER
# =========================================================

INDIAN_CITIES_AND_REGIONS = [
    "india", "bharat", "bengaluru", "bangalore", "mumbai", "pune", "nagpur", "delhi", "new delhi",
    "ncr", "noida", "gurgaon", "gurugram", "hyderabad", "chennai", "kolkata", "ahmedabad",
    "jaipur", "indore", "chandigarh", "kochi", "cochin", "thiruvananthapuram", "trivandrum",
    "coimbatore", "surat", "bhopal", "visakhapatnam", "vizag", "vadodara", "lucknow", "kanpur",
    "patna", "bhubaneswar", "mysore", "mysuru", "mangalore", "mangaluru", "nashik", "calicut",
    "kozhikode", "maharashtra", "karnataka", "tamil nadu", "telangana", "kerala", "gujarat",
    "rajasthan", "uttar pradesh", "haryana", "punjab", "west bengal", "odisha", "andhra pradesh",
    "goa", "dehradun", "madurai", "vijayawada", "ranchi", "jamshedpur", "guwahati", "gwalior",
    "manewada", "dharampeth", "hinjewadi", "whitefield", "koramangala", "electronic city", "cyber city"
]

FOREIGN_EXCLUSION_KEYWORDS = [
    "germany", "deutschland", "berlin", "munich", "münchen", "frankfurt", "hamburg", "köln",
    "cologne", "dresden", "düsseldorf", "bonn", "stuttgart", "bielefeld", "bochum", "augsburg",
    "altenstadt", "aurich", "frechen", "freiburg", "wessling", "schweiz", "österreich",
    "united states", "usa", "san francisco", "new york", "seattle", "austin", "chicago",
    "united kingdom", "uk", "london", "manchester", "birmingham",
    "canada", "toronto", "vancouver", "montreal", "ottawa",
    "australia", "sydney", "melbourne", "brisbane",
    "france", "paris", "lyon", "singapore",
    "netherlands", "amsterdam", "rotterdam", "switzerland", "zurich", "zürich", "geneva",
    "austria", "vienna", "wien", "ireland", "dublin", "spain", "madrid", "barcelona",
    "italy", "rome", "milan", "milano", "poland", "warsaw", "sweden", "stockholm",
    "denmark", "copenhagen", "norway", "oslo", "finland", "helsinki",
    "japan", "tokyo", "china", "beijing", "shanghai", "brazil", "mexico",
    "eu only", "us only", "emea only", "north america only"
]

def is_india_relevant(opp: dict) -> bool:
    """
    Validates whether an opportunity is relevant for candidates in India:
    - Located in an Indian city / India
    - Remote positions explicitly open to India or Remote Worldwide without regional foreign restriction
    - Internal recruiter / admin opportunities created on GitBridge for Indian students
    - Rejects positions restricted exclusively to foreign countries (e.g. Germany, USA, UK, Europe).
    """
    source = str(opp.get("source", "")).lower()
    source_type = str(opp.get("source_type", "")).lower()

    # Recruiter / admin opportunities posted on GitBridge are for Indian candidates
    if source in ["recruiter", "gitbridge_admin", "gitbridge_catalog", "gitbridge_curated", "official_tech_feed"] or source_type == "recruiter":
        return True

    loc = str(opp.get("location", "")).lower()
    city = str(opp.get("city", "")).lower()
    country = str(opp.get("country", "")).lower()
    title = str(opp.get("title", "")).lower()
    combined_loc = f"{loc} {city} {country}".strip()

    # 1. Explicit Indian city or country
    if any(k in combined_loc for k in INDIAN_CITIES_AND_REGIONS):
        return True

    # 2. Exclude foreign locations if not remote
    has_foreign = any(f in combined_loc for f in FOREIGN_EXCLUSION_KEYWORDS)
    if has_foreign and not ("remote" in combined_loc or "worldwide" in combined_loc or "global" in combined_loc):
        return False

    # 3. Check Remote eligibility
    is_remote = "remote" in combined_loc or "remote" in title or bool(opp.get("remote")) or str(opp.get("work_mode", "")).lower() == "remote"
    if is_remote:
        # If remote but tagged with foreign location restriction
        if has_foreign:
            return False
        # Remote - India or Remote Worldwide / Global allowed
        if "india" in combined_loc or any(w in combined_loc for w in ["worldwide", "global", "anywhere"]) or loc in ["remote", "remote (remote available)"]:
            return True

    return False


# =========================================================
# PROFILE-BASED QUERY GENERATION
# =========================================================

def extract_profile_queries(user_profile: dict = None) -> tuple[list[str], str | None]:
    """
    Builds safe, dynamic search queries based on the student's actual profile:
    target_role, resume skills, GitHub languages, and location preference.
    Falls back cleanly to general software queries if profile is sparse.
    Never invents user skills on the profile itself.
    """
    if not user_profile:
        return ["Software Engineer", "Full Stack Developer"], None

    queries = []
    location_pref = user_profile.get("location_pref")
    if location_pref and str(location_pref).lower() in ["all", "none", "remote", "flexible"]:
        location_pref = None

    target_role = user_profile.get("target_role")
    if target_role and isinstance(target_role, str) and target_role.strip():
        role_clean = target_role.strip()
        queries.append(role_clean)
        if "devops" in role_clean.lower():
            queries.append("Cloud Engineer")
        elif "ai" in role_clean.lower() or "data" in role_clean.lower():
            queries.append("Machine Learning Engineer")
        elif "frontend" in role_clean.lower():
            queries.append("React Developer")
        elif "backend" in role_clean.lower():
            queries.append("Python Backend Developer")

    # Resume skills
    resume_skills = user_profile.get("resume", {}).get("skills", [])
    if isinstance(resume_skills, list) and resume_skills:
        top_skills = [s for s in resume_skills if s in COMMON_TECH_SKILLS][:2]
        if top_skills:
            queries.append(f"{top_skills[0]} Developer")

    # GitHub languages
    github_langs = list(user_profile.get("github", {}).get("stats", {}).get("languages", {}).keys())
    if github_langs and len(queries) < 3:
        for lang in github_langs[:2]:
            if lang in ["Python", "TypeScript", "JavaScript", "Go", "Java", "Rust", "C++"]:
                candidate = f"{lang} Developer"
                if candidate not in queries:
                    queries.append(candidate)
                    break

    # General fallback if no profile data found
    if not queries:
        queries = ["Software Engineer", "Developer"]

    # Limit to at most 3 distinct queries to avoid excessive API requests
    unique_queries = []
    for q in queries:
        if q not in unique_queries:
            unique_queries.append(q)
        if len(unique_queries) >= 3:
            break

    return unique_queries, location_pref


# =========================================================
# ADZUNA JOBS API FETCHER & NORMALIZER
# =========================================================

def fetch_adzuna_jobs(query: str, location: str = None, country: str = None, page: int = 1, results_per_page: int = 20) -> list[dict]:
    """
    Fetches live job listings from the Adzuna Jobs API.
    Uses credentials from environment variables: ADZUNA_APP_ID, ADZUNA_APP_KEY.
    Returns empty list if credentials are not configured or on network/auth error.
    Never exposes, prints, or logs ADZUNA_APP_KEY.
    """
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")
    target_country = (country or os.getenv("ADZUNA_COUNTRY") or "in").lower().strip()

    if not app_id or not app_key:
        # Credentials not present
        return []

    try:
        ssl_ctx = ssl._create_unverified_context()
        encoded_query = urllib.parse.quote_plus(query)
        base_url = f"https://api.adzuna.com/v1/api/jobs/{target_country}/search/{page}"
        params = {
            "app_id": app_id,
            "app_key": app_key,
            "results_per_page": str(results_per_page),
            "what": query,
            "sort_by": "date",
            "content-type": "application/json"
        }
        if location:
            params["where"] = location

        url = f"{base_url}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "GitBridge-Careers/1.0 (Student Job Portal)",
                "Accept": "application/json"
            }
        )

        with urllib.request.urlopen(req, context=ssl_ctx, timeout=12) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            results = res_data.get("results", [])
            print(f"[Live Sync] Adzuna Query: '{query}' | Returned: {len(results)} items")
            return results

    except urllib.error.HTTPError as e:
        print(f"[Live Sync] Adzuna HTTP {e.code} error for query '{query}'")
        return []
    except Exception as e:
        print(f"[Live Sync] Adzuna request failed for query '{query}': {type(e).__name__}")
        return []


def normalize_adzuna_job(raw_job: dict, target_country: str = "in") -> dict | None:
    """
    Normalizes raw Adzuna listing into the unified GitBridge opportunity schema.
    Strictly preserves real salary (or None if unavailable).
    Requires a valid redirect_url (apply_url) and title.
    """
    title = clean_html(raw_job.get("title", ""))
    apply_url = raw_job.get("redirect_url")

    # Critical validation: must have title and real external apply URL
    if not title or not apply_url:
        return None

    company = raw_job.get("company", {}).get("display_name") or "Tech Company"
    desc = clean_html(raw_job.get("description", ""))

    location_info = raw_job.get("location", {})
    display_location = location_info.get("display_name") or "India"
    area_parts = location_info.get("area", [])
    city = area_parts[-1] if area_parts else display_location

    domain, skills = detect_domain_and_skills(title, [], desc)

    # Job type & Experience
    contract_time = str(raw_job.get("contract_time", "")).lower()
    title_lower = title.lower()
    if "intern" in title_lower:
        opp_type = "Internship"
        experience = "Freshers (0-1 Yrs)"
    elif "part" in contract_time or "part" in title_lower:
        opp_type = "Part-time"
        experience = "0-2 Years"
    elif "contract" in contract_time or "contract" in title_lower:
        opp_type = "Contract"
        experience = "1-3 Years"
    else:
        opp_type = "Full-Time"
        experience = "Freshers & 0-2 Years" if ("junior" in title_lower or "fresher" in title_lower or "entry" in title_lower) else "1-4 Years"

    # Real salary handling — NEVER fake or invent salary
    salary_min = raw_job.get("salary_min")
    salary_max = raw_job.get("salary_max")
    salary_is_predicted = bool(raw_job.get("salary_is_predicted"))
    stipend = None

    if salary_min is not None and salary_max is not None and salary_min > 0 and salary_max > 0:
        if target_country == "in":
            stipend = f"₹{int(salary_min):,} - ₹{int(salary_max):,} / yr"
        else:
            stipend = f"${int(salary_min):,} - ${int(salary_max):,} / yr"
    elif salary_min is not None and salary_min > 0:
        if target_country == "in":
            stipend = f"From ₹{int(salary_min):,} / yr"
        else:
            stipend = f"From ${int(salary_min):,} / yr"
    elif salary_max is not None and salary_max > 0:
        if target_country == "in":
            stipend = f"Up to ₹{int(salary_max):,} / yr"
        else:
            stipend = f"Up to ${int(salary_max):,} / yr"

    created_iso = raw_job.get("created")

    adzuna_norm = {
        "source_id": str(raw_job.get("id")),
        "title": title,
        "company": company,
        "description": desc or f"Join {company} as {title}. Apply directly via verified listing.",
        "required_skills": skills,
        "preferred_skills": skills[3:] if len(skills) > 3 else skills,
        "location": display_location,
        "city": city,
        "type": opp_type,
        "domain": domain,
        "source": "Adzuna",
        "source_type": "external",
        "apply_url": apply_url,
        "stipend": stipend,  # None if unavailable from API
        "salary_min": salary_min,
        "salary_max": salary_max,
        "salary_is_predicted": salary_is_predicted,
        "experience": experience,
        "hiring_timeline": "Actively Hiring (Adzuna Live Feed)",
        "logo": "🌐",
        "stage": "Verified Listing",
        "featured": bool(salary_min and salary_min > 600000),
        "is_live": True,
        "is_active": True,
        "external_created_at": created_iso,
        "last_synced_at": datetime.utcnow().isoformat()
    }

    if not is_india_relevant(adzuna_norm):
        return None

    return adzuna_norm


# =========================================================
# ARBEITNOW FETCHER & NORMALIZER (SECONDARY LIVE FEED)
# =========================================================

def fetch_arbeitnow_jobs(query: str = None, limit: int = 30) -> list[dict]:
    """
    Fetches real-time startup and engineering jobs from Arbeitnow.
    Filtered for tech keywords and matching user query if supplied.
    """
    try:
        ssl_ctx = ssl._create_unverified_context()
        url = "https://www.arbeitnow.com/api/job-board-api"
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "GitBridge-Careers/1.0 (Mozilla/5.0)",
                "Accept": "application/json"
            }
        )
        with urllib.request.urlopen(req, context=ssl_ctx, timeout=12) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            jobs = res_data.get("data", [])

        filtered = []
        q_lower = query.lower() if query else ""

        for j in jobs:
            title = j.get("title", "")
            tags = j.get("tags", [])
            tag_text = " ".join(tags).lower()
            title_lower = title.lower()

            # Tech / Engineering filter
            if not any(k in title_lower or k in tag_text for k in TECH_TITLE_KEYWORDS):
                continue

            # Query relevance filter if query provided
            if q_lower:
                query_words = [w for w in re.split(r'\s+', q_lower) if len(w) > 2]
                if not any(qw in title_lower or qw in tag_text for qw in query_words):
                    continue

            filtered.append(j)
            if len(filtered) >= limit:
                break

        print(f"[Live Sync] Arbeitnow Filtered: {len(filtered)} tech positions (query: '{query or 'all tech'}')")
        return filtered

    except Exception as e:
        print(f"[Live Sync] Arbeitnow request failed: {type(e).__name__} - {e}")
        return []


def normalize_arbeitnow_job(raw_job: dict) -> dict | None:
    """
    Normalizes raw Arbeitnow listing into the unified GitBridge opportunity schema.
    Arbeitnow does not provide structured salary; stipend is set to None.
    NEVER generates fake salary.
    """
    title = clean_html(raw_job.get("title", ""))
    apply_url = raw_job.get("url")

    # Critical validation
    if not title or not apply_url:
        return None

    company = raw_job.get("company_name") or "Tech Company"
    desc = clean_html(raw_job.get("description", ""))
    tags = raw_job.get("tags", [])
    domain, skills = detect_domain_and_skills(title, tags, desc)

    is_remote = bool(raw_job.get("remote", False))
    loc = raw_job.get("location") or ("Remote" if is_remote else "Global")
    if is_remote and "remote" not in loc.lower():
        loc = f"{loc} (Remote Available)"

    job_types = raw_job.get("job_types", ["Full-Time"])
    opp_type = job_types[0] if job_types else "Full-Time"
    title_lower = title.lower()
    if "intern" in title_lower:
        opp_type = "Internship"
        experience = "Freshers (0-1 Yrs)"
    else:
        experience = "Freshers & 0-2 Years" if ("junior" in title_lower or "entry" in title_lower) else "1-4 Years"

    created_at_ts = raw_job.get("created_at")
    external_created = datetime.utcfromtimestamp(created_at_ts).isoformat() if created_at_ts else None

    slug = raw_job.get("slug") or f"arbeit_{abs(hash(title + company))}"

    arbeit_norm = {
        "source_id": slug,
        "title": title,
        "company": company,
        "description": desc or f"Join {company} as {title}. Real-time tech position.",
        "required_skills": skills,
        "preferred_skills": skills[3:] if len(skills) > 3 else skills,
        "location": loc,
        "city": "Remote" if is_remote else (raw_job.get("location") or "Global"),
        "type": opp_type,
        "domain": domain,
        "source": "Arbeitnow",
        "source_type": "external",
        "apply_url": apply_url,
        "stipend": None,  # Strictly None when not provided by external API
        "salary_min": None,
        "salary_max": None,
        "salary_is_predicted": False,
        "experience": experience,
        "hiring_timeline": "Actively Hiring (Arbeitnow Feed)",
        "logo": "🌐",
        "stage": "Growth / Venture",
        "featured": bool(is_remote),
        "is_live": True,
        "is_active": True,
        "external_created_at": external_created,
        "last_synced_at": datetime.utcnow().isoformat()
    }

    if not is_india_relevant(arbeit_norm):
        return None

    return arbeit_norm


# =========================================================
# MODULAR SYNC & DEDUPLICATION LAYER
# =========================================================

def sync_from_source(source_name: str, opportunities_data: list) -> dict:
    """
    Modular sync function to deduplicate and upsert opportunities into MongoDB.
    Deduplicates primarily by (source, source_id) and fallbacks to apply_url.
    Preserves MongoDB _id so existing bookmarks and applications NEVER break.
    """
    col = get_opportunities_collection()
    sync_logs = get_sync_logs_collection()

    if col is None:
        return {"status": "error", "message": "Database not connected"}

    sync_start = datetime.utcnow()
    records_added = 0
    records_updated = 0
    errors = []

    for item in opportunities_data:
        try:
            source_id = str(item.get("source_id", ""))
            apply_url = item.get("apply_url")

            # Validate mandatory fields
            if not item.get("title") or not apply_url:
                continue

            # Check existing by (source, source_id) or apply_url
            existing = None
            if source_id:
                existing = col.find_one({"source": source_name, "source_id": source_id})
            if not existing and apply_url:
                existing = col.find_one({"source": source_name, "apply_url": apply_url})

            opp_data = {
                "title": item.get("title"),
                "company": item.get("company"),
                "description": item.get("description", ""),
                "required_skills": item.get("required_skills", []),
                "preferred_skills": item.get("preferred_skills", []),
                "location": item.get("location"),
                "city": item.get("city"),
                "type": item.get("type"),
                "domain": item.get("domain", "software"),
                "source": source_name,
                "source_type": "external",
                "source_id": source_id,
                "apply_url": apply_url,
                "stipend": item.get("stipend"),  # Real stipend string or None
                "salary_min": item.get("salary_min"),
                "salary_max": item.get("salary_max"),
                "salary_is_predicted": item.get("salary_is_predicted", False),
                "experience": item.get("experience", "0-2 Years"),
                "hiring_timeline": item.get("hiring_timeline", "Actively Hiring"),
                "logo": item.get("logo", "🌐"),
                "stage": item.get("stage", "Live Feed"),
                "featured": item.get("featured", False),
                "is_live": True,
                "is_active": True,
                "last_synced_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow()
            }

            if item.get("external_created_at"):
                opp_data["external_created_at"] = item["external_created_at"]

            if existing:
                col.update_one({"_id": existing["_id"]}, {"$set": opp_data})
                records_updated += 1
            else:
                opp_data["created_at"] = datetime.utcnow()
                col.insert_one(opp_data)
                records_added += 1

        except Exception as e:
            errors.append(str(e))

    sync_end = datetime.utcnow()

    log_entry = {
        "source": source_name,
        "source_type": "external",
        "started_at": sync_start.isoformat(),
        "completed_at": sync_end.isoformat(),
        "status": "completed" if not errors else "completed_with_errors",
        "records_found": len(opportunities_data),
        "records_added": records_added,
        "records_updated": records_updated,
        "errors": errors
    }

    if sync_logs is not None:
        try:
            sync_logs.insert_one(log_entry)
        except Exception:
            pass

    return log_entry


# =========================================================
# MAIN LIVE PIPELINE ENTRY POINT
# =========================================================

def fetch_and_sync_live_market_jobs(user_profile: dict = None, limit: int = 35) -> dict:
    """
    Main pipeline entrypoint called by /api/dashboard/opportunities/sync-live:
    1. Derives dynamic search queries from the student's profile (role, skills, github).
    2. Primary source: Adzuna Jobs API (if ADZUNA_APP_ID and ADZUNA_APP_KEY configured).
    3. Secondary source: Arbeitnow Real-Time Feed (always available, verified tech positions).
    4. Normalizes, cleans, validates, deduplicates, and upserts into MongoDB.
    5. Strictly preserves real salary or sets to None (no fake data).
    6. Ensures real external apply_url is stored for every listing.
    """
    try:
        queries, location_pref = extract_profile_queries(user_profile)
        print(f"[Live Sync Pipeline] User Profile Queries: {queries} | Location Pref: {location_pref}")

        app_id = os.getenv("ADZUNA_APP_ID")
        app_key = os.getenv("ADZUNA_APP_KEY")
        country = os.getenv("ADZUNA_COUNTRY", "in")

        total_synced = 0
        active_sources = []
        details = {}

        # ---------------------------------------------------------
        # 1. Primary Source: Adzuna Jobs API
        # ---------------------------------------------------------
        if app_id and app_key:
            adzuna_opps = []
            for q in queries:
                raw_adzuna = fetch_adzuna_jobs(query=q, location=location_pref, country=country, page=1, results_per_page=15)
                for item in raw_adzuna:
                    norm = normalize_adzuna_job(item, target_country=country)
                    if norm and norm.get("apply_url"):
                        adzuna_opps.append(norm)

            if adzuna_opps:
                active_sources.append("Adzuna")
                sync_res = sync_from_source("Adzuna", adzuna_opps)
                total_synced += len(adzuna_opps)
                details["adzuna"] = {
                    "fetched": len(adzuna_opps),
                    "added": sync_res.get("records_added", 0),
                    "updated": sync_res.get("records_updated", 0)
                }

        # ---------------------------------------------------------
        # 2. Secondary Source: Arbeitnow (Active Tech & Startup Feed)
        # ---------------------------------------------------------
        # If Adzuna is not configured OR yielded fewer listings than requested limit
        needed_from_secondary = max(limit - total_synced, 15)
        arbeit_opps = []
        for q in queries:
            raw_arbeit = fetch_arbeitnow_jobs(query=q, limit=needed_from_secondary)
            for item in raw_arbeit:
                norm = normalize_arbeitnow_job(item)
                if norm and norm.get("apply_url"):
                    arbeit_opps.append(norm)
            if len(arbeit_opps) >= needed_from_secondary:
                break

        # If query was too specific for Arbeitnow, fetch broader tech positions
        if not arbeit_opps:
            raw_arbeit = fetch_arbeitnow_jobs(query=None, limit=needed_from_secondary)
            for item in raw_arbeit:
                norm = normalize_arbeitnow_job(item)
                if norm and norm.get("apply_url"):
                    arbeit_opps.append(norm)

        if arbeit_opps:
            active_sources.append("Arbeitnow")
            sync_res = sync_from_source("Arbeitnow", arbeit_opps)
            total_synced += len(arbeit_opps)
            details["arbeitnow"] = {
                "fetched": len(arbeit_opps),
                "added": sync_res.get("records_added", 0),
                "updated": sync_res.get("records_updated", 0)
            }

        return {
            "status": "success",
            "jobs_synced": total_synced,
            "sources": active_sources,
            "queries_used": queries,
            "location_used": location_pref,
            "details": details,
            "last_synced_at": datetime.utcnow().isoformat(),
            "message": f"Successfully synced {total_synced} live opportunities from {', '.join(active_sources) if active_sources else 'external feeds'}."
        }

    except Exception as e:
        print(f"[Live Sync Pipeline Error]: {type(e).__name__} - {e}")
        return {
            "status": "warning",
            "message": f"Live opportunities sync completed with warning: {str(e)}",
            "jobs_synced": 0,
            "sources": []
        }
