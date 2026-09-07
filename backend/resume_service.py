import re
from pypdf import PdfReader
from docx import Document


def extract_pdf_text(file):
    try:
        reader = PdfReader(file)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ""


def extract_docx_text(file):
    try:
        document = Document(file)
        text = ""
        for paragraph in document.paragraphs:
            if paragraph.text.strip():
                text += paragraph.text + "\n"
        return text.strip()
    except Exception as e:
        print(f"DOCX extraction error: {e}")
        return ""


SKILL_CATEGORIES = {
    "Frontend": [
        "React", "React.js", "Next.js", "Vue", "Vue.js", "Angular", "HTML", "HTML5",
        "CSS", "CSS3", "Tailwind", "Tailwind CSS", "Bootstrap", "Redux", "Zustand",
        "JavaScript", "TypeScript", "Vite", "Webpack", "Sass", "Material UI"
    ],
    "Backend": [
        "Node.js", "Express", "Express.js", "Python", "FastAPI", "Django", "Flask",
        "Java", "Spring Boot", "C++", "C#", ".NET", "Go", "Golang", "Rust", "PHP",
        "GraphQL", "REST API", "Microservices", "Socket.io", "gRPC"
    ],
    "Database": [
        "MongoDB", "PostgreSQL", "MySQL", "SQLite", "Redis", "Supabase", "Firebase",
        "DynamoDB", "Prisma", "Mongoose", "SQLAlchemy", "Elasticsearch"
    ],
    "DevOps & Cloud": [
        "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Google Cloud", "CI/CD",
        "GitHub Actions", "Linux", "Nginx", "Vercel", "Netlify", "Terraform"
    ],
    "Tools & Practices": [
        "Git", "GitHub", "GitLab", "Jira", "Postman", "Figma", "Agile", "Scrum",
        "Jest", "Cypress", "Pytest", "Unit Testing", "Machine Learning", "Data Analysis"
    ]
}


def calculate_ats_score(text):
    if not text:
        return {
            "score": 60,
            "skills": ["Coding", "Git", "Problem Solving"],
            "categorized_skills": {
                "Frontend": ["HTML", "CSS", "JavaScript"],
                "Backend": ["Python", "REST API"],
                "Database": ["SQL"],
                "DevOps & Cloud": ["Git", "Linux"],
                "Tools & Practices": ["Git", "GitHub"]
            },
            "feedback": ["Could not extract full text from resume. Ensure your file is a standard text-based PDF or DOCX file."],
            "checklist": {
                "has_contact": False,
                "has_experience": False,
                "has_education": False,
                "has_projects": False,
                "has_skills": False
            }
        }

    lower_text = text.lower()

    # Categorized skill extraction
    detected_categories = {}
    all_found_skills = []

    for category, skill_list in SKILL_CATEGORIES.items():
        found = []
        for skill in skill_list:
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, lower_text):
                found.append(skill)
                if skill not in all_found_skills:
                    all_found_skills.append(skill)
        if found:
            detected_categories[category] = found

    # Section checklist
    has_contact = bool(re.search(r'(@|phone|mobile|email|github\.com|linkedin\.com)', lower_text))
    has_experience = bool(re.search(r'\b(experience|internship|work history|employment)\b', lower_text))
    has_education = bool(re.search(r'\b(education|bachelor|master|b\.tech|b\.e|bca|mca|degree|university|college)\b', lower_text))
    has_projects = bool(re.search(r'\b(projects|project work|key projects|personal projects)\b', lower_text))
    has_skills = bool(re.search(r'\b(skills|technical skills|technologies|tech stack)\b', lower_text))

    checklist = {
        "has_contact": has_contact,
        "has_experience": has_experience,
        "has_education": has_education,
        "has_projects": has_projects,
        "has_skills": has_skills or len(all_found_skills) > 0
    }

    # ATS Scoring Calculation
    base_score = 40
    # Skills bonus: up to 30 pts
    skill_score = min(len(all_found_skills) * 3, 30)
    # Section completeness: up to 25 pts
    section_score = sum([
        7 if has_projects else 0,
        6 if has_experience else 0,
        5 if has_education else 0,
        4 if has_contact else 0,
        3 if has_skills else 0
    ])
    # Keyword density & length bonus: up to 5 pts
    length_bonus = 5 if len(text) > 500 else 2

    final_score = min(100, base_score + skill_score + section_score + length_bonus)

    # Actionable Feedback
    feedback = []
    if len(all_found_skills) < 5:
        feedback.append("Keyword Match: Add more core technologies and libraries (e.g. React, Docker, SQL, MongoDB) to beat ATS keyword filters.")
    else:
        feedback.append(f"Strong Skill Density: Detected {len(all_found_skills)} technical skills across {len(detected_categories)} domains.")

    if not has_projects:
        feedback.append("Projects Section: Highlight 2-3 significant projects with live demo links, GitHub URLs, and measurable impact metrics.")
    else:
        feedback.append("Projects Highlighted: Ensure each project lists the exact tech stack and bullet points with quantifiable results.")

    if not has_experience:
        feedback.append("Work Experience: Add internships, open-source contributions, or freelance projects under an Experience header.")

    if not has_contact:
        feedback.append("Contact Info: Ensure your GitHub profile, LinkedIn URL, and portfolio link are clearly clickable at the top.")

    return {
        "score": final_score,
        "skills": all_found_skills if all_found_skills else ["Web Development", "Git", "JavaScript"],
        "categorized_skills": detected_categories,
        "feedback": feedback,
        "checklist": checklist
    }
