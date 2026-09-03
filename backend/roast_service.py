def generate_roast(github_data):

    repositories = github_data.get(
        "repositories",
        []
    )

    user = github_data.get(
        "user",
        {}
    )


    repo_count = len(repositories)

    followers = user.get(
        "followers",
        0
    )

    following = user.get(
        "following",
        0
    )


    # =====================================================
    # ROAST LOGIC
    # =====================================================

    if repo_count == 0:

        return (
            "Your GitHub profile is so empty that "
            "even README is waiting for your first project."
        )


    if repo_count < 3:

        return (
            f"You have {repo_count} repositories. "
            "GitHub is probably asking when the real "
            "coding journey will begin."
        )


    if repo_count > 15:

        return (
            f"You have {repo_count} repositories! "
            "At this point even you might be wondering "
            "which project is actually your best one."
        )


    if following > followers * 3 and following > 10:

        return (
            "You are following developers with full "
            "motivation... now GitHub is waiting for "
            "your commits to show the same energy."
        )


    return (
        f"{repo_count} repositories and {followers} followers... "
        "not bad! But your GitHub still has room to become legendary."
    )