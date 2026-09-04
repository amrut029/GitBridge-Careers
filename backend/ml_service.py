import os
import pickle
from pathlib import Path
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor

MODEL_PATH = Path(__file__).parent / "model.pkl"

def generate_training_dataset():
    """
    Generates synthetic benchmark training dataset of developer profiles
    across junior, mid, senior, and lead engineering levels.
    """
    np.random.seed(42)
    n_samples = 1200

    # Features:
    # 0: repo_count (0-60)
    # 1: stars_count (0-500)
    # 2: forks_count (0-150)
    # 3: followers_count (0-200)
    # 4: languages_count (1-10)
    # 5: has_private (0 or 1)
    # 6: ats_score (40-100)
    # 7: skills_count (1-20)
    # 8: has_experience (0 or 1)
    # 9: has_projects (0 or 1)

    repo_counts = np.random.exponential(scale=8, size=n_samples).clip(0, 60)
    stars_counts = np.random.exponential(scale=15, size=n_samples).clip(0, 500)
    forks_counts = (stars_counts * np.random.uniform(0.1, 0.4, size=n_samples)).clip(0, 150)
    followers_counts = np.random.exponential(scale=12, size=n_samples).clip(0, 200)
    languages_counts = np.random.randint(1, 10, size=n_samples)
    has_private = np.random.choice([0, 1], size=n_samples, p=[0.3, 0.7])
    ats_scores = np.random.normal(loc=72, scale=12, size=n_samples).clip(40, 100)
    skills_counts = np.random.randint(2, 20, size=n_samples)
    has_experience = np.random.choice([0, 1], size=n_samples, p=[0.4, 0.6])
    has_projects = np.random.choice([0, 1], size=n_samples, p=[0.15, 0.85])

    X = np.column_stack([
        repo_counts, stars_counts, forks_counts, followers_counts,
        languages_counts, has_private, ats_scores, skills_counts,
        has_experience, has_projects
    ])

    # Target ground truth composite score (0-100)
    y = (
        0.22 * ats_scores +
        0.18 * (np.log1p(repo_counts) / np.log1p(40) * 100).clip(0, 100) +
        0.15 * (np.log1p(stars_counts) / np.log1p(100) * 100).clip(0, 100) +
        0.12 * (languages_counts / 7 * 100).clip(0, 100) +
        0.12 * (skills_counts / 14 * 100).clip(0, 100) +
        0.08 * (has_experience * 100) +
        0.08 * (has_projects * 100) +
        0.05 * (has_private * 100)
    ).clip(10, 100)

    return X, y


def train_and_save_model():
    """Trains a Random Forest Regressor and serializes to model.pkl."""
    X, y = generate_training_dataset()
    model = RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)
    model.fit(X, y)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    
    # Also save to parent root if exists
    root_model = Path(__file__).parent.parent / "model.pkl"
    try:
        with open(root_model, "wb") as f:
            pickle.dump(model, f)
    except Exception:
        pass

    print("✅ ML Developer Scoring Model trained and saved to model.pkl successfully!")
    return model


def get_ml_model():
    """Loads the pre-trained ML model or trains a new one if missing."""
    if MODEL_PATH.exists() and MODEL_PATH.stat().st_size > 0:
        try:
            with open(MODEL_PATH, "rb") as f:
                return pickle.load(f)
        except Exception:
            pass
    return train_and_save_model()


# Initialize model on module load
_model = get_ml_model()


def evaluate_developer_profile(github_data=None, resume_data=None):
    """
    ML scoring engine that predicts overall developer score, sub-scores,
    percentile ranking, and personalized engineering milestones.
    """
    gh = github_data or {}
    stats = gh.get("stats", {})
    profile = gh.get("profile", {})
    repos = gh.get("repositories", [])

    res = resume_data or {}

    repo_count = float(stats.get("repositories", len(repos)))
    stars_count = float(stats.get("stars", 0))
    forks_count = float(stats.get("forks", 0))
    followers_count = float(stats.get("followers", profile.get("followers", 0)))
    languages = stats.get("languages", {})
    languages_count = float(len(languages)) if languages else 1.0
    has_private = 1.0 if stats.get("private_repositories", 0) > 0 or gh.get("has_private_access") else 0.0

    ats_score = float(res.get("ats_score", 65))
    skills = res.get("skills", [])
    skills_count = float(len(skills)) if skills else 3.0
    has_experience = 1.0 if res.get("feedback") and not any("experience" in f.lower() for f in res.get("feedback", [])) else 0.5
    has_projects = 1.0 if repo_count > 0 or (res and not any("project" in f.lower() for f in res.get("feedback", []))) else 0.5

    # Feature vector
    feature_vector = np.array([[
        repo_count, stars_count, forks_count, followers_count,
        languages_count, has_private, ats_score, skills_count,
        has_experience, has_projects
    ]])

    try:
        predicted_score = float(_model.predict(feature_vector)[0])
    except Exception:
        # Fallback weighted heuristic if ML inference error
        predicted_score = float(0.4 * ats_score + 0.3 * min(repo_count * 6, 60) + 0.3 * min(stars_count * 5, 40))

    final_score = int(np.clip(round(predicted_score), 25, 99))

    # Sub-scores
    code_quality = int(np.clip(round(35 + min(repo_count * 4.5, 45) + (10 if has_private else 0) + min(stars_count * 2, 10)), 20, 98))
    ats_match = int(np.clip(round(ats_score), 20, 99))
    community_impact = int(np.clip(round(20 + min(stars_count * 8, 50) + min(followers_count * 5, 20) + min(forks_count * 5, 10)), 15, 99))
    tech_stack_breadth = int(np.clip(round(30 + min(languages_count * 9, 45) + min(skills_count * 3, 25)), 25, 99))

    # Developer Level Classification
    if final_score >= 85 or (repo_count >= 15 and stars_count >= 20):
        developer_level = "Senior Software Engineer"
        percentile = "Top 8%"
    elif final_score >= 70 or repo_count >= 6:
        developer_level = "Mid-Level Full-Stack Engineer"
        percentile = "Top 24%"
    elif final_score >= 50 or repo_count >= 2:
        developer_level = "Associate Software Developer"
        percentile = "Top 52%"
    else:
        developer_level = "Emerging Developer"
        percentile = "Top 75%"

    # Key Strengths
    strengths = []
    if code_quality >= 75:
        strengths.append(f"Strong repository velocity with {int(repo_count)} active projects.")
    if ats_match >= 75:
        strengths.append("High ATS resume alignment with industry-standard tech keywords.")
    if tech_stack_breadth >= 70:
        strengths.append(f"Diverse multi-language expertise ({int(languages_count)} programming languages).")
    if community_impact >= 60:
        strengths.append(f"Proven open-source traction ({int(stars_count)} stars, {int(followers_count)} followers).")
    if not strengths:
        strengths.append("Solid coding foundations with active career onboarding in progress.")

    # High-impact recommendations
    recommendations = []
    if repo_count < 5:
        recommendations.append("Build and push 2-3 production-grade full-stack projects with live deployment links.")
    if ats_score < 75:
        recommendations.append("Enhance resume with quantitative metrics (e.g. 'Reduced load time by 30%').")
    if stars_count < 5:
        recommendations.append("Add detailed READMEs with architecture diagrams and demo GIFs to attract GitHub stars.")
    if languages_count < 2:
        recommendations.append("Expand into modern full-stack tools (TypeScript, Docker, FastAPI, PostgreSQL).")
    if not recommendations:
        recommendations.append("Contribute to high-impact open-source repositories and write technical blogs.")

    return {
        "overall_score": final_score,
        "developer_level": developer_level,
        "percentile": percentile,
        "sub_scores": {
            "code_quality": code_quality,
            "ats_match": ats_match,
            "community_impact": community_impact,
            "tech_stack_breadth": tech_stack_breadth
        },
        "strengths": strengths,
        "recommendations": recommendations
    }
