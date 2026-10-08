import numpy as np

def calculate_opportunity_match(user_resume, github_data, opportunity, user_profile=None):
    """
    Calculates detailed AI match percentage and breakdown between candidate and opportunity.
    Returns:
      - match_score / overall_match
      - skills_match
      - github_match
      - resume_match
      - experience_match
      - recommendation ("Strong Candidate", "Good Match", "Needs Upskilling")
      - explanation ("Why this candidate?")
      - matched_skills
      - missing_skills
    """
    user_skills = [str(s).strip() for s in (user_resume.get("skills", []) if user_resume else [])]
    user_skills_lower = [s.lower() for s in user_skills]
    
    user_langs = list(github_data.get("stats", {}).get("languages", {}).keys() if github_data else [])
    user_langs_lower = [l.lower() for l in user_langs]

    # Extract keywords from actual repositories
    repo_keywords = []
    repo_count = 0
    stars_count = 0
    if github_data:
        repos = github_data.get("repositories", [])
        repo_count = len(repos)
        stats = github_data.get("stats", {})
        stars_count = stats.get("stars", 0)
        for r in repos:
            name = str(r.get("name", "")).lower()
            desc = str(r.get("description", "")).lower()
            text = f"{name} {desc}"
            for kw in [
                "kubernetes", "docker", "terraform", "jenkins", "linux", "react", "python",
                "fastapi", "aws", "node", "html", "css", "mongodb", "postgres", "git",
                "ci/cd", "hcl", "shell", "bash", "ansible", "microservice", "vue", "next",
                "typescript", "javascript", "django", "flask", "express", "sql", "redux"
            ]:
                if kw in text:
                    repo_keywords.append(kw)

    all_user_skills = set(user_skills_lower + user_langs_lower + repo_keywords)

    required = opportunity.get("required_skills", [])
    if isinstance(required, str):
        required = [s.strip() for s in required.split(",") if s.strip()]

    matched_skills = []
    if required:
        for req in required:
            req_l = str(req).lower().strip()
            # Direct match
            if any(req_l in us or us in req_l for us in all_user_skills):
                matched_skills.append(req)
            # Domain aliases (e.g. HCL/Shell -> DevOps/Linux/Terraform/Kubernetes)
            elif req_l in ["devops", "cloud", "aws", "docker", "linux", "ci/cd", "terraform", "kubernetes", "jenkins"] and any(
                k in all_user_skills for k in ["hcl", "shell", "terraform", "kubernetes", "jenkins", "dockerfile", "linux", "aws"]
            ):
                matched_skills.append(req)
            elif req_l in ["frontend", "web", "fullstack"] and any(
                k in all_user_skills for k in ["react", "vue", "next", "html", "css", "javascript", "typescript"]
            ):
                matched_skills.append(req)
            elif req_l in ["backend"] and any(
                k in all_user_skills for k in ["python", "node", "fastapi", "django", "express", "sql", "mongodb"]
            ):
                matched_skills.append(req)

    missing_skills = [req for req in required if req not in matched_skills]

    # 1. Skills Match %
    if not required:
        skills_match = 75
    else:
        skill_ratio = len(matched_skills) / max(len(required), 1)
        skills_match = int(np.clip(round(35 + skill_ratio * 63), 30, 98))

    # 2. GitHub Match %
    github_match = 40
    if github_data and repo_count > 0:
        matching_langs = [l for l in user_langs_lower if any(l in req.lower() or req.lower() in l for req in required)]
        base_gh = 50 + min(repo_count * 4, 25) + min(stars_count * 2, 10)
        if matching_langs:
            base_gh += 12
        github_match = int(np.clip(base_gh, 40, 96))

    # 3. Resume Match %
    ats_score = user_resume.get("ats_score", 60) if user_resume else 50
    resume_match = int(np.clip(round((ats_score * 0.6) + (skills_match * 0.4)), 35, 95))

    # 4. Experience Match %
    experience_req = str(opportunity.get("experience", "0-2 Years")).lower()
    if "0" in experience_req or "fresh" in experience_req or "intern" in str(opportunity.get("type", "")).lower():
        experience_match = 85
    else:
        experience_match = 75

    # 5. Overall Match % (Weighted Blend)
    overall_match = int(round(
        (skills_match * 0.45) +
        (github_match * 0.25) +
        (resume_match * 0.20) +
        (experience_match * 0.10)
    ))
    overall_match = int(np.clip(overall_match, 35, 98))

    # 6. Recommendation
    if overall_match >= 82:
        recommendation = "Strong Candidate"
    elif overall_match >= 65:
        recommendation = "Good Match"
    else:
        recommendation = "Needs Upskilling"

    # 7. Explanation ("Why this candidate?")
    matched_sample = ", ".join(matched_skills[:2]) if matched_skills else ""
    missing_sample = ", ".join(missing_skills[:2]) if missing_skills else ""

    if matched_skills and missing_skills:
        explanation = f"Strong {matched_sample} proficiency and verified project history, but limited verifiable experience in {missing_sample}."
    elif matched_skills and not missing_skills:
        explanation = f"Exceptional fit across core requirements ({matched_sample}) with solid GitHub commits and resume alignment."
    elif not matched_skills and missing_skills:
        explanation = f"Foundational engineering background, but currently missing key role requirements ({missing_sample})."
    else:
        explanation = "Candidate profile matches baseline technical requirements for this role."

    return {
        "match_score": overall_match,
        "overall_match": overall_match,
        "skills_match": skills_match,
        "github_match": github_match,
        "resume_match": resume_match,
        "experience_match": experience_match,
        "recommendation": recommendation,
        "explanation": explanation,
        "matched_skills": list(dict.fromkeys(matched_skills)),
        "missing_skills": list(dict.fromkeys(missing_skills)),
        "user_skill_count": len(all_user_skills)
    }
