const GITHUB_API = "https://api.github.com";

// ===============================
// COMMON GITHUB REQUEST
// ===============================
const githubRequest = async (url) => {
    const response = await fetch(url, {
        headers: {
        Accept: "application/vnd.github+json",
        },
    });

    if (!response.ok) {
        let message = "GitHub API request failed.";

        try {
        const body = await response.json();

        if (body?.message) {
            message = body.message;
        }
        } catch (error) {
        console.error("GitHub error response:", error);
        }

        throw new Error(message);
    }

    return response.json();
    };


    // ===============================
    // GET GITHUB PROFILE
    // ===============================
    export const getGithubProfile = async (username) => {

    return githubRequest(
        `${GITHUB_API}/users/${encodeURIComponent(username)}`
    );

    };


    // ===============================
    // GET ALL PUBLIC REPOSITORIES
    // ===============================
    export const getGithubRepositories = async (username) => {

    const allRepositories = [];

    const perPage = 100;

    // GitHub allows max 100 per page
    // Fetch up to 300 repositories
    for (let page = 1; page <= 3; page++) {

        const repositories = await githubRequest(
        `${GITHUB_API}/users/${encodeURIComponent(
            username
        )}/repos?per_page=${perPage}&page=${page}&sort=updated`
        );

        allRepositories.push(...repositories);

        // If less than 100 came,
        // there are no more repositories
        if (repositories.length < perPage) {
        break;
        }
    }

    return allRepositories;

    };


    // ===============================
    // GET PUBLIC GITHUB EVENTS
    // ===============================
    export const getGithubPublicEvents = async (username) => {

    return githubRequest(
        `${GITHUB_API}/users/${encodeURIComponent(
        username
        )}/events/public?per_page=100`
    );

    };


    // ===============================
    // SEARCH COMMITS
    // ===============================
    export const searchGithubCommits = async (username) => {

    try {

        return await githubRequest(
        `${GITHUB_API}/search/commits?q=author:${encodeURIComponent(
            username
        )}&per_page=1`
        );

    } catch (error) {

        console.warn(
        "GitHub commit search unavailable:",
        error
        );

        return null;
    }

    };


    // ===============================
    // SEARCH PULL REQUESTS
    // ===============================
    export const searchGithubPullRequests = async (username) => {

    try {

        return await githubRequest(
        `${GITHUB_API}/search/issues?q=author:${encodeURIComponent(
            username
        )}+type:pr&per_page=1`
        );

    } catch (error) {

        console.warn(
        "GitHub pull request search unavailable:",
        error
        );

        return null;
    }

    };


    // ===============================
    // SEARCH ISSUES
    // ===============================
    export const searchGithubIssues = async (username) => {

    try {

        return await githubRequest(
        `${GITHUB_API}/search/issues?q=author:${encodeURIComponent(
            username
        )}+type:issue&per_page=1`
        );

    } catch (error) {

        console.warn(
        "GitHub issue search unavailable:",
        error
        );

        return null;
    }

    };