import os
import time
import jwt
import httpx

from dotenv import load_dotenv

load_dotenv()

GITHUB_APP_ID = os.getenv("GITHUB_APP_ID")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_PRIVATE_KEY_PATH = os.getenv("GITHUB_PRIVATE_KEY_PATH")


def load_private_key():
    with open(GITHUB_PRIVATE_KEY_PATH, "r") as file:
        return file.read()


def create_app_jwt():

    now = int(time.time())

    payload = {
        "iat": now - 60,
        "exp": now + (9 * 60),
        "iss": GITHUB_APP_ID,
    }

    token = jwt.encode(
        payload,
        load_private_key(),
        algorithm="RS256",
    )

    return token


async def get_installation_repositories(
    installation_id: int,
):

    app_jwt = create_app_jwt()

    headers = {
        "Authorization": f"Bearer {app_jwt}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    async with httpx.AsyncClient() as client:

        response = await client.get(
            f"https://api.github.com/app/installations/"
            f"{installation_id}/repositories",
            headers=headers,
        )

        response.raise_for_status()

        return response.json()