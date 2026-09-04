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


def calculate_ats_score(text):
    if not text:
        return {
            "score": 60,
            "skills": ["Coding", "Problem Solving"],
            "feedback": ["Could not parse full text from resume. Ensure your file has selectable text."]
        }

    keywords = [
        "python", "javascript", "typescript", "react", "node", "sql", "mongodb",
        "fastapi", "docker", "aws", "git", "github", "html", "css", "tailwind",
        "express", "postgresql", "c++", "java", "machine learning", "rest api",
        "django", "flask", "linux", "graphql", "ci/cd", "next.js", "redux"
    ]

    lower_text = text.lower()

    found_skills = [
        keyword.title() for keyword in keywords
        if keyword in lower_text
    ]

    found_skills = list(dict.fromkeys(found_skills))

    score = 45 + min(len(found_skills) * 5, 40)

    if "project" in lower_text:
        score += 5
    if "experience" in lower_text or "internship" in lower_text:
        score += 5
    if "education" in lower_text or "degree" in lower_text:
        score += 5

    score = min(score, 100)

    feedback = []
    if len(found_skills) < 4:
        feedback.append("Add more relevant core technical skills to pass ATS filters.")
    if "project" not in lower_text:
        feedback.append("Highlight technical projects with GitHub links and measurable impact.")
    if "experience" not in lower_text and "internship" not in lower_text:
        feedback.append("Add internship, freelance, or open-source contribution details.")

    if not feedback:
        feedback.append("Strong ATS profile! Key skills and experience sections are well represented.")

    return {
        "score": score,
        "skills": found_skills if found_skills else ["Web Development", "Git"],
        "feedback": feedback,
    }
