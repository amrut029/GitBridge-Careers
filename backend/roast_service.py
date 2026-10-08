import random

def generate_roast(github_data):
    repositories = github_data.get("repositories", [])
    user = github_data.get("user", {})

    repo_count = len(repositories)
    followers = user.get("followers", 0)
    following = user.get("following", 0)
    login = user.get("login", "developer")

    if repo_count == 0:
        return (
            f"@{login}, your GitHub profile is so empty that even the default README has filed a missing person report. "
            "Verdict: Create a repo, write some code, and start your developer journey! 🚀"
        )

    if repo_count < 4:
        return (
            f"@{login}, with just {repo_count} repositories, your profile looks more like a weekend draft than an engineering portfolio. "
            "Verdict: Push real projects and leave tutorial clones behind! 🔥"
        )

    if repo_count > 25:
        return (
            f"@{login}, you have {repo_count} repositories—most of which look like abandoned weekend experiments in a digital graveyard. "
            "Verdict: Stop creating new repos for every bug and start shipping to production! ⚡"
        )

    if following > followers * 3 and following > 10:
        return (
            f"@{login}, you are following {following} developers with maximum enthusiasm, but only have {followers} followers. "
            "Verdict: Channel that admiration into daily commits and build something people actually star! 🎯"
        )

    return (
        f"@{login}, you have {repo_count} repositories and {followers} followers—respectable start, but we both know half the commit messages say 'fixed stuff'. "
        "Verdict: Write clean tests, squash your commits, and get hired! 🚀"
    )