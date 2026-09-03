import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardPage.css";

function DashboardPage() {
  const navigate = useNavigate();

  // =====================================================
  // USER DATA
  // =====================================================

  const userData = localStorage.getItem("user");

  let user = {};

  try {
    user = userData ? JSON.parse(userData) : {};
  } catch (error) {
    console.error("User data error:", error);
  }

  // =====================================================
  // STATES
  // =====================================================

  const [githubUsername, setGithubUsername] = useState("");
  const [githubConnected, setGithubConnected] = useState(false);

  const [githubData, setGithubData] = useState({
    name: "",
    username: "",
    avatar: "",
    followers: 0,
    following: 0,
    repositories: 0,
  });

  const [showMore, setShowMore] = useState(false);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [resumeName, setResumeName] = useState("");

  // =====================================================
  // DEMO DASHBOARD DATA
  // Backend connect hone ke baad ye real GitHub data se
  // replace hoga
  // =====================================================

  const technologies = [
    "JavaScript",
    "React",
    "Python",
    "HTML",
    "CSS",
    "Node.js",
    "MongoDB",
    "Git",
    "GitHub",
    "Java",
    "C++",
    "SQL",
  ];

  const visibleTechnologies = showMore
    ? technologies
    : technologies.slice(0, 6);

  // =====================================================
  // AI SCORE
  // =====================================================

  const aiScore = githubConnected ? 82 : 0;

  // =====================================================
  // ML SCORE
  // =====================================================

  const mlScore = githubConnected ? 78 : 0;

  // =====================================================
  // OVERALL SCORE
  // =====================================================

  const overallScore = githubConnected
    ? Math.round((aiScore + mlScore) / 2)
    : 0;

  // =====================================================
  // GITHUB CONNECT
  // =====================================================

  const handleGithubConnect = async () => {
    if (!githubUsername.trim()) {
      setMessage("Please enter your GitHub username");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      /*
        फिलहाल GitHub username se demo data.
        Next backend code me GitHub API connect करेंगे.
      */

      const response = await fetch(
        `https://api.github.com/users/${githubUsername}`
      );

      if (!response.ok) {
        throw new Error("GitHub user not found");
      }

      const data = await response.json();

      setGithubData({
        name: data.name || data.login,
        username: data.login,
        avatar: data.avatar_url,
        followers: data.followers,
        following: data.following,
        repositories: data.public_repos,
      });

      setGithubConnected(true);

      setMessage("GitHub profile connected successfully!");

    } catch (error) {
      console.error(error);

      setGithubConnected(false);

      setMessage(
        "GitHub profile not found. Please check username."
      );
    }

    setLoading(false);
  };

  // =====================================================
  // RESUME UPLOAD
  // =====================================================

  const handleResumeUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setResumeName(file.name);

    setMessage(
      "Resume selected successfully: " + file.name
    );
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  // =====================================================
  // ROAST GENERATOR
  // =====================================================

  const generateRoast = () => {
    if (!githubConnected) {
      return "Pehle GitHub connect kar bhai 😄, bina profile dekhe roast karna cheating ho jayega!";
    }

    const repoCount = githubData.repositories;

    if (repoCount === 0) {
      return `Bhai ${githubData.username}, GitHub account toh bana liya... ab repositories bhi bana le 😂`;
    }

    if (repoCount < 5) {
      return `${githubData.username} bhai, repositories kam hain, lagta hai coding se zyada README decorate karne me time ja raha hai 😂🔥`;
    }

    if (repoCount < 15) {
      return `Bhai ${githubData.username}, coding acchi chal rahi hai! Lekin consistency aur projects badha de, GitHub ko museum mat banne de 😄🔥`;
    }

    return `Wah ${githubData.username}! GitHub dekh ke lag raha hai tu serious developer hai 🔥 Bas commits ki consistency maintain rakh, warna recruiter bolega project banaya ya ek din ka motivation tha 😂`;
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="dashboard-page">

      {/* ================= NAVBAR ================= */}

      <nav className="dashboard-navbar">

        <div className="logo-section">
          <h2>GitBridge</h2>
          <span>AI Career Intelligence</span>
        </div>

        <div className="nav-user">

          <span>
            👤 {user.name || "User"}
          </span>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </nav>


      {/* ================= MAIN ================= */}

      <main className="dashboard-main">


        {/* ================= WELCOME ================= */}

        <section className="welcome-section">

          <div>

            <h1>
              Welcome back, {user.name || "Developer"} 👋
            </h1>

            <p>
              Analyze your GitHub profile, improve your skills,
              and build a stronger developer career.
            </p>

          </div>

          <div className="overall-score">

            <span>Overall Score</span>

            <h2>
              {overallScore}/100
            </h2>

          </div>

        </section>


        {/* ================= MESSAGE ================= */}

        {message && (
          <div className="dashboard-message">
            {message}
          </div>
        )}


        {/* ================= GITHUB CONNECT ================= */}

        <section className="section-card">

          <div className="section-title">

            <div>
              <h2>🐙 GitHub Profile</h2>

              <p>
                Connect your GitHub account to analyze
                your developer profile.
              </p>
            </div>

          </div>


          {!githubConnected ? (

            <div className="github-connect-box">

              <input
                type="text"
                placeholder="Enter GitHub username"
                value={githubUsername}
                onChange={(e) =>
                  setGithubUsername(e.target.value)
                }
              />

              <button
                onClick={handleGithubConnect}
                disabled={loading}
              >
                {loading
                  ? "Connecting..."
                  : "Connect GitHub"
                }
              </button>

            </div>

          ) : (

            <div className="github-profile">

              <img
                src={githubData.avatar}
                alt="GitHub Avatar"
              />

              <div>

                <h3>
                  {githubData.name}
                </h3>

                <p>
                  @{githubData.username}
                </p>

              </div>


              <div className="github-stats">

                <div>
                  <strong>
                    {githubData.repositories}
                  </strong>

                  <span>Repositories</span>
                </div>

                <div>
                  <strong>
                    {githubData.followers}
                  </strong>

                  <span>Followers</span>
                </div>

                <div>
                  <strong>
                    {githubData.following}
                  </strong>

                  <span>Following</span>
                </div>

              </div>

            </div>

          )}

        </section>


        {/* ================= SCORE CARDS ================= */}

        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon">
              🤖
            </div>

            <div>
              <p>AI Profile Score</p>

              <h2>
                {aiScore}/100
              </h2>
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon">
              🧠
            </div>

            <div>
              <p>ML Career Score</p>

              <h2>
                {mlScore}/100
              </h2>
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon">
              💻
            </div>

            <div>
              <p>GitHub Repositories</p>

              <h2>
                {githubData.repositories}
              </h2>
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon">
              🔥
            </div>

            <div>
              <p>Developer Level</p>

              <h2>
                {githubConnected
                  ? "Growing"
                  : "Unknown"
                }
              </h2>
            </div>

          </div>

        </section>


        {/* ================= TECHNOLOGIES ================= */}

        <section className="section-card">

          <div className="section-title">

            <div>
              <h2>💻 Languages & Technologies</h2>

              <p>
                Technologies detected from your profile.
              </p>
            </div>

          </div>


          <div className="technology-list">

            {visibleTechnologies.map(
              (technology, index) => (

                <span
                  className="technology-tag"
                  key={index}
                >
                  {technology}
                </span>

              )
            )}

          </div>


          <button
            className="view-more-btn"
            onClick={() => setShowMore(!showMore)}
          >
            {showMore
              ? "View Less"
              : "View More"
            }
          </button>

        </section>


        {/* ================= AI ROAST ================= */}

        <section className="section-card roast-card">

          <div className="section-title">

            <div>

              <h2>🔥 AI Generated Roast</h2>

              <p>
                A friendly personalized roast based on your
                GitHub profile.
              </p>

            </div>

          </div>


          <div className="roast-content">

            <div className="roast-icon">
              🔥
            </div>

            <p>
              {generateRoast()}
            </p>

          </div>

        </section>


        {/* ================= RESUME ================= */}

        <section className="section-card">

          <div className="section-title">

            <div>

              <h2>📄 Resume Analysis</h2>

              <p>
                Upload your resume and get AI-based
                career insights.
              </p>

            </div>

          </div>


          <div className="resume-upload">

            <label
              htmlFor="resume-upload"
              className="upload-btn"
            >
              📁 Upload Resume
            </label>

            <input
              id="resume-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeUpload}
            />


            {resumeName && (

              <p className="resume-name">

                Selected:
                {" "}
                <strong>
                  {resumeName}
                </strong>

              </p>

            )}

          </div>


          <div className="resume-analysis-grid">

            <div className="analysis-box">

              <span>ATS Score</span>

              <h2>
                {resumeName ? "75/100" : "--"}
              </h2>

            </div>


            <div className="analysis-box">

              <span>Skills</span>

              <h2>
                {resumeName ? "Analyzed" : "--"}
              </h2>

            </div>


            <div className="analysis-box">

              <span>Improvement</span>

              <h2>
                {resumeName ? "Available" : "--"}
              </h2>

            </div>

          </div>

        </section>


      </main>

    </div>
  );
}

export default DashboardPage;