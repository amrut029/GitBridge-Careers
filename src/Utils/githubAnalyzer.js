export const analyzeGithub = async (username) => {
    try {
        const response = await fetch(
        `https://api.github.com/users/${username}`
        );
        
        if (!response.ok) {
        throw new Error("GitHub user not found");
        }
        
        const user = await response.json();
        
        const repoResponse = await fetch(
        `https://api.github.com/users/${username}/repos?per_page=100`
        );
        
        if (!repoResponse.ok) {
        throw new Error("Unable to fetch repositories");
        }
        
        const repos = await repoResponse.json();
        
        const languages = {};
        
        repos.forEach((repo) => {
        if (repo.language) {
            languages[repo.language] =
            (languages[repo.language] || 0) + 1;
        }
        });
        
        return {
        username: user.login,
        name: user.name,
        avatar: user.avatar_url,
        publicRepos: user.public_repos,
        followers: user.followers,
        following: user.following,
        accountAge: new Date(user.created_at).getFullYear(),
        repositories: repos,
        languages,
        };
        
    } catch (error) {
        console.error("GitHub Analysis Error:", error);
        throw error;
    }
    };