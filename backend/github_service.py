import os
import httpx

from dotenv import load_dotenv

load_dotenv()


GITHUB_API = "https://api.github.com"

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_REDIRECT_URI = os.getenv(
    "GITHUB_REDIRECT_URI",
    "http://localhost:8000/api/github/callback"
)


# =========================================================
# COMMON HEADERS
# =========================================================

def github_headers(access_token: str):

    return {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


# =========================================================
# EXCHANGE OAUTH CODE FOR ACCESS TOKEN
# =========================================================

async def exchange_github_code(code: str):

    data = {
        "client_id": GITHUB_CLIENT_ID,
        "client_secret": GITHUB_CLIENT_SECRET,
        "code": code,
        "redirect_uri": GITHUB_REDIRECT_URI,
    }

    headers = {
        "Accept": "application/json"
    }

    async with httpx.AsyncClient(timeout=30) as client:

        response = await client.post(
            "https://github.com/login/oauth/access_token",
            data=data,
            headers=headers,
        )

        response.raise_for_status()

        result = response.json()

    if "error" in result:
        raise Exception(
            result.get(
                "error_description",
                "GitHub authorization failed"
            )
        )

    access_token = result.get("access_token")

    if not access_token:
        raise Exception(
            "GitHub access token was not received"
        )

    return {
        "access_token": access_token,
        "scope": result.get("scope", ""),
        "token_type": result.get(
            "token_type",
            "bearer"
        ),
    }


# =========================================================
# GET AUTHENTICATED GITHUB USER
# =========================================================

async def get_github_user(access_token: str):

    headers = github_headers(access_token)

    async with httpx.AsyncClient(timeout=30) as client:

        response = await client.get(
            f"{GITHUB_API}/user",
            headers=headers,
        )

        response.raise_for_status()

        return response.json()


# =========================================================
# GET AUTHENTICATED USER EMAIL
# =========================================================

async def get_github_emails(access_token: str):

    headers = github_headers(access_token)

    async with httpx.AsyncClient(timeout=30) as client:

        response = await client.get(
            f"{GITHUB_API}/user/emails",
            headers=headers,
        )

        if response.status_code == 403:
            return []

        response.raise_for_status()

        return response.json()


# =========================================================
# GET ALL REPOSITORIES
# PUBLIC + PRIVATE
# =========================================================

async def get_github_repositories(
    access_token: str
):

    headers = github_headers(access_token)

    repositories = []

    page = 1

    async with httpx.AsyncClient(timeout=30) as client:

        while True:

            response = await client.get(
                f"{GITHUB_API}/user/repos",
                headers=headers,
                params={
                    "visibility": "all",
                    "affiliation": "owner,collaborator,organization_member",
                    "sort": "updated",
                    "direction": "desc",
                    "per_page": 100,
                    "page": page,
                },
            )

            response.raise_for_status()

            data = response.json()

            if not data:
                break

            repositories.extend(data)

            if len(data) < 100:
                break

            page += 1

    return repositories


# =========================================================
# GET REPOSITORY LANGUAGES
# =========================================================

async def get_repository_languages(
    access_token: str,
    owner: str,
    repo: str
):

    headers = github_headers(access_token)

    async with httpx.AsyncClient(timeout=30) as client:

        response = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/languages",
            headers=headers,
        )

        if response.status_code != 200:
            return {}

        return response.json()


# =========================================================
# GET REPOSITORY COMMITS
# =========================================================

async def get_repository_commits(
    access_token: str,
    owner: str,
    repo: str
):

    headers = github_headers(access_token)

    async with httpx.AsyncClient(timeout=30) as client:

        response = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/commits",
            headers=headers,
            params={
                "per_page": 1
            },
        )

        if response.status_code != 200:
            return 0

        total = response.headers.get(
            "Link",
            ""
        )

        # Exact total pagination count is not
        # always available. For now return
        # the first page count as a safe value.
        return len(response.json())


# =========================================================
# GET ALL ISSUES CREATED BY USER
# =========================================================

async def get_user_issues(
    access_token: str
):

    headers = github_headers(access_token)

    async with httpx.AsyncClient(timeout=30) as client:

        response = await client.get(
            f"{GITHUB_API}/issues",
            headers=headers,
            params={
                "filter": "created",
                "state": "all",
                "per_page": 100,
            },
        )

        if response.status_code != 200:
            return []

        return response.json()


# =========================================================
# GET USER PULL REQUESTS
# =========================================================

async def get_user_pull_requests(
    access_token: str
):

    headers = github_headers(access_token)

    async with httpx.AsyncClient(timeout=30) as client:

        response = await client.get(
            f"{GITHUB_API}/search/issues",
            headers=headers,
            params={
                "q": "author:@me type:pr",
                "per_page": 100,
            },
        )

        if response.status_code != 200:
            return []

        data = response.json()

        return data.get(
            "items",
            []
        )


# =========================================================
# COMPLETE GITHUB PROFILE
# =========================================================

async def get_complete_github_data(
    access_token: str
):

    user = await get_github_user(
        access_token
    )

    repositories = await get_github_repositories(
        access_token
    )

    emails = await get_github_emails(
        access_token
    )

    issues = await get_user_issues(
        access_token
    )

    pull_requests = await get_user_pull_requests(
        access_token
    )

    return {
        "user": user,
        "repositories": repositories,
        "emails": emails,
        "issues": issues,
        "pull_requests": pull_requests,
    }