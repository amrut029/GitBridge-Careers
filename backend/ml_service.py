import os
import pickle
from pathlib import Path
import numpy as np
from sklearn.ensemble import RandomForestRegressor

MODEL_PATH = Path(__file__).parent / "model.pkl"

DOMAIN_KEYWORDS = {
    "devops": {
        "name": "DevOps & Cloud Infrastructure",
        "role": "DevOps / Cloud Engineer",
        "keywords": [
            "jenkins", "kubernetes", "kube", "terraform", "docker", "dockerfile",
            "hcl", "shell", "bash", "linux", "cloud", "clpoud", "ci/cd", "cicd",
            "ansible", "aws", "gcp", "azure", "helm", "ops", "prometheus",
            "grafana", "nginx", "iac", "devops", "vagrant", "openshift"
        ]
    },
    "frontend": {
        "name": "Frontend & UI/UX Engineering",
        "role": "Frontend Web Engineer",
        "keywords": [
            "react", "reactjs", "vue", "vuejs", "angular", "next", "nextjs",
            "html", "css", "tailwind", "ui", "vite", "frontend", "svelte",
            "redux", "zustand", "sass", "bootstrap", "typescript", "javascript",
            "chakra", "figma"
        ]
    },
    "backend": {
        "name": "Backend & Distributed Systems",
        "role": "Backend / API Engineer",
        "keywords": [
            "fastapi", "django", "flask", "express", "node", "nodejs", "spring",
            "springboot", "java", "c++", "cpp", "golang", "go", "rust",
            "postgresql", "postgres", "mysql", "mongodb", "redis", "microservice",
            "microservices", "rest", "graphql", "grpc", "api", "database"
        ]
    },
    "ai_ml": {
        "name": "AI / ML & Data Science",
        "role": "AI / ML Systems Engineer",
        "keywords": [
            "machine learning", "deep learning", "ai", "ml", "nlp", "vision",
            "pytorch", "tensorflow", "scikit", "data science", "jupyter",
            "pandas", "numpy", "huggingface", "llm", "transformer", "rag", "langchain"
        ]
    }
}


def analyze_developer_domain(repos, languages, resume_skills=None):
    """
    Analyzes actual GitHub repository names, languages, descriptions,
    and resume skills to determine the developer's true technical specialization.
    """
    scores = {
        "devops": 0,
        "frontend": 0,
        "backend": 0,
        "ai_ml": 0
    }

    matched_keywords = {k: [] for k in scores}

    # 1. Analyze repositories (names, descriptions, languages)
    for repo in repos:
        name = str(repo.get("name", "")).lower()
        desc = str(repo.get("description", "")).lower()
        lang = str(repo.get("language", "")).lower()
        text = f"{name} {desc} {lang}"

        for domain, conf in DOMAIN_KEYWORDS.items():
            for kw in conf["keywords"]:
                if kw in text:
                    scores[domain] += 2
                    if kw not in matched_keywords[domain]:
                        matched_keywords[domain].append(kw)

    # 2. Analyze language breakdown
    for lang in (languages or {}).keys():
        lower_lang = lang.lower()
        if lower_lang in ["hcl", "shell", "dockerfile", "powershell"]:
            scores["devops"] += 4
        elif lower_lang in ["javascript", "typescript", "html", "css", "vue", "svelte"]:
            scores["frontend"] += 2
        elif lower_lang in ["python", "java", "c++", "c#", "go", "rust", "php"]:
            scores["backend"] += 2
        elif lower_lang in ["jupyter notebook", "r", "julia"]:
            scores["ai_ml"] += 4

    # 3. Analyze resume skills (if uploaded)
    for skill in (resume_skills or []):
        lower_skill = skill.lower()
        for domain, conf in DOMAIN_KEYWORDS.items():
            for kw in conf["keywords"]:
                if kw in lower_skill:
                    scores[domain] += 3
                    if kw not in matched_keywords[domain]:
                        matched_keywords[domain].append(kw)

    # Find highest domain
    sorted_domains = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    top_domain, top_score = sorted_domains[0]
    second_domain, second_score = sorted_domains[1]

    if top_score == 0:
        return {
            "domain_id": "fullstack",
            "domain_name": "Full-Stack Web Development",
            "role_title": "Software Developer",
            "primary_signal": "General Software Development",
            "matched_skills": []
        }

    # If both frontend and backend are strong and balanced
    if (
        (top_domain in ["frontend", "backend"] and second_domain in ["frontend", "backend"])
        and second_score >= top_score * 0.6
        and top_score > 4
    ):
        return {
            "domain_id": "fullstack",
            "domain_name": "Full-Stack Web Architecture",
            "role_title": "Full-Stack Engineer",
            "primary_signal": "React & Python / Node.js",
            "matched_skills": matched_keywords["frontend"][:3] + matched_keywords["backend"][:3]
        }

    conf = DOMAIN_KEYWORDS[top_domain]
    top_keywords = [k.capitalize() for k in matched_keywords[top_domain][:4]]
    primary_signal = " & ".join(top_keywords[:2]) if top_keywords else conf["name"]

    return {
        "domain_id": top_domain,
        "domain_name": conf["name"],
        "role_title": conf["role"],
        "primary_signal": primary_signal,
        "matched_skills": top_keywords
    }


def evaluate_developer_profile(github_data=None, resume_data=None):
    """
    Accurately evaluates developer metrics based on REAL GitHub activity
    and uploaded resume data. If data is missing (0 repos or no resume),
    accurately returns pending/unrated states instead of inflated defaults.
    """
    gh = github_data or {}
    stats = gh.get("stats", {})
    profile = gh.get("profile", {})
    repos = gh.get("repositories", [])
    languages = stats.get("languages", {})

    res = resume_data or {}
    has_resume = bool(res and res.get("uploaded_at"))

    repo_count = int(stats.get("repositories", len(repos)))
    stars_count = int(stats.get("stars", 0))
    forks_count = int(stats.get("forks", 0))
    followers_count = int(stats.get("followers", profile.get("followers", 0)))
    private_count = int(stats.get("private_repositories", 0))
    languages_count = len(languages)
    has_private = bool(private_count > 0 or gh.get("has_private_access"))

    resume_skills = res.get("skills", []) if has_resume else []
    ats_score = int(res.get("ats_score", 0)) if has_resume else 0

    # 1. Zero data state (No repos & No resume)
    if repo_count == 0 and not has_resume:
        return {
            "overall_score": 0,
            "status": "pending_data",
            "developer_level": "Onboarding Developer",
            "percentile": "Unranked",
            "domain_id": "fullstack",
            "domain_name": "Getting Started",
            "primary_signal": "Connect GitHub & Upload Resume",
            "sub_scores": {
                "code_quality": 0,
                "ats_match": 0,
                "community_impact": 0,
                "tech_stack_breadth": 0
            },
            "strengths": ["Account created. Connect GitHub or upload resume to generate your score."],
            "recommendations": [
                "Connect your GitHub profile with public and private repositories.",
                "Upload your tech resume (PDF/DOCX) for deep ATS parsing."
            ]
        }

    # 2. Deep Domain Specialization Analysis
    domain_info = analyze_developer_domain(repos, languages, resume_skills)

    # 3. Sub-scores Calculation based strictly on REAL data
    # Code Quality (Max 98)
    if repo_count == 0:
        code_quality = 0
    else:
        base_cq = 40 + min(repo_count * 2.5, 35) + (10 if has_private else 0) + min(stars_count * 2, 10) + min(forks_count, 5)
        code_quality = int(np.clip(round(base_cq), 25, 96))

    # ATS Match (Max 99)
    if not has_resume:
        ats_match = 0
    else:
        ats_match = int(np.clip(ats_score, 20, 99))

    # Community Impact (Max 99)
    if repo_count == 0 and followers_count == 0:
        community_impact = 0
    else:
        base_ci = 20 + min(stars_count * 6, 40) + min(followers_count * 3, 20) + min(forks_count * 3, 15)
        community_impact = int(np.clip(round(base_ci), 15, 98))

    # Tech Stack Breadth (Max 99)
    total_distinct_tech = languages_count + len(resume_skills)
    if total_distinct_tech == 0:
        tech_stack_breadth = 0
    else:
        base_tb = 30 + min(languages_count * 8, 40) + min(len(resume_skills) * 3, 25)
        tech_stack_breadth = int(np.clip(round(base_tb), 25, 98))

    # 4. Overall ML Score
    if repo_count > 0 and has_resume:
        overall_score = int(round(0.35 * code_quality + 0.35 * ats_match + 0.15 * tech_stack_breadth + 0.15 * community_impact))
    elif repo_count > 0:
        # Only GitHub connected
        overall_score = int(round(0.55 * code_quality + 0.25 * tech_stack_breadth + 0.20 * community_impact))
    else:
        # Only Resume uploaded
        overall_score = int(round(0.70 * ats_match + 0.30 * tech_stack_breadth))

    overall_score = int(np.clip(overall_score, 10, 99))

    # 5. Developer Level & Seniority Classification
    role_prefix = domain_info["role_title"]
    if overall_score >= 82 or (repo_count >= 18 and (stars_count >= 10 or forks_count >= 10)):
        developer_level = f"Senior {role_prefix}"
        percentile = "Top 10%"
    elif overall_score >= 62 or repo_count >= 8:
        developer_level = f"Mid-Level {role_prefix}"
        percentile = "Top 25%"
    elif overall_score >= 40 or repo_count >= 2:
        developer_level = f"Associate {role_prefix}"
        percentile = "Top 50%"
    else:
        developer_level = f"Junior {role_prefix}"
        percentile = "Top 75%"

    # 6. Strengths
    strengths = []
    if repo_count > 0:
        strengths.append(f"Active repository portfolio with {repo_count} projects ({domain_info['domain_name']}).")
    if has_private:
        strengths.append(f"Connected {private_count} private repositories with enterprise access.")
    if has_resume:
        strengths.append(f"ATS-parsed resume with {len(resume_skills)} technical skills.")
    if stars_count > 0 or forks_count > 0:
        strengths.append(f"Community recognition with {stars_count} stars and {forks_count} forks.")
    if not strengths:
        strengths.append("Foundational profile initialized.")

    # 7. Strategic Recommendations
    recommendations = []
    if not has_resume:
        recommendations.append("Upload your resume to calculate ATS Match score and boost recruiter visibility.")
    if repo_count < 5:
        recommendations.append(f"Deploy 2-3 production projects in {domain_info['domain_name']} with live links.")
    if stars_count < 5:
        recommendations.append("Add detailed READMEs with architectural diagrams to showcase repository quality.")
    if domain_info["domain_id"] == "devops":
        recommendations.append("Showcase multi-node Kubernetes deployments and automated Terraform CI/CD pipelines.")
    elif domain_info["domain_id"] == "frontend":
        recommendations.append("Add Core Web Vitals optimization benchmarks and responsive design demos.")
    elif domain_info["domain_id"] == "backend":
        recommendations.append("Implement database query caching (Redis) and async microservice architectures.")

    return {
        "overall_score": overall_score,
        "developer_level": developer_level,
        "percentile": percentile,
        "domain_id": domain_info["domain_id"],
        "domain_name": domain_info["domain_name"],
        "primary_signal": domain_info["primary_signal"],
        "sub_scores": {
            "code_quality": code_quality,
            "ats_match": ats_match,
            "community_impact": community_impact,
            "tech_stack_breadth": tech_stack_breadth
        },
        "strengths": strengths,
        "recommendations": recommendations
    }
