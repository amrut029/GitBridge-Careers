from pypdf import PdfReader
from docx import Document


def extract_pdf_text(file):

    reader = PdfReader(file)

    text = ""

    for page in reader.pages:

        page_text = page.extract_text()

        if page_text:

            text += page_text + "\n"

    return text.strip()


def extract_docx_text(file):

    document = Document(file)

    text = ""

    for paragraph in document.paragraphs:

        if paragraph.text.strip():

            text += paragraph.text + "\n"

    return text.strip()


def calculate_ats_score(text):

    keywords = [

        "python",
        "java",
        "javascript",
        "react",
        "node",
        "sql",
        "mongodb",
        "machine learning",
        "github",
        "docker",
        "aws",
        "fastapi",

    ]


    lower_text = text.lower()


    found_skills = [

        keyword

        for keyword in keywords

        if keyword in lower_text

    ]


    score = min(
        len(found_skills) * 8,
        80
    )


    # Bonus points

    if "project" in lower_text:

        score += 5


    if "experience" in lower_text:

        score += 5


    if "education" in lower_text:

        score += 5


    score = min(score, 100)


    feedback = []


    if len(found_skills) < 4:

        feedback.append(
            "Add more relevant technical skills."
        )


    if "project" not in lower_text:

        feedback.append(
            "Add a projects section."
        )


    if "experience" not in lower_text:

        feedback.append(
            "Add internship or experience details."
        )


    if not feedback:

        feedback.append(
            "Your resume has a good basic structure."
        )


    return {

        "score": score,

        "skills": found_skills,

        "feedback": feedback,

    }