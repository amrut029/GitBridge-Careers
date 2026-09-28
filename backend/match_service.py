import numpy as np

def calculate_opportunity_match(user_resume, github_data, opportunity):
    """
    Calculates match percentage and matched skills between user and opportunity.
    """
    user_skills = [s.lower() for s in (user_resume.get("skills", []) if user_resume else [])]
    user_langs = [l.lower() for l in (github_data.get("stats", {}).get("languages", {}).keys() if github_data else [])]

    # Extract technologies and keywords from actual repositories
    repo_keywords = []
    if github_data:
        for r in github_data.get("repositories", []):
            name = str(r.get("name", "")).lower()
            desc = str(r.get("description", "")).lower()
            text = f"{name} {desc}"
            for kw in [
                "kubernetes", "docker", "terraform", "jenkins", "linux", "react", "python",
                "fastapi", "aws", "node", "html", "css", "mongodb", "postgres", "git",
                "ci/cd", "hcl", "shell", "bash", "ansible", "microservice", "vue", "next"
            ]:
                if kw in text:
                    repo_keywords.append(kw)

    all_user_skills = set(user_skills + user_langs + repo_keywords)

    required = opportunity.get("required_skills", [])
    matched_skills = []

    if not all_user_skills:
        match_pct = 40
    else:
        for req in required:
            req_l = req.lower()
            # Direct match
            if any(req_l in us or us in req_l for us in all_user_skills):
                matched_skills.append(req)
            # Domain aliases (e.g. HCL/Shell -> DevOps/Linux/Terraform/Kubernetes)
            elif req_l in ["devops", "cloud", "aws", "docker", "linux", "ci/cd", "terraform", "kubernetes", "jenkins"] and any(
                k in all_user_skills for k in ["hcl", "shell", "terraform", "kubernetes", "jenkins", "dockerfile", "linux"]
            ):
                matched_skills.append(req)

        match_ratio = len(matched_skills) / max(len(required), 1)
        match_pct = int(np.clip(round(40 + match_ratio * 56), 35, 96))
        
    # Get missing skills
    missing_skills = [req for req in required if req not in matched_skills]

    return {
        "match_score": match_pct,
        "matched_skills": list(dict.fromkeys(matched_skills)),
        "missing_skills": list(dict.fromkeys(missing_skills)),
        "user_skill_count": len(all_user_skills)
    }
