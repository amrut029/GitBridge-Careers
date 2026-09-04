import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardPage.css";

import {
  clearNotifications,
  connectGithub,
  disconnectGithub,
  generateRoast,
  getDashboard,
  getGithubOAuthUrl,
  refreshGithub,
  uploadResume,
} from "../../Services/dashboardApi";

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value || 0));

const formatDate = (value) =>
  value ? new Date(value).toLocaleString() : "—";

export default function DashboardPage() {
  const navigate = useNavigate();
  const fileInput = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [githubBusy, setGithubBusy] = useState(false);
  const [resumeBusy, setResumeBusy] = useState(false);
  const [roastBusy, setRoastBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("info");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // GitHub input state
  const [githubInput, setGithubInput] = useState("");
  const [githubTokenInput, setGithubTokenInput] = useState("");
  const [showTokenField, setShowTokenField] = useState(false);
  const [isChangingGithub, setIsChangingGithub] = useState(false);

  // Parse token from URL if redirected from Google OAuth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");

    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    loadDashboard();
  }, [navigate]);

  const showNotification = (msg, type = "info") => {
    setNotice(msg);
    setNoticeType(type);
    setTimeout(() => {
      setNotice("");
    }, 6000);
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await getDashboard();
      setData(response);
    } catch (error) {
      if (error.message && (error.message.includes("token") || error.message.includes("log in"))) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        showNotification(error.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const github = data?.github;
  const resume = data?.resume;
  const roast = data?.roast;
  const stats = github?.stats || {};
  const profile = github?.profile || {};
  const notifications = data?.notifications || [];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const displayName =
    data?.name || data?.email?.split("@")[0] || "Developer";

  const initials = displayName.charAt(0).toUpperCase();

  const repositories = useMemo(
    () => github?.repositories || [],
    [github]
  );

  // Connect GitHub by username OR Token (Public + Private)
  const handleConnectGithub = async (e) => {
    e?.preventDefault();
    const username = githubInput.trim();
    const token = githubTokenInput.trim();

    if (!username && !token) {
      showNotification("Please enter a GitHub username or GitHub Access Token.", "error");
      return;
    }

    try {
      setGithubBusy(true);
      showNotification(
        token
          ? "Connecting GitHub with private repository access..."
          : `Connecting to GitHub user @${username}...`,
        "info"
      );
      const res = await connectGithub(username, token);

      setData((prev) => ({
        ...prev,
        github: res.github,
        notifications: [
          {
            id: `gh_${Date.now()}`,
            title: "GitHub Connected",
            message: `GitHub profile @${res.github.username} connected successfully.`,
            time: new Date().toISOString(),
            read: false,
          },
          ...(prev?.notifications || []),
        ],
      }));

      setGithubInput("");
      setGithubTokenInput("");
      setShowTokenField(false);
      setIsChangingGithub(false);
      showNotification(
        res.github.has_private_access
          ? `GitHub account @${res.github.username} connected with Private + Public repos! 🔒✅`
          : `GitHub account @${res.github.username} connected successfully! ✅`,
        "success"
      );
    } catch (error) {
      showNotification(error.message, "error");
    } finally {
      setGithubBusy(false);
    }
  };

  // Connect via GitHub OAuth
  const handleOAuthConnect = async () => {
    try {
      setGithubBusy(true);
      const res = await getGithubOAuthUrl();
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (error) {
      showNotification(error.message, "error");
      setGithubBusy(false);
    }
  };

  const handleRefreshGithub = async () => {
    try {
      setGithubBusy(true);
      showNotification("Fetching latest GitHub data from GitHub API...", "info");
      const freshGithub = await refreshGithub();

      setData((previous) => ({
        ...previous,
        github: freshGithub,
      }));

      showNotification("GitHub profile and repositories updated in real time! ✅", "success");
    } catch (error) {
      showNotification(error.message, "error");
    } finally {
      setGithubBusy(false);
    }
  };

  const handleDisconnectGithub = async () => {
    const ok = window.confirm("Are you sure you want to disconnect your GitHub profile?");
    if (!ok) return;

    try {
      setGithubBusy(true);
      await disconnectGithub();

      setData((previous) => ({
        ...previous,
        github: null,
        roast: null,
      }));

      showNotification("GitHub profile disconnected.", "info");
    } catch (error) {
      showNotification(error.message, "error");
    } finally {
      setGithubBusy(false);
    }
  };

  const handleResumeClick = () => fileInput.current?.click();

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotification("File exceeds 5MB size limit.", "error");
      return;
    }

    try {
      setResumeBusy(true);
      showNotification("Uploading and analyzing resume...", "info");
      const response = await uploadResume(file);

      setData((previous) => ({
        ...previous,
        resume: response.resume,
        roast: null,
        notifications: [
          {
            id: `res_${Date.now()}`,
            title: "Resume Uploaded",
            message: `Resume '${file.name}' analyzed successfully.`,
            time: new Date().toISOString(),
            read: false,
          },
          ...(previous?.notifications || []),
        ],
      }));

      showNotification(
        resume
          ? "Resume replaced and re-analyzed successfully! ✅"
          : "Resume uploaded and analyzed successfully! ✅",
        "success"
      );
    } catch (error) {
      showNotification(error.message, "error");
    } finally {
      setResumeBusy(false);
      event.target.value = "";
    }
  };

  const handleRoast = async () => {
    if (!github) {
      showNotification("Connect your GitHub account first.", "error");
      return;
    }

    if (!resume) {
      showNotification("Upload your resume first.", "error");
      return;
    }

    try {
      setRoastBusy(true);
      showNotification("Cooking your personalized AI Roast... 🔥", "info");
      const response = await generateRoast();

      setData((previous) => ({
        ...previous,
        roast: response,
        notifications: [
          {
            id: `rst_${Date.now()}`,
            title: "AI Roast Ready",
            message: "Your personalized developer roast is ready! 🔥",
            time: new Date().toISOString(),
            read: false,
          },
          ...(previous?.notifications || []),
        ],
      }));

      showNotification("Your roast is ready! 🔥", "success");
      document.getElementById("roast-section")?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      showNotification(error.message, "error");
    } finally {
      setRoastBusy(false);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await clearNotifications();
      setData((prev) => ({ ...prev, notifications: [] }));
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your GitBridge Career Intelligence...</p>
      </div>
    );
  }

  const bothConnected = Boolean(github && resume);
  const repoCount = stats.repositories || 0;
  const privateCount = stats.private_repositories || 0;
  const devLevel = repoCount > 20 ? "Senior Developer" : repoCount > 7 ? "Mid-Level Developer" : "Emerging Developer";
  const overallScore = Math.round(((resume?.ats_score || 70) * 0.5) + (Math.min(repoCount * 4, 40) + Math.min((stats.stars || 0) * 2, 10)) * 0.5);

  return (
    <div className="gb-dashboard">
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="gb-sidebar">
        <div className="gb-logo">
          <span className="bolt">⚡</span>
          <span>GitBridge</span>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <button
          className="side-item active"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          ⌂ <span>Overview</span>
        </button>
        <button
          className="side-item"
          onClick={() => document.getElementById("main-cards")?.scrollIntoView({ behavior: "smooth" })}
        >
          ▦ <span>Dashboard</span>
        </button>
        <button
          className="side-item"
          onClick={() => document.getElementById("github-section")?.scrollIntoView({ behavior: "smooth" })}
        >
          ◉ <span>GitHub Analysis</span>
        </button>
        <button
          className="side-item"
          onClick={() => document.getElementById("resume-section")?.scrollIntoView({ behavior: "smooth" })}
        >
          ▤ <span>Resume Review</span>
        </button>
        <button
          className="side-item"
          onClick={() => document.getElementById("repos-section")?.scrollIntoView({ behavior: "smooth" })}
        >
          ◎ <span>Opportunities</span>
        </button>

        <div className="nav-label growth">GROWTH</div>
        <button
          className="side-item"
          onClick={() => document.getElementById("career-insights-section")?.scrollIntoView({ behavior: "smooth" })}
        >
          ◇ <span>Skill Gap</span>
        </button>
        <button
          className="side-item"
          onClick={() => document.getElementById("career-insights-section")?.scrollIntoView({ behavior: "smooth" })}
        >
          ⌁ <span>Roadmap</span>
        </button>
        <button
          className="side-item"
          onClick={() => document.getElementById("career-insights-section")?.scrollIntoView({ behavior: "smooth" })}
        >
          ↗ <span>Progress</span>
        </button>
        <button
          className="side-item"
          onClick={() => document.getElementById("repos-section")?.scrollIntoView({ behavior: "smooth" })}
        >
          ♡ <span>Bookmarks</span>
        </button>
        <button
          className="side-item"
          onClick={() => setProfileOpen(true)}
        >
          ⚙ <span>Settings</span>
        </button>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="gb-main">
        {/* ================= TOP NAVBAR ================= */}
        <header className="gb-topbar">
          <div className="topbar-title">
            <span>Career Dashboard</span>
            <small className="sub-title">Career Intelligence & Developer Analytics</small>
          </div>

          <div className="top-actions">
            {/* NOTIFICATION BELL */}
            <div className="top-menu-wrap">
              <button
                className="round-button"
                title="Notifications"
                onClick={() => setNotificationOpen(!notificationOpen)}
              >
                🔔
                {unreadCount > 0 && <span className="badge-dot">{unreadCount}</span>}
              </button>

              {notificationOpen && (
                <div className="dropdown notifications-dropdown">
                  <div className="dropdown-header">
                    <strong>Notifications</strong>
                    {notifications.length > 0 && (
                      <button className="clear-btn" onClick={handleClearNotifications}>
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <p className="empty-notif">No new notifications</p>
                    ) : (
                      notifications.map((notif, idx) => (
                        <div className="notif-item" key={notif.id || idx}>
                          <div className="notif-bullet">●</div>
                          <div>
                            <strong>{notif.title}</strong>
                            <p>{notif.message}</p>
                            <small>{formatDate(notif.time)}</small>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* PROFILE DROPDOWN */}
            <div className="top-menu-wrap">
              <button
                className="profile-trigger"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <span className="avatar">{initials}</span>
                <strong className="profile-name">{displayName}</strong>
                <span className="caret">⌄</span>
              </button>

              {profileOpen && (
                <div className="dropdown profile-dropdown">
                  <div className="profile-head">
                    <span className="avatar large">{initials}</span>
                    <div className="profile-text">
                      <strong>{displayName}</strong>
                      <small>{data?.email}</small>
                    </div>
                  </div>
                  <button onClick={() => setProfileOpen(false)}>♙ Profile</button>
                  <button onClick={() => setProfileOpen(false)}>⚙ Settings</button>
                  <button onClick={() => setProfileOpen(false)}>ⓘ Help & Support</button>
                  <button className="logout-button" onClick={logout}>
                    ⇥ Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ================= DASHBOARD BODY ================= */}
        <section className="gb-content" id="overview">
          {notice && (
            <div className={`notice ${noticeType}`} onClick={() => setNotice("")}>
              <span>{notice}</span>
              <button className="close-notice">×</button>
            </div>
          )}

          {/* WELCOME BANNER */}
          <section className="hero-card">
            <div className="hero-info">
              <span className="eyebrow">WELCOME BACK</span>
              <h1>
                Welcome back,<br />
                <em>{displayName}!</em> 👋
              </h1>
              <p>
                Connect your GitHub (public & private projects) and resume to unlock career insights and get your personalized roast.
              </p>
            </div>
            <div className="robot">🤖</div>
          </section>

          {/* QUICK ACTIONS BAR */}
          <div className="quick-actions-bar">
            <span className="quick-label">⚡ Quick Actions:</span>
            <button
              className="quick-btn"
              disabled={!github || githubBusy}
              onClick={handleRefreshGithub}
            >
              ↻ Refresh GitHub Data
            </button>
            <button
              className="quick-btn"
              disabled={!resume || resumeBusy}
              onClick={handleResumeClick}
            >
              ▤ Re-analyze Resume
            </button>
            <button
              className={`quick-btn ${bothConnected ? "roast-pulse" : ""}`}
              disabled={!bothConnected || roastBusy}
              onClick={handleRoast}
            >
              🔥 Generate Roast
            </button>
          </div>

          {/* MAIN GRID: GITHUB + RESUME */}
          <div className="main-grid" id="main-cards">
            {/* 🐙 GITHUB CONNECTION CARD */}
            <section className="panel" id="github-section">
              <div className="panel-title-row">
                <div className="panel-header-left">
                  <div className="panel-icon purple">◉</div>
                  <div>
                    <h2>GitHub Connection</h2>
                    <span className="panel-subtitle">Public & Private Repositories</span>
                  </div>
                </div>

                {github ? (
                  <div className="status-group">
                    <span className="status connected">Connected</span>
                    {github.has_private_access && (
                      <span className="status private-access">Private Repos 🔒</span>
                    )}
                  </div>
                ) : (
                  <span className="status not-connected">Not Connected</span>
                )}
              </div>

              {!github || isChangingGithub ? (
                <div className="github-connect-form">
                  <p className="panel-description">
                    {isChangingGithub
                      ? "Enter your new GitHub username or Personal Access Token to replace your connected profile:"
                      : "Enter your GitHub username to connect your repositories. Want your private repositories to appear as well? Add your GitHub Personal Access Token below!"}
                  </p>
                  <form onSubmit={handleConnectGithub} className="connect-input-group">
                    <label className="input-label">GitHub Username</label>
                    <div className="input-with-button">
                      <input
                        type="text"
                        placeholder="e.g. amrutmac"
                        value={githubInput}
                        onChange={(e) => setGithubInput(e.target.value)}
                        disabled={githubBusy}
                        className="gh-input"
                      />
                      <button
                        type="submit"
                        className="primary-btn connect-btn"
                        disabled={githubBusy}
                      >
                        {githubBusy ? "Connecting..." : "Connect GitHub →"}
                      </button>
                    </div>

                    {/* Private repos toggle */}
                    <div className="private-repo-toggle-box">
                      <button
                        type="button"
                        className="toggle-private-btn"
                        onClick={() => setShowTokenField(!showTokenField)}
                      >
                        {showTokenField ? "▼ Hide Private Repos Option" : "🔒 Include Private Repositories (Add Token)"}
                      </button>

                      {showTokenField && (
                        <div className="token-field-box">
                          <label className="input-label">
                            GitHub Personal Access Token (with 'repo' scope)
                          </label>
                          <input
                            type="password"
                            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                            value={githubTokenInput}
                            onChange={(e) => setGithubTokenInput(e.target.value)}
                            className="gh-input token-input"
                          />
                          <small className="token-hint">
                            ℹ️ To display your private projects, generate a classic token on{" "}
                            <a
                              href="https://github.com/settings/tokens/new?scopes=repo,read:user"
                              target="_blank"
                              rel="noreferrer"
                            >
                              GitHub Settings ↗
                            </a>{" "}
                            with <code>repo</code> read permission.
                          </small>
                        </div>
                      )}
                    </div>
                  </form>

                  {isChangingGithub && (
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => setIsChangingGithub(false)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ) : (
                <div className="github-connected-view">
                  <div className="github-user">
                    <img
                      src={profile.avatar_url || "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"}
                      alt={github.username}
                      className="github-avatar"
                    />
                    <div className="github-user-info">
                      <strong>{profile.name || github.username}</strong>
                      <span className="gh-handle">@{github.username}</span>
                      {profile.bio && <p className="gh-bio">{profile.bio}</p>}
                    </div>
                    <a
                      href={profile.html_url || `https://github.com/${github.username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="view-profile-btn"
                    >
                      View Profile ↗
                    </a>
                  </div>

                  <div className="github-actions">
                    <button
                      className="secondary-btn"
                      disabled={githubBusy}
                      onClick={handleRefreshGithub}
                      title="Fetch latest updates from GitHub"
                    >
                      {githubBusy ? "Refreshing..." : "↻ Refresh Live Data"}
                    </button>

                    <button
                      className="secondary-btn purple-outline"
                      onClick={() => {
                        setGithubInput(github.username || "");
                        setIsChangingGithub(true);
                      }}
                      title="Connect a different GitHub account or add token"
                    >
                      ⇄ Change GitHub
                    </button>

                    <button
                      className="danger-text"
                      onClick={handleDisconnectGithub}
                      disabled={githubBusy}
                    >
                      Disconnect
                    </button>
                  </div>

                  <div className="stat-grid">
                    <Stat value={formatNumber(stats.repositories)} label="Total Repos" />
                    <Stat
                      value={formatNumber(privateCount)}
                      label={privateCount > 0 ? "Private 🔒" : "Public Only"}
                    />
                    <Stat value={formatNumber(stats.stars)} label="Stars" />
                    <Stat value={formatNumber(stats.followers)} label="Followers" />
                  </div>

                  <small className="sync-text">
                    Last synced: {formatDate(github.last_synced)}
                  </small>
                </div>
              )}
            </section>

            {/* 📄 RESUME SECTION CARD */}
            <section className="panel" id="resume-section">
              <div className="panel-title-row">
                <div className="panel-header-left">
                  <div className="panel-icon green">▤</div>
                  <div>
                    <h2>Resume Section</h2>
                    <span className="panel-subtitle">Skills & ATS Extraction</span>
                  </div>
                </div>
                {resume ? (
                  <span className="status uploaded">Uploaded</span>
                ) : (
                  <span className="status not-connected">Not Uploaded</span>
                )}
              </div>

              {!resume ? (
                <>
                  <p className="panel-description">
                    Upload your PDF, DOC, or DOCX resume for ATS skill extraction and career evaluation.
                  </p>
                  <button
                    className="upload-zone"
                    disabled={resumeBusy}
                    onClick={handleResumeClick}
                  >
                    <span className="upload-arrow">↑</span>
                    <strong>{resumeBusy ? "Uploading & Analyzing..." : "Choose your resume"}</strong>
                    <small>PDF, DOC, DOCX • Max 5MB</small>
                    <span className="upload-cta">Upload Resume →</span>
                  </button>
                </>
              ) : (
                <div className="resume-uploaded-view">
                  <div className="resume-file">
                    <span className="pdf-icon">DOC</span>
                    <div className="resume-details">
                      <strong>{resume.original_name}</strong>
                      <small>Uploaded successfully • Updated: {formatDate(resume.updated_at)}</small>
                    </div>
                  </div>

                  <button
                    className="primary-btn full"
                    disabled={resumeBusy}
                    onClick={handleResumeClick}
                  >
                    {resumeBusy ? "Replacing..." : "↻ Replace / Update Resume"}
                  </button>
                </div>
              )}

              <input
                ref={fileInput}
                type="file"
                hidden
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
              />

              <div className="check-list">
                <span>✓ ATS Score Analysis</span>
                <span>✓ Technical Skills Extraction</span>
                <span>✓ Experience & Projects Verification</span>
                <span>✓ AI Roast Readiness</span>
              </div>
            </section>
          </div>

          {/* 🔥 AI ROAST SECTION (GATED LOGIC) */}
          <section className="roast-card" id="roast-section">
            <div className="roast-head">
              <div>
                <span className="eyebrow">SPECIAL FEATURE</span>
                <h2>🔥 AI Roast (Just For Fun)</h2>
                <p>
                  {bothConnected
                    ? "Your GitHub activity and resume data are ready for a personalized developer roast."
                    : "Complete GitHub connection and resume upload to unlock your roast."}
                </p>
              </div>

              <button
                className={`primary-btn ${bothConnected ? "roast-active-btn" : ""}`}
                disabled={!bothConnected || roastBusy}
                onClick={handleRoast}
              >
                {roastBusy
                  ? "Roasting..."
                  : roast
                  ? "🔥 Roast Me Again 😈"
                  : "🔥 Roast Me"}
              </button>
            </div>

            {!bothConnected ? (
              <div className="roast-locked">
                <div className="lock-icon">🔒</div>
                <div>
                  <strong>AI Roast is Locked</strong>
                  <p>
                    Connect your GitHub account {!github && "(Pending)"} and upload your resume {!resume && "(Pending)"} to unlock your personalized AI Roast.
                  </p>
                </div>
              </div>
            ) : roast ? (
              <div className="roast-result">
                <div className="fire-circle">🔥</div>
                <div className="roast-content">
                  <p className="roast-text">{roast.text}</p>
                  <small className="roast-timestamp">
                    Generated on {formatDate(roast.created_at)}
                  </small>
                </div>
              </div>
            ) : (
              <div className="roast-waiting">
                Ready! Click <strong>"Roast Me 🔥"</strong> to generate your custom developer roast.
              </div>
            )}
          </section>

          {/* 📊 GITHUB ANALYSIS & CAREER INSIGHTS */}
          {github && (
            <div className="analysis-grid" id="github-analysis-section">
              <section className="panel">
                <div className="panel-title-row">
                  <div className="panel-header-left">
                    <div className="panel-icon purple">📊</div>
                    <div>
                      <h2>GitHub Analysis</h2>
                      <span className="panel-subtitle">Languages & Activity Insights</span>
                    </div>
                  </div>
                </div>

                <div className="lang-section">
                  <span className="insight-label">Detected Languages:</span>
                  <div className="tag-cloud">
                    {Object.keys(stats.languages || {}).length > 0 ? (
                      Object.entries(stats.languages).map(([lang, count]) => (
                        <span className="lang-tag" key={lang}>
                          {lang} <small>({count} repos)</small>
                        </span>
                      ))
                    ) : (
                      <span className="lang-tag">JavaScript / Python</span>
                    )}
                  </div>
                </div>

                <div className="analysis-notes">
                  <div className="note-card">
                    <strong>Developer Strengths:</strong>
                    <p>
                      {repoCount > 5
                        ? `Active GitHub presence with ${repoCount} projects${privateCount > 0 ? ` (including ${privateCount} private projects)` : ""} and version control history.`
                        : "Growing repository base. Building more public projects will significantly enhance recruiter visibility."}
                    </p>
                  </div>
                  <div className="note-card">
                    <strong>Areas for Improvement:</strong>
                    <p>
                      {stats.stars > 10
                        ? "Focus on writing comprehensive README documentation and adding live demo links to top projects."
                        : "Add clear documentation, screenshots, and contribute to open-source repositories to build stars and credibility."}
                    </p>
                  </div>
                </div>
              </section>

              <section className="panel" id="resume-review-section">
                <div className="panel-title-row">
                  <div className="panel-header-left">
                    <div className="panel-icon green">📄</div>
                    <div>
                      <h2>Resume Review</h2>
                      <span className="panel-subtitle">ATS Score & Skill Extraction</span>
                    </div>
                  </div>
                </div>

                {resume ? (
                  <div className="resume-insights">
                    <div className="ats-meter-box">
                      <div className="ats-score-display">
                        <span className="ats-num">{resume.ats_score || 75}</span>
                        <span className="ats-denom">/ 100</span>
                      </div>
                      <div className="ats-info">
                        <strong>ATS Compatibility Score</strong>
                        <p>Based on keyword matching, standard section headers, and formatting.</p>
                      </div>
                    </div>

                    <div className="skills-extracted">
                      <span className="insight-label">Extracted Skills:</span>
                      <div className="tag-cloud">
                        {(resume.skills || []).map((skill, i) => (
                          <span className="skill-tag" key={i}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="feedback-list">
                      <span className="insight-label">Resume Recommendations:</span>
                      <ul>
                        {(resume.feedback || ["Resume structure is clear."]).map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="panel-description">
                    Upload your resume above to see ATS score, extracted technical skills, and tailored recommendations.
                  </p>
                )}
              </section>
            </div>
          )}

          {/* 🎯 CAREER INSIGHTS PANEL */}
          <section className="panel career-panel" id="career-insights-section">
            <div className="panel-title-row">
              <div className="panel-header-left">
                <div className="panel-icon purple">🎯</div>
                <div>
                  <h2>Career Insights</h2>
                  <span className="panel-subtitle">Developer Profile Assessment</span>
                </div>
              </div>
            </div>

            <div className="career-metric-cards">
              <div className="career-card">
                <span className="career-label">Overall Score</span>
                <strong className="career-value purple-text">{overallScore}%</strong>
                <small>Calculated from GitHub + Resume metrics</small>
              </div>

              <div className="career-card">
                <span className="career-label">Developer Level</span>
                <strong className="career-value">{devLevel}</strong>
                <small>Based on code velocity ({repoCount} repos)</small>
              </div>

              <div className="career-card">
                <span className="career-label">Top Strength</span>
                <strong className="career-value green-text">
                  {resume?.skills?.[0] || (github ? "Full-Stack Development" : "Setup in Progress")}
                </strong>
                <small>Primary skill signal</small>
              </div>

              <div className="career-card">
                <span className="career-label">Recommended Next Step</span>
                <strong className="career-value yellow-text">
                  {!github
                    ? "Connect GitHub"
                    : !resume
                    ? "Upload Resume"
                    : repoCount < 5
                    ? "Build More Projects"
                    : "Contribute to Open Source"}
                </strong>
                <small>High impact career action</small>
              </div>
            </div>
          </section>

          {/* 📦 REPOSITORIES SECTION */}
          {github && (
            <section className="repositories-panel" id="repos-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">LIVE DATA</span>
                  <h2>
                    Repositories ({repositories.length})
                    {privateCount > 0 && <small className="private-summary"> • {privateCount} Private 🔒</small>}
                  </h2>
                </div>
                <button
                  className="secondary-btn"
                  disabled={githubBusy}
                  onClick={handleRefreshGithub}
                >
                  ↻ Refresh Repos
                </button>
              </div>

              <div className="repo-grid">
                {repositories.length === 0 ? (
                  <p className="empty-state">No repositories found for @{github.username}.</p>
                ) : (
                  repositories.map((repo) => (
                    <article className="repo-card" key={repo.id || repo.name}>
                      <div className="repo-top">
                        <h3 title={repo.name}>{repo.name}</h3>
                        <span className={`repo-badge ${repo.private ? "badge-private" : "badge-public"}`}>
                          {repo.private ? "Private 🔒" : "Public 🌐"}
                        </span>
                      </div>

                      <p className="repo-desc">
                        {repo.description || "No description provided."}
                      </p>

                      <div className="repo-meta">
                        <span className="repo-lang">● {repo.language || "Code"}</span>
                        <span>⭐ {repo.stargazers_count || 0}</span>
                        <span>🍴 {repo.forks_count || 0}</span>
                      </div>

                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="repo-link"
                      >
                        View Repository ↗
                      </a>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="stat-box">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
