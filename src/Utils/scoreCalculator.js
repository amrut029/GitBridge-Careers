export const calculateGithubScore = (githubData) => {
    if (!githubData) {
        return 0;
    }
    
    let score = 0;
    
    // Repositories
    if (githubData.publicRepos >= 20) {
        score += 30;
    } else if (githubData.publicRepos >= 10) {
        score += 20;
    } else if (githubData.publicRepos >= 5) {
        score += 10;
    } else {
        score += 5;
    }
    
    // Followers
    if (githubData.followers >= 50) {
        score += 20;
    } else if (githubData.followers >= 20) {
        score += 15;
    } else if (githubData.followers >= 5) {
        score += 10;
    } else {
        score += 5;
    }
    
    // Languages
    const languageCount =
        Object.keys(githubData.languages || {}).length;
    
    if (languageCount >= 5) {
        score += 30;
    } else if (languageCount >= 3) {
        score += 20;
    } else if (languageCount >= 1) {
        score += 10;
    }
    
    // Following
    if (githubData.following >= 10) {
        score += 10;
    } else {
        score += 5;
    }
    
    // Account age
    const currentYear = new Date().getFullYear();
    
    const age =
        currentYear - githubData.accountAge;
    
    if (age >= 3) {
        score += 10;
    } else if (age >= 1) {
        score += 5;
    }
    
    return Math.min(score, 100);
    };