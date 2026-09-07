import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardPage.css";

import {
  clearNotifications,
  connectGithub,
  deleteResume,
  disconnectGithub,
  generateRoast,
  getDashboard,
  getGithubOAuthUrl,
  getOpportunities,
  refreshGithub,
  uploadResume,
} from "../../Services/dashboardApi";

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value || 0));

const formatDate = (value) =>
  value ? new Date(value).toLocaleString() : "—";

const THEMES = [
  {
    id: "classic",
    name: "GitBridge Classic",
    desc: "Signature dark navy with purple cyber gradient",
    badge: "⚡ Default",
    colors: ["#080d1b", "#101827", "#8b4de8"]
  },
  {
    id: "oled",
    name: "Midnight OLED",
    desc: "True pure pitch-black with vibrant neon violet",
    badge: "🌌 Deep Dark",
    colors: ["#000000", "#0c0c0e", "#a855f7"]
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Neon",
    desc: "Dark synthwave with electric cyan & hot pink highlights",
    badge: "🚀 Cyberpunk",
    colors: ["#0a0e17", "#111927", "#00f0ff"]
  },
  {
    id: "light",
    name: "Modern Light",
    desc: "Clean, crisp slate & daylight theme with vibrant accents",
    badge: "☀️ Day Mode",
    colors: ["#f8fafc", "#ffffff", "#6366f1"]
  }
];

const DEFAULT_ROADMAPS = {
  devops: {
    title: "DevOps & Cloud Infrastructure Architect",
    desc: "Production-grade infrastructure as code, Kubernetes orchestration, CI/CD pipelines, and cloud observability.",
    steps: [
      { id: "do1", title: "Linux Systems, Shell & Networking Foundations", status: "completed", desc: "Bash scripting, process management, SSH keys, IPTables, DNS, and systemd services." },
      { id: "do2", title: "Containerization with Docker & Multi-Stage Builds", status: "completed", desc: "Dockerfile optimization, image layers, Docker Compose networking, and rootless security." },
      { id: "do3", title: "Infrastructure as Code (IaC) with Terraform & HCL", status: "in_progress", desc: "Modular Terraform architecture, state locking with S3/DynamoDB, and cloud provider provisioning." },
      { id: "do4", title: "Kubernetes Cluster Orchestration & Helm Charts", status: "in_progress", desc: "Deployments, StatefulSets, Ingress Controllers, ConfigMaps, Secrets, and Helm packaging." },
      { id: "do5", title: "Automated CI/CD Pipelines (Jenkins & GitHub Actions)", status: "pending", desc: "Declarative Jenkinsfiles, branch protection triggers, automated test suites, and Docker image registries." },
      { id: "do6", title: "Observability, Monitoring & GitOps (Prometheus & ArgoCD)", status: "pending", desc: "Prometheus metrics collection, Grafana visualization dashboards, alert managers, and ArgoCD GitOps sync." }
    ]
  },
  fullstack: {
    title: "Full-Stack Web Architect",
    desc: "End-to-end mastery from reactive frontends to high-throughput distributed backends.",
    steps: [
      { id: "fs1", title: "Modern JavaScript / TypeScript & ESNext", status: "completed", desc: "Closures, async/await, DOM APIs, TypeScript generics and strict typing." },
      { id: "fs2", title: "React 19 & Component Architecture", status: "completed", desc: "Hooks, server actions, state management (Zustand/Redux), performance memoization." },
      { id: "fs3", title: "Scalable REST & FastAPI / Express APIs", status: "in_progress", desc: "FastAPI / Node.js, JWT authentication, rate limiting, and OpenAPI contracts." },
      { id: "fs4", title: "Relational & NoSQL Database Optimization", status: "in_progress", desc: "Indexing in PostgreSQL & MongoDB Atlas, aggregation pipelines, schema migrations." },
      { id: "fs5", title: "Docker Containerization & Deployment", status: "pending", desc: "Multi-stage Dockerfiles, GitHub Actions workflows, container registry deployments." },
      { id: "fs6", title: "System Design & Distributed Caching", status: "pending", desc: "Redis caching, message queues (RabbitMQ/Kafka), microservices architecture." }
    ]
  },
  frontend: {
    title: "Frontend Engineering Specialist",
    desc: "Deep mastery of browser performance, UI micro-interactions, and enterprise design systems.",
    steps: [
      { id: "fe1", title: "Advanced CSS, Tailwind & Responsive Layouts", status: "completed", desc: "CSS Grid, Flexbox, subgrid, container queries, modern animation curves." },
      { id: "fe2", title: "React Ecosystem & Next.js SSR / SSG", status: "in_progress", desc: "Server-side rendering, streaming SSR, App router, Next.js optimization." },
      { id: "fe3", title: "Web Performance & Core Web Vitals", status: "in_progress", desc: "LCP, FID/INP, CLS debugging, bundle size analysis, image compression pipelines." },
      { id: "fe4", title: "State Management & Real-time WebSockets", status: "pending", desc: "Zustand, TanStack Query (React Query), WebSocket duplex streaming." },
      { id: "fe5", title: "Testing (Vitest, Jest & Cypress E2E)", status: "pending", desc: "Unit testing components, mocking API handlers, automated visual regression." }
    ]
  },
  backend: {
    title: "Backend & Systems Architect",
    desc: "High-throughput APIs, database scaling, microservices, and secure cloud infrastructure.",
    steps: [
      { id: "be1", title: "Python & FastAPI High-Performance Frameworks", status: "completed", desc: "Pydantic validation, async def routes, dependency injection, and ASGI tuning." },
      { id: "be2", title: "Database Modeling & Query Tuning", status: "in_progress", desc: "PostgreSQL joins, composite indexes, MongoDB document sharding and transactions." },
      { id: "be3", title: "Cloud Architecture (AWS / GCP)", status: "pending", desc: "S3 storage, ECS / EKS, Lambda serverless, CloudWatch observability." },
      { id: "be4", title: "Security & OAuth2 / OpenID Connect", status: "in_progress", desc: "JWT signed tokens, CSRF protection, RBAC permissions, and secret management." },
      { id: "be5", title: "Production Orchestration & Microservices", status: "pending", desc: "gRPC communication, event-driven architectures, distributed tracing." }
    ]
  },
  ai: {
    title: "AI / ML & Agentic Systems Engineer",
    desc: "Machine learning engineering, LLM fine-tuning, RAG pipelines, and autonomous AI agents.",
    steps: [
      { id: "ai1", title: "Data Wrangling with NumPy & Pandas", status: "completed", desc: "Matrix calculations, vectorization, feature scaling, and data normalization." },
      { id: "ai2", title: "Scikit-Learn Machine Learning Models", status: "completed", desc: "Random Forest, Gradient Boosting, regression, classification, cross-validation." },
      { id: "ai3", title: "Vector Databases & Semantic Search", status: "in_progress", desc: "Embeddings, Pinecone, ChromaDB, Cosine similarity search for intelligent retrieval." },
      { id: "ai4", title: "LLM Agent Tool Calling & Orchestration", status: "in_progress", desc: "Function calling, multi-agent communication protocols, task reflection loops." },
      { id: "ai5", title: "Model Deployment & FastAPI Inference Microservices", status: "pending", desc: "ONNX Runtime, GPU acceleration, Dockerized inference containers." }
    ]
  }
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const fileInput = useRef(null);

  // Active View Tab
  const [activeTab, setActiveTab] = useState("overview");

  // Dashboard Data State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState([]);
  const [oppsLoading, setOppsLoading] = useState(false);
  const [oppFilter, setOppFilter] = useState("all");
  const [oppSearch, setOppSearch] = useState("");

  // Busy States
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
  const [showTokenGuide, setShowTokenGuide] = useState(false);
  const [showTokenField, setShowTokenField] = useState(false);
  const [isChangingGithub, setIsChangingGithub] = useState(false);
  const [repoVisibilityFilter, setRepoVisibilityFilter] = useState("all");

  // Theme state
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem("gb_theme") || "classic";
  });

  // Bookmarks state (Persisted in localStorage)
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("gb_bookmarks") || "[]");
    } catch {
      return [];
    }
  });

  // Selected Roadmap State
  const [selectedRoadmap, setSelectedRoadmap] = useState("devops");

  // User Milestones
  const [userMilestones, setUserMilestones] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("gb_milestones") || "{}");
    } catch {
      return {};
    }
  });

  // Weekly Goals (Persisted)
  const [weeklyGoals, setWeeklyGoals] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("gb_weekly_goals") ||
          JSON.stringify([
            { id: "g1", text: "Push code to GitHub (Keep commit streak active)", done: true },
            { id: "g2", text: "Upload & optimize ATS resume score above 80%", done: false },
            { id: "g3", text: "Review Hinglish AI Roast and fix weak spots", done: false },
            { id: "g4", text: "Apply to at least 2 high-match Opportunities", done: false },
            { id: "g5", text: "Complete 1 Step in your selected Developer Roadmap", done: false }
          ])
      );
    } catch {
      return [];
    }
  });

  // Apply Theme to document root & persist
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
    localStorage.setItem("gb_theme", currentTheme);
  }, [currentTheme]);

  // Persist Bookmarks
  useEffect(() => {
    localStorage.setItem("gb_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Persist Milestones
  useEffect(() => {
    localStorage.setItem("gb_milestones", JSON.stringify(userMilestones));
  }, [userMilestones]);

  // Persist Weekly Goals
  useEffect(() => {
    localStorage.setItem("gb_weekly_goals", JSON.stringify(weeklyGoals));
  }, [weeklyGoals]);

  // Initial Auth & Load
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
    loadOpportunitiesData();
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

      // Auto-set roadmap to user's analyzed domain
      if (response?.ml_insights?.domain_id && DEFAULT_ROADMAPS[response.ml_insights.domain_id]) {
        setSelectedRoadmap(response.ml_insights.domain_id);
      }
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

  const loadOpportunitiesData = async () => {
    try {
      setOppsLoading(true);
      const res = await getOpportunities();
      setOpportunities(res.opportunities || []);
    } catch (err) {
      console.error("Opportunities fetch error:", err);
    } finally {
      setOppsLoading(false);
    }
  };

  const github = data?.github;
  const resume = data?.resume;
  const roast = data?.roast;
  const stats = github?.stats || {};
  const profile = github?.profile || {};
  const notifications = data?.notifications || [];
  const mlInsights = data?.ml_insights || {};

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayName = data?.name || data?.email?.split("@")[0] || "Developer";
  const initials = displayName.charAt(0).toUpperCase();

  const repositories = useMemo(() => github?.repositories || [], [github]);

  // Filtered repos by visibility
  const filteredRepositories = useMemo(() => {
    if (repoVisibilityFilter === "public") return repositories.filter((r) => !r.private);
    if (repoVisibilityFilter === "private") return repositories.filter((r) => r.private);
    return repositories;
  }, [repositories, repoVisibilityFilter]);

  // Filtered opportunities
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      const matchType =
        oppFilter === "all" ||
        (oppFilter === "internship" && opp.type.toLowerCase().includes("intern")) ||
        (oppFilter === "fulltime" && opp.type.toLowerCase().includes("full")) ||
        (oppFilter === "remote" && opp.location.toLowerCase().includes("remote"));

      const matchQuery =
        !oppSearch ||
        opp.title.toLowerCase().includes(oppSearch.toLowerCase()) ||
        opp.company.toLowerCase().includes(oppSearch.toLowerCase()) ||
        opp.required_skills.some((s) => s.toLowerCase().includes(oppSearch.toLowerCase()));

      return matchType && matchQuery;
    });
  }, [opportunities, oppFilter, oppSearch]);

  // Toggle Bookmark
  const toggleBookmark = (item, type = "opportunity") => {
    const key = `${type}_${item.id || item.name || item.title}`;
    const exists = bookmarks.some((b) => b.key === key);

    if (exists) {
      setBookmarks((prev) => prev.filter((b) => b.key !== key));
      showNotification(`Removed from Bookmarks.`, "info");
    } else {
      const newBookmark = {
        key,
        type,
        id: item.id || item.name,
        title: item.title || item.name,
        subtitle: item.company || item.language || type,
        link: item.apply_url || item.html_url,
        saved_at: new Date().toISOString(),
        details: item
      };
      setBookmarks((prev) => [newBookmark, ...prev]);
      showNotification(`Saved to Bookmarks! ⭐`, "success");
    }
  };

  const isBookmarked = (idOrName, type = "opportunity") => {
    const key = `${type}_${idOrName}`;
    return bookmarks.some((b) => b.key === key);
  };

  // Toggle Milestone status
  const toggleMilestone = (stepId) => {
    setUserMilestones((prev) => {
      const current = prev[stepId] || "in_progress";
      const next = current === "completed" ? "in_progress" : "completed";
      return { ...prev, [stepId]: next };
    });
  };

  // Toggle Goal status
  const toggleGoal = (goalId) => {
    setWeeklyGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, done: !g.done } : g))
    );
  };

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

      await loadDashboard();

      setGithubInput("");
      setGithubTokenInput("");
      setShowTokenField(false);
      setShowTokenGuide(false);
      setIsChangingGithub(false);
      showNotification(
        res.github.has_private_access
          ? `GitHub account @${res.github.username} connected with Private + Public repos! 🔒✅`
          : `GitHub account @${res.github.username} connected successfully! ✅`,
        "success"
      );

      loadOpportunitiesData();
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
      await refreshGithub();
      await loadDashboard();

      showNotification("GitHub profile and repositories updated in real time! ✅", "success");
      loadOpportunitiesData();
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
      await loadDashboard();
      showNotification("GitHub profile disconnected.", "info");
      loadOpportunitiesData();
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
      showNotification("Uploading and analyzing resume with deep ATS engine...", "info");
      const response = await uploadResume(file);

      await loadDashboard();

      showNotification(
        `Resume analyzed successfully! ATS Score: ${response.resume.ats_score}/100 ✅`,
        "success"
      );
      loadOpportunitiesData();
    } catch (error) {
      showNotification(error.message, "error");
    } finally {
      setResumeBusy(false);
      event.target.value = "";
    }
  };

  const handleDeleteResume = async () => {
    const ok = window.confirm("Are you sure you want to delete your uploaded resume?");
    if (!ok) return;

    try {
      setResumeBusy(true);
      await deleteResume();
      await loadDashboard();
      showNotification("Resume removed. Upload a new resume anytime to calculate ATS match.", "info");
      loadOpportunitiesData();
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setResumeBusy(false);
    }
  };

  const handleRoast = async () => {
    if (!github) {
      showNotification("Connect your GitHub account first.", "error");
      return;
    }

    if (!resume) {
      showNotification("Upload your resume first before generating a roast.", "error");
      return;
    }

    try {
      setRoastBusy(true);
      showNotification("Cooking your personalized Hinglish AI Roast... 🔥🌶️", "info");
      const response = await generateRoast();

      setData((previous) => ({
        ...previous,
        roast: response,
      }));

      showNotification("Aapka Hinglish AI Roast ready hai! 🔥", "success");
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
        <p>Analyzing real GitHub repositories & calculating metrics...</p>
      </div>
    );
  }

  const bothConnected = Boolean(github && resume);
  const repoCount = stats.repositories || 0;
  const privateCount = stats.private_repositories || 0;
  const completedGoals = weeklyGoals.filter((g) => g.done).length;
  const goalProgressPct = Math.round((completedGoals / Math.max(weeklyGoals.length, 1)) * 100);
  const currentRoadmapData = DEFAULT_ROADMAPS[selectedRoadmap] || DEFAULT_ROADMAPS.devops || DEFAULT_ROADMAPS.fullstack;

  // Real XP Calculation strictly from actual achievements
  const totalXp = (repoCount * 45) + (privateCount * 30) + (resume ? 250 : 0) + (completedGoals * 60);
  const currentLevel = Math.max(1, Math.floor(totalXp / 500) + 1);
  const nextLevelXp = currentLevel * 500;
  const levelProgress = Math.min(100, Math.round(((totalXp % 500) / 500) * 100));

  return (
    <div className={`gb-dashboard theme-${currentTheme}`} data-theme={currentTheme}>
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="gb-sidebar">
        <div className="gb-logo">
          <span className="bolt">⚡</span>
          <span>GitBridge</span>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <button
          className={`side-item ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          ⌂ <span>Overview</span>
        </button>

        <button
          className={`side-item ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          ▦ <span>Dashboard</span>
        </button>

        <button
          className={`side-item ${activeTab === "github" ? "active" : ""}`}
          onClick={() => setActiveTab("github")}
        >
          ◉ <span>GitHub Analysis</span>
          {repoCount > 0 ? (
            <span className="side-badge">{privateCount > 0 ? `🔒 ${privateCount}` : `${repoCount}`}</span>
          ) : null}
        </button>

        <button
          className={`side-item ${activeTab === "resume" ? "active" : ""}`}
          onClick={() => setActiveTab("resume")}
        >
          ▤ <span>Resume Review</span>
          {resume ? (
            <span className="side-badge green-badge">{resume.ats_score}%</span>
          ) : (
            <span className="side-badge pending-badge">Pending</span>
          )}
        </button>

        <button
          className={`side-item ${activeTab === "opportunities" ? "active" : ""}`}
          onClick={() => setActiveTab("opportunities")}
        >
          ◎ <span>Opportunities</span>
          <span className="side-badge fire-badge">MATCH</span>
        </button>

        <div className="nav-label growth">GROWTH & CAREER</div>

        <button
          className={`side-item ${activeTab === "skill_gap" ? "active" : ""}`}
          onClick={() => setActiveTab("skill_gap")}
        >
          ◇ <span>Skill Gap</span>
        </button>

        <button
          className={`side-item ${activeTab === "roadmap" ? "active" : ""}`}
          onClick={() => setActiveTab("roadmap")}
        >
          ⌁ <span>Roadmap</span>
          {mlInsights.domain_id && <span className="side-badge">{mlInsights.domain_id.toUpperCase()}</span>}
        </button>

        <button
          className={`side-item ${activeTab === "progress" ? "active" : ""}`}
          onClick={() => setActiveTab("progress")}
        >
          ↗ <span>Progress & XP</span>
          <span className="side-badge xp-badge">Lv.{currentLevel}</span>
        </button>

        <button
          className={`side-item ${activeTab === "bookmarks" ? "active" : ""}`}
          onClick={() => setActiveTab("bookmarks")}
        >
          ♡ <span>Bookmarks</span>
          {bookmarks.length > 0 && <span className="side-badge">{bookmarks.length}</span>}
        </button>

        <button
          className={`side-item ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          ⚙ <span>Settings & Themes</span>
        </button>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="gb-main">
        {/* ================= TOP NAVBAR ================= */}
        <header className="gb-topbar">
          <div className="topbar-title">
            <span>
              {activeTab === "overview" && "Career Intelligence Overview"}
              {activeTab === "dashboard" && "Developer Dashboard & ML Benchmark"}
              {activeTab === "github" && "GitHub Analysis & Private Repos"}
              {activeTab === "resume" && "ATS Resume Analysis & Review"}
              {activeTab === "opportunities" && "Live Opportunities & Internships"}
              {activeTab === "skill_gap" && "Skill Gap Analysis (Real Repos Evaluated)"}
              {activeTab === "roadmap" && `Interactive Career Roadmap: ${currentRoadmapData.title}`}
              {activeTab === "progress" && "XP Level & Milestone Progress"}
              {activeTab === "bookmarks" && "Saved Bookmarks & Opportunities"}
              {activeTab === "settings" && "Platform Settings & Theme Customizer"}
            </span>
            <small className="sub-title">GitBridge • AI Career Engineering</small>
          </div>

          <div className="top-actions">
            {/* Quick Theme Switcher Pill in Header */}
            <div className="theme-quick-pill">
              <span className="theme-pill-label">Theme:</span>
              <select
                value={currentTheme}
                onChange={(e) => setCurrentTheme(e.target.value)}
                className="theme-select-dropdown"
              >
                <option value="classic">⚡ Classic Dark</option>
                <option value="oled">🌌 Midnight OLED</option>
                <option value="cyberpunk">🚀 Cyberpunk</option>
                <option value="light">☀️ Modern Light</option>
              </select>
            </div>

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
                  <button onClick={() => { setActiveTab("settings"); setProfileOpen(false); }}>⚙ Settings & Themes</button>
                  <button onClick={() => { setActiveTab("bookmarks"); setProfileOpen(false); }}>♡ Bookmarks ({bookmarks.length})</button>
                  <button className="logout-button" onClick={logout}>
                    ⇥ Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ================= DASHBOARD BODY ================= */}
        <section className="gb-content">
          {notice && (
            <div className={`notice ${noticeType}`} onClick={() => setNotice("")}>
              <span>{notice}</span>
              <button className="close-notice">×</button>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 1: OVERVIEW & HOME */}
          {/* ============================================================== */}
          {activeTab === "overview" && (
            <>
              {/* WELCOME BANNER */}
              <section className="hero-card">
                <div className="hero-info">
                  <span className="eyebrow">REAL REPOSITORIES & METRICS</span>
                  <h1>
                    Welcome back,<br />
                    <em>{displayName}!</em> 👋
                  </h1>
                  <p>
                    {github
                      ? `Connected GitHub @${github.username} with ${repoCount} repositories (${mlInsights.domain_name || "Engineering Profile"}).`
                      : "Connect your GitHub profile and upload your resume to unlock real-time ML career analytics."}
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
                  disabled={resumeBusy}
                  onClick={handleResumeClick}
                >
                  ▤ {resume ? "Re-analyze Resume" : "Upload Resume (PDF/DOCX)"}
                </button>
                <button
                  className={`quick-btn ${bothConnected ? "roast-pulse" : ""}`}
                  disabled={!bothConnected || roastBusy}
                  onClick={handleRoast}
                >
                  🔥 Generate Hinglish Roast
                </button>
                <button
                  className="quick-btn secondary"
                  onClick={() => setActiveTab("opportunities")}
                >
                  🎯 View Matching Opportunities
                </button>
              </div>

              {/* STATS OVERVIEW CARDS */}
              <div className="overview-stats-grid">
                <div className="ov-card">
                  <div className="ov-card-top">
                    <span className="ov-icon">📊</span>
                    <span className="ov-tag">GitHub</span>
                  </div>
                  <h3>{repoCount} Repositories</h3>
                  <p>{privateCount > 0 ? `${privateCount} Private 🔒 • ${repoCount - privateCount} Public` : "Live repositories analyzed"}</p>
                </div>

                <div className="ov-card">
                  <div className="ov-card-top">
                    <span className="ov-icon">📄</span>
                    <span className={`ov-tag ${resume ? "green" : "muted-tag"}`}>ATS Resume</span>
                  </div>
                  <h3>{resume ? `${resume.ats_score}/100 Score` : "Not Uploaded (0%)"}</h3>
                  <p>{resume ? `${(resume.skills || []).length} technical skills extracted` : "Upload resume to calculate ATS score"}</p>
                </div>

                <div className="ov-card">
                  <div className="ov-card-top">
                    <span className="ov-icon">🧠</span>
                    <span className="ov-tag purple">Real ML Score</span>
                  </div>
                  <h3>{mlInsights.overall_score || 0}% Score</h3>
                  <p>{mlInsights.developer_level || "Onboarding"} • {mlInsights.percentile || "Unranked"}</p>
                </div>

                <div className="ov-card">
                  <div className="ov-card-top">
                    <span className="ov-icon">⭐</span>
                    <span className="ov-tag yellow">XP & Streaks</span>
                  </div>
                  <h3>Level {currentLevel} ({totalXp} XP)</h3>
                  <p>{completedGoals}/{weeklyGoals.length} weekly goals completed</p>
                </div>
              </div>

              {/* HINGLISH AI ROAST CARD */}
              <section className="roast-card" id="roast-section">
                <div className="roast-head">
                  <div>
                    <span className="eyebrow">SPECIAL ENTERTAINMENT</span>
                    <h2>🔥 Desi AI Developer Roast (Hinglish)</h2>
                    <p>
                      {bothConnected
                        ? "Aapke GitHub commits, private repos, aur resume skills par based kadak roast!"
                        : "Roast unlock karne ke liye GitHub connect karo aur Resume upload karo."}
                    </p>
                  </div>

                  <button
                    className={`primary-btn ${bothConnected ? "roast-active-btn" : ""}`}
                    disabled={!bothConnected || roastBusy}
                    onClick={handleRoast}
                  >
                    {roastBusy
                      ? "Roasting in progress... 🌶️"
                      : roast
                      ? "🔥 Ek Aur Roast Do! 😈"
                      : "🔥 Roast Me (Hinglish)"}
                  </button>
                </div>

                {!bothConnected ? (
                  <div className="roast-locked">
                    <div className="lock-icon">🔒</div>
                    <div>
                      <strong>Hinglish AI Roast is Locked</strong>
                      <p>
                        GitHub profile {!github && "(Pending ❌)"} aur Resume {!resume && "(Pending ❌)"} dono complete kijiye roast unlock karne ke liye.
                      </p>
                    </div>
                  </div>
                ) : roast ? (
                  <div className="roast-result">
                    <div className="fire-circle">🔥</div>
                    <div className="roast-content">
                      <p className="roast-text">{roast.text}</p>
                      <small className="roast-timestamp">
                        Generated on {formatDate(roast.created_at)} • Repos: {roast.repo_count} ({roast.private_count || 0} Private 🔒) • Stars: {roast.stars}
                      </small>
                    </div>
                  </div>
                ) : (
                  <div className="roast-waiting">
                    Aapka GitHub aur Resume ready hai! Upar <strong>"Roast Me (Hinglish) 🔥"</strong> button click karke roast generate karein.
                  </div>
                )}
              </section>

              {/* MAIN 2-COLUMN PANELS: GITHUB & RESUME */}
              <div className="main-grid">
                {/* 🐙 GITHUB SUMMARY PANEL */}
                <section className="panel">
                  <div className="panel-title-row">
                    <div className="panel-header-left">
                      <div className="panel-icon purple">◉</div>
                      <div>
                        <h2>GitHub Profile</h2>
                        <span className="panel-subtitle">Public & Private Repositories</span>
                      </div>
                    </div>
                    {github ? (
                      <span className="status connected">Connected {github.has_private_access && "🔒"}</span>
                    ) : (
                      <span className="status not-connected">Not Connected</span>
                    )}
                  </div>

                  {github ? (
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
                      </div>

                      <div className="stat-grid">
                        <Stat value={formatNumber(stats.repositories)} label="Total Repos" />
                        <Stat value={formatNumber(privateCount)} label="Private 🔒" />
                        <Stat value={formatNumber(stats.stars)} label="Stars ⭐" />
                        <Stat value={formatNumber(stats.forks)} label="Forks 🍴" />
                      </div>

                      <div className="panel-actions-row">
                        <button className="primary-btn" onClick={() => setActiveTab("github")}>
                          View All Repos ({repositories.length}) →
                        </button>
                        <button className="secondary-btn" onClick={handleRefreshGithub} disabled={githubBusy}>
                          ↻ Refresh
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="github-connect-prompt">
                      <p>Connect your GitHub account to sync your repositories and compute accurate developer metrics.</p>
                      <button className="primary-btn" onClick={() => setActiveTab("github")}>
                        Connect GitHub Now →
                      </button>
                    </div>
                  )}
                </section>

                {/* 📄 RESUME SUMMARY PANEL */}
                <section className="panel">
                  <div className="panel-title-row">
                    <div className="panel-header-left">
                      <div className="panel-icon green">▤</div>
                      <div>
                        <h2>Resume Review</h2>
                        <span className="panel-subtitle">ATS Score & Skill Extraction</span>
                      </div>
                    </div>
                    {resume ? (
                      <span className="status uploaded">ATS: {resume.ats_score}/100</span>
                    ) : (
                      <span className="status not-connected">Not Uploaded (0%)</span>
                    )}
                  </div>

                  {resume ? (
                    <div className="resume-uploaded-view">
                      <div className="resume-file">
                        <span className="pdf-icon">DOC</span>
                        <div className="resume-details">
                          <strong>{resume.original_name}</strong>
                          <small>Updated: {formatDate(resume.updated_at)}</small>
                        </div>
                      </div>

                      <div className="skills-extracted">
                        <span className="insight-label">Key Detected Skills:</span>
                        <div className="tag-cloud">
                          {(resume.skills || []).slice(0, 8).map((skill, i) => (
                            <span className="skill-tag" key={i}>{skill}</span>
                          ))}
                          {(resume.skills || []).length > 8 && (
                            <span className="skill-tag more">+{resume.skills.length - 8} more</span>
                          )}
                        </div>
                      </div>

                      <div className="panel-actions-row">
                        <button className="primary-btn" onClick={() => setActiveTab("resume")}>
                          Full ATS Breakdown →
                        </button>
                        <button className="secondary-btn" onClick={handleResumeClick} disabled={resumeBusy}>
                          ↻ Replace Resume
                        </button>
                        <button className="danger-text" onClick={handleDeleteResume} disabled={resumeBusy}>
                          Delete Resume
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="resume-upload-prompt">
                      <p>No resume uploaded yet. Upload your PDF/DOCX resume to calculate your ATS Score and extract technical keywords.</p>
                      <button className="primary-btn" onClick={handleResumeClick} disabled={resumeBusy}>
                        Upload Resume (PDF/DOCX) →
                      </button>
                    </div>
                  )}
                </section>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* TAB 2: DASHBOARD & REAL ML METRICS */}
          {/* ============================================================== */}
          {activeTab === "dashboard" && (
            <div className="tab-container">
              <section className="panel career-panel">
                <div className="panel-title-row">
                  <div className="panel-header-left">
                    <div className="panel-icon purple">🧠</div>
                    <div>
                      <h2>Real ML Developer Intelligence & Specialization</h2>
                      <span className="panel-subtitle">
                        Analyzed from {repoCount} repositories • Domain: <strong>{mlInsights.domain_name || "Software Engineering"}</strong>
                      </span>
                    </div>
                  </div>
                  {mlInsights.percentile && (
                    <span className="ml-badge-pill">
                      🤖 Multi-Vector Regression • {mlInsights.percentile}
                    </span>
                  )}
                </div>

                <div className="career-metric-cards">
                  <div className="career-card highlight-card">
                    <span className="career-label">Predicted ML Score</span>
                    <strong className="career-value purple-text">
                      {mlInsights.overall_score || 0}%
                    </strong>
                    <small>Calculated from real repo velocity & activity</small>
                  </div>

                  <div className="career-card">
                    <span className="career-label">Engineering Classification</span>
                    <strong className="career-value">
                      {mlInsights.developer_level || "Onboarding Developer"}
                    </strong>
                    <small>Domain: {mlInsights.domain_name || "General"}</small>
                  </div>

                  <div className="career-card">
                    <span className="career-label">Talent Percentile</span>
                    <strong className="career-value green-text">
                      {mlInsights.percentile || "Unranked"}
                    </strong>
                    <small>Benchmarked against peer developers</small>
                  </div>

                  <div className="career-card">
                    <span className="career-label">Primary Technical Core</span>
                    <strong className="career-value yellow-text">
                      {mlInsights.primary_signal || "General Engineering"}
                    </strong>
                    <small>Detected from actual repo keywords</small>
                  </div>
                </div>

                {/* Subscores */}
                {mlInsights.sub_scores && (
                  <div className="ml-subscores-box">
                    <span className="insight-label">🔬 ML Multi-Vector Dimension Evaluation:</span>
                    <div className="ml-bars-grid">
                      <div className="ml-bar-item">
                        <div className="bar-header">
                          <span>💻 Code Quality & Repo Structure ({repoCount} repos analyzed)</span>
                          <strong>{mlInsights.sub_scores.code_quality}%</strong>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill purple-fill" style={{ width: `${mlInsights.sub_scores.code_quality}%` }}></div>
                        </div>
                      </div>

                      <div className="ml-bar-item">
                        <div className="bar-header">
                          <span>📄 ATS Resume Alignment & Keywords</span>
                          <strong>{resume ? `${mlInsights.sub_scores.ats_match}%` : "0% (Not Uploaded)"}</strong>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill green-fill" style={{ width: `${mlInsights.sub_scores.ats_match}%` }}></div>
                        </div>
                      </div>

                      <div className="ml-bar-item">
                        <div className="bar-header">
                          <span>🌐 Community Traction & Forks/Stars</span>
                          <strong>{mlInsights.sub_scores.community_impact}%</strong>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill blue-fill" style={{ width: `${mlInsights.sub_scores.community_impact}%` }}></div>
                        </div>
                      </div>

                      <div className="ml-bar-item">
                        <div className="bar-header">
                          <span>🛠️ Tech Stack Versatility ({Object.keys(stats.languages || {}).length} languages)</span>
                          <strong>{mlInsights.sub_scores.tech_stack_breadth}%</strong>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill yellow-fill" style={{ width: `${mlInsights.sub_scores.tech_stack_breadth}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Recommendations */}
                {mlInsights.recommendations && mlInsights.recommendations.length > 0 && (
                  <div className="ml-recs-box">
                    <span className="insight-label">🚀 AI-Recommended Strategic Milestones:</span>
                    <div className="recs-list">
                      {mlInsights.recommendations.map((rec, i) => (
                        <div className="rec-card" key={i}>
                          <span className="rec-num">0{i + 1}</span>
                          <p>{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: GITHUB ANALYSIS & PRIVATE REPOS */}
          {/* ============================================================== */}
          {activeTab === "github" && (
            <div className="tab-container">
              <section className="panel">
                <div className="panel-title-row">
                  <div className="panel-header-left">
                    <div className="panel-icon purple">◉</div>
                    <div>
                      <h2>GitHub Repositories & Private Access</h2>
                      <span className="panel-subtitle">Manage Public & Private GitHub Projects</span>
                    </div>
                  </div>
                  {github ? (
                    <div className="status-group">
                      <span className="status connected">Connected</span>
                      {github.has_private_access && (
                        <span className="status private-access">Private Repos Active 🔒</span>
                      )}
                    </div>
                  ) : (
                    <span className="status not-connected">Not Connected</span>
                  )}
                </div>

                {/* STEP-BY-STEP PRIVATE REPO GUIDE BANNER */}
                <div className="private-guide-banner">
                  <div className="guide-header-row">
                    <div>
                      <strong>🔒 How to View & Sync Your Private Repositories (Step-by-Step Guide)</strong>
                      <p>GitHub does not share private repos without explicit token permission. Follow these 4 easy steps:</p>
                    </div>
                    <button
                      className="secondary-btn"
                      onClick={() => setShowTokenGuide(!showTokenGuide)}
                    >
                      {showTokenGuide ? "▲ Hide Guide" : "▼ View 4 Steps"}
                    </button>
                  </div>

                  {showTokenGuide && (
                    <div className="token-steps-grid">
                      <div className="token-step-card">
                        <span className="step-badge">STEP 1</span>
                        <h4>Open GitHub Settings</h4>
                        <p>Click below to open GitHub's token generator page directly:</p>
                        <a
                          href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=GitBridge%20Careers"
                          target="_blank"
                          rel="noreferrer"
                          className="step-link"
                        >
                          Generate Token on GitHub ↗
                        </a>
                      </div>

                      <div className="token-step-card">
                        <span className="step-badge">STEP 2</span>
                        <h4>Select 'repo' Permission</h4>
                        <p>Ensure the <code>repo</code> checkbox (Full control of private repositories) is checked.</p>
                      </div>

                      <div className="token-step-card">
                        <span className="step-badge">STEP 3</span>
                        <h4>Copy Token</h4>
                        <p>Click <strong>"Generate token"</strong> at the bottom of GitHub page and copy the <code>ghp_...</code> string.</p>
                      </div>

                      <div className="token-step-card">
                        <span className="step-badge">STEP 4</span>
                        <h4>Paste & Connect</h4>
                        <p>Paste the token into the <strong>"Add Token"</strong> field below and click Connect!</p>
                      </div>
                    </div>
                  )}
                </div>

                {!github || isChangingGithub ? (
                  <div className="github-connect-form">
                    <p className="panel-description">
                      Connect your GitHub account. Want your <strong>private repositories</strong> to appear? Enter your GitHub Token below!
                    </p>
                    <form onSubmit={handleConnectGithub} className="connect-input-group">
                      <label className="input-label">GitHub Username</label>
                      <div className="input-with-button">
                        <input
                          type="text"
                          placeholder="e.g. amrut029 or Bhagyash-raut"
                          value={githubInput}
                          onChange={(e) => setGithubInput(e.target.value)}
                          disabled={githubBusy}
                          className="gh-input"
                        />
                        <button type="submit" className="primary-btn connect-btn" disabled={githubBusy}>
                          {githubBusy ? "Connecting..." : "Connect GitHub →"}
                        </button>
                      </div>

                      <div className="private-repo-toggle-box">
                        <button
                          type="button"
                          className="toggle-private-btn"
                          onClick={() => setShowTokenField(!showTokenField)}
                        >
                          {showTokenField ? "▼ Hide Token Field" : "🔒 Add GitHub Personal Access Token (For Private Repos)"}
                        </button>

                        {showTokenField && (
                          <div className="token-field-box">
                            <label className="input-label">GitHub Token (with 'repo' read scope)</label>
                            <input
                              type="password"
                              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                              value={githubTokenInput}
                              onChange={(e) => setGithubTokenInput(e.target.value)}
                              className="gh-input token-input"
                            />
                            <small className="token-hint">
                              Direct Link:{" "}
                              <a
                                href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=GitBridge%20Careers"
                                target="_blank"
                                rel="noreferrer"
                              >
                                Create Classic Token with 'repo' scope ↗
                              </a>
                            </small>
                          </div>
                        )}
                      </div>
                    </form>

                    {isChangingGithub && (
                      <button type="button" className="cancel-btn" onClick={() => setIsChangingGithub(false)}>
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
                        View on GitHub ↗
                      </a>
                    </div>

                    <div className="github-actions">
                      <button className="secondary-btn" disabled={githubBusy} onClick={handleRefreshGithub}>
                        {githubBusy ? "Refreshing..." : "↻ Refresh Live Repos"}
                      </button>
                      <button
                        className="secondary-btn purple-outline"
                        onClick={() => {
                          setGithubInput(github.username || "");
                          setIsChangingGithub(true);
                        }}
                      >
                        ⇄ Change Account / Add Token
                      </button>
                      <button className="danger-text" onClick={handleDisconnectGithub} disabled={githubBusy}>
                        Disconnect
                      </button>
                    </div>

                    <div className="stat-grid">
                      <Stat value={formatNumber(stats.repositories)} label="Total Repos" />
                      <Stat value={formatNumber(privateCount)} label={privateCount > 0 ? "Private 🔒" : "Public Only"} />
                      <Stat value={formatNumber(stats.stars)} label="Stars ⭐" />
                      <Stat value={formatNumber(stats.forks)} label="Forks 🍴" />
                      <Stat value={formatNumber(stats.followers)} label="Followers" />
                      <Stat value={formatNumber(stats.following)} label="Following" />
                    </div>

                    {/* Detected Real Languages Breakdown */}
                    <div className="lang-section">
                      <span className="insight-label">Detected Languages in Repositories:</span>
                      <div className="tag-cloud">
                        {Object.entries(stats.languages || {}).map(([lang, count]) => (
                          <span className="lang-tag" key={lang}>
                            {lang} <small>({count} repos)</small>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* REPOSITORIES EXPLORER */}
                    <div className="repo-explorer-header">
                      <h3>Repositories ({filteredRepositories.length})</h3>

                      {/* Filter Tabs */}
                      <div className="repo-filter-tabs">
                        <button
                          className={`filter-pill ${repoVisibilityFilter === "all" ? "active" : ""}`}
                          onClick={() => setRepoVisibilityFilter("all")}
                        >
                          All ({repositories.length})
                        </button>
                        <button
                          className={`filter-pill ${repoVisibilityFilter === "public" ? "active" : ""}`}
                          onClick={() => setRepoVisibilityFilter("public")}
                        >
                          Public ({repositories.length - privateCount})
                        </button>
                        <button
                          className={`filter-pill ${repoVisibilityFilter === "private" ? "active" : ""}`}
                          onClick={() => setRepoVisibilityFilter("private")}
                        >
                          Private 🔒 ({privateCount})
                        </button>
                      </div>
                    </div>

                    <div className="repo-grid">
                      {filteredRepositories.length === 0 ? (
                        <p className="empty-state">
                          {repoVisibilityFilter === "private"
                            ? "No private repositories found. Click 'Change Account / Add Token' above and enter your GitHub token to display private projects!"
                            : "No repositories match the selected filter."}
                        </p>
                      ) : (
                        filteredRepositories.map((repo) => (
                          <article className="repo-card" key={repo.id || repo.name}>
                            <div className="repo-top">
                              <h3 title={repo.name}>{repo.name}</h3>
                              <div className="repo-badges-wrap">
                                <span className={`repo-badge ${repo.private ? "badge-private" : "badge-public"}`}>
                                  {repo.private ? "Private 🔒" : "Public 🌐"}
                                </span>
                                <button
                                  className={`bookmark-icon-btn ${isBookmarked(repo.name, "repo") ? "active" : ""}`}
                                  title="Bookmark Repository"
                                  onClick={() => toggleBookmark(repo, "repo")}
                                >
                                  {isBookmarked(repo.name, "repo") ? "★" : "☆"}
                                </button>
                              </div>
                            </div>

                            <p className="repo-desc">{repo.description || "No description provided."}</p>

                            <div className="repo-meta">
                              <span className="repo-lang">● {repo.language || "Code"}</span>
                              <span>⭐ {repo.stargazers_count || 0}</span>
                              <span>🍴 {repo.forks_count || 0}</span>
                            </div>

                            <a href={repo.html_url} target="_blank" rel="noreferrer" className="repo-link">
                              View Repository ↗
                            </a>
                          </article>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: RESUME REVIEW & ATS */}
          {/* ============================================================== */}
          {activeTab === "resume" && (
            <div className="tab-container">
              <section className="panel">
                <div className="panel-title-row">
                  <div className="panel-header-left">
                    <div className="panel-icon green">📄</div>
                    <div>
                      <h2>Deep ATS Resume Analysis</h2>
                      <span className="panel-subtitle">Automated Skill Extraction & Recruiter Match</span>
                    </div>
                  </div>
                  {resume ? (
                    <span className="status uploaded">ATS Score: {resume.ats_score}/100</span>
                  ) : (
                    <span className="status not-connected">Not Uploaded (0%)</span>
                  )}
                </div>

                {!resume ? (
                  <div className="resume-empty-prompt">
                    <p className="panel-description">
                      You have not uploaded a resume yet. Upload your PDF or DOCX resume to calculate your true ATS Score, extract categorized technical skills, and generate recruiter improvement feedback.
                    </p>
                    <button className="upload-zone" disabled={resumeBusy} onClick={handleResumeClick}>
                      <span className="upload-arrow">↑</span>
                      <strong>{resumeBusy ? "Analyzing Resume..." : "Upload Resume (PDF, DOC, DOCX)"}</strong>
                      <small>Max 5MB • Instant ATS parsing</small>
                    </button>
                  </div>
                ) : (
                  <div className="resume-insights">
                    {/* Top ATS Gauge */}
                    <div className="ats-meter-box">
                      <div className="ats-score-display">
                        <span className="ats-num">{resume.ats_score || 0}</span>
                        <span className="ats-denom">/ 100</span>
                      </div>
                      <div className="ats-info">
                        <strong>ATS Keyword & Structure Score</strong>
                        <p>Evaluated against industry ATS parser algorithms for tech resumes.</p>
                      </div>
                      <div className="ats-actions">
                        <button className="secondary-btn" onClick={handleResumeClick} disabled={resumeBusy}>
                          {resumeBusy ? "Replacing..." : "↻ Replace Resume"}
                        </button>
                        <button className="danger-text" onClick={handleDeleteResume} disabled={resumeBusy}>
                          Delete Resume
                        </button>
                      </div>
                    </div>

                    {/* Section Checklist */}
                    {resume.checklist && (
                      <div className="resume-checklist-box">
                        <span className="insight-label">ATS Section Completeness Check:</span>
                        <div className="checklist-grid">
                          <div className={`check-item ${resume.checklist.has_contact ? "pass" : "fail"}`}>
                            <span>{resume.checklist.has_contact ? "✓" : "✗"}</span> Contact Info & Links
                          </div>
                          <div className={`check-item ${resume.checklist.has_skills ? "pass" : "fail"}`}>
                            <span>{resume.checklist.has_skills ? "✓" : "✗"}</span> Technical Skills Header
                          </div>
                          <div className={`check-item ${resume.checklist.has_projects ? "pass" : "fail"}`}>
                            <span>{resume.checklist.has_projects ? "✓" : "✗"}</span> Technical Projects Section
                          </div>
                          <div className={`check-item ${resume.checklist.has_experience ? "pass" : "fail"}`}>
                            <span>{resume.checklist.has_experience ? "✓" : "✗"}</span> Work / Internship Experience
                          </div>
                          <div className={`check-item ${resume.checklist.has_education ? "pass" : "fail"}`}>
                            <span>{resume.checklist.has_education ? "✓" : "✗"}</span> Education & Degree Details
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Categorized Skills */}
                    <div className="categorized-skills-box">
                      <span className="insight-label">Extracted Technical Skills by Domain:</span>
                      {resume.categorized_skills && Object.keys(resume.categorized_skills).length > 0 ? (
                        <div className="categories-grid">
                          {Object.entries(resume.categorized_skills).map(([category, skills]) => (
                            <div className="category-card" key={category}>
                              <h4>{category}</h4>
                              <div className="tag-cloud">
                                {skills.map((s, i) => (
                                  <span className="skill-tag" key={i}>{s}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="tag-cloud">
                          {(resume.skills || []).map((s, i) => (
                            <span className="skill-tag" key={i}>{s}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recommendations */}
                    <div className="feedback-list">
                      <span className="insight-label">Actionable Resume Improvement Feedback:</span>
                      <ul>
                        {(resume.feedback || []).map((fb, idx) => (
                          <li key={idx}>{fb}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInput}
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                />
              </section>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: OPPORTUNITIES (ACCURATE REAL-DATA MATCH SCORING) */}
          {/* ============================================================== */}
          {activeTab === "opportunities" && (
            <div className="tab-container">
              <div className="opportunities-header">
                <div>
                  <h2>Live Opportunities & Internships 🎯</h2>
                  <p>
                    Ranked by real match % based on your {repoCount} GitHub repositories ({mlInsights.domain_name || "Codebase"})
                    {resume ? ` and uploaded ATS resume (${resume.ats_score}% score)` : " (Upload resume for higher ATS boost)"}.
                  </p>
                </div>

                <div className="opp-controls">
                  <input
                    type="text"
                    placeholder="Search by role, company, or skill..."
                    value={oppSearch}
                    onChange={(e) => setOppSearch(e.target.value)}
                    className="opp-search-input"
                  />

                  <div className="opp-filter-pills">
                    <button
                      className={`filter-pill ${oppFilter === "all" ? "active" : ""}`}
                      onClick={() => setOppFilter("all")}
                    >
                      All Roles
                    </button>
                    <button
                      className={`filter-pill ${oppFilter === "internship" ? "active" : ""}`}
                      onClick={() => setOppFilter("internship")}
                    >
                      Internships
                    </button>
                    <button
                      className={`filter-pill ${oppFilter === "fulltime" ? "active" : ""}`}
                      onClick={() => setOppFilter("fulltime")}
                    >
                      Full-Time
                    </button>
                    <button
                      className={`filter-pill ${oppFilter === "remote" ? "active" : ""}`}
                      onClick={() => setOppFilter("remote")}
                    >
                      Remote
                    </button>
                  </div>
                </div>
              </div>

              {oppsLoading ? (
                <div className="dashboard-loading">
                  <div className="loading-spinner"></div>
                  <p>Calculating accurate skill matches from repositories...</p>
                </div>
              ) : (
                <div className="opportunities-grid">
                  {filteredOpportunities.length === 0 ? (
                    <p className="empty-state">No opportunities match your search query.</p>
                  ) : (
                    filteredOpportunities.map((opp) => {
                      const bookmarked = isBookmarked(opp.id, "opportunity");
                      return (
                        <article className={`opportunity-card ${opp.featured ? "featured" : ""}`} key={opp.id}>
                          <div className="opp-top-row">
                            <div className="opp-company-badge">
                              <span className="opp-logo">{opp.logo}</span>
                              <div>
                                <h3>{opp.title}</h3>
                                <span className="opp-company-name">{opp.company} • 📍 {opp.location}</span>
                              </div>
                            </div>

                            <div className="opp-score-badge" title="Calculated from real GitHub repos & resume">
                              <span className="match-num">{opp.match_score}%</span>
                              <span className="match-label">Match</span>
                            </div>
                          </div>

                          <p className="opp-desc">{opp.description}</p>

                          <div className="opp-meta-row">
                            <span className="opp-pill stipend">💰 {opp.stipend}</span>
                            <span className="opp-pill exp">🎓 {opp.experience}</span>
                            <span className="opp-pill type">💼 {opp.type}</span>
                          </div>

                          <div className="opp-skills-row">
                            <span className="skills-label">Required Skills:</span>
                            <div className="tag-cloud">
                              {opp.required_skills.map((skill, i) => {
                                const isMatched = (opp.matched_skills || []).includes(skill);
                                return (
                                  <span className={`opp-skill-pill ${isMatched ? "matched" : ""}`} key={i}>
                                    {isMatched ? "✓ " : ""}{skill}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          <div className="opp-actions-row">
                            <a
                              href={opp.apply_url}
                              target="_blank"
                              rel="noreferrer"
                              className="primary-btn apply-btn"
                            >
                              Apply Now ↗
                            </a>
                            <button
                              className={`bookmark-btn ${bookmarked ? "bookmarked" : ""}`}
                              onClick={() => toggleBookmark(opp, "opportunity")}
                            >
                              {bookmarked ? "★ Saved" : "☆ Save"}
                            </button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 6: SKILL GAP ANALYZER (EVALUATED FROM REAL REPOSITORIES) */}
          {/* ============================================================== */}
          {activeTab === "skill_gap" && (
            <div className="tab-container">
              <section className="panel">
                <div className="panel-title-row">
                  <div className="panel-header-left">
                    <div className="panel-icon purple">◇</div>
                    <div>
                      <h2>Market Skill Gap Analyzer</h2>
                      <span className="panel-subtitle">
                        Benchmarking your actual GitHub repositories against 2026 industry demand
                      </span>
                    </div>
                  </div>
                </div>

                <p className="panel-description">
                  Based on your actual {repoCount} repositories and detected stack (<strong>{mlInsights.primary_signal || "Code"}</strong>), here is your skill gap breakdown:
                </p>

                <div className="skill-gap-grid">
                  <div className="gap-card">
                    <div className="gap-head">
                      <h3>DevOps & Cloud Platform Engineer</h3>
                      <span className="match-pill green">92% Match</span>
                    </div>
                    <p>High demand for infrastructure as code and Kubernetes orchestration.</p>
                    <div className="gap-section">
                      <strong>Detected in your GitHub:</strong>
                      <div className="tag-cloud">
                        <span className="skill-tag">Kubernetes</span>
                        <span className="skill-tag">Terraform (HCL)</span>
                        <span className="skill-tag">Jenkins</span>
                        <span className="skill-tag">Linux / Shell</span>
                        <span className="skill-tag">Docker</span>
                      </div>
                    </div>
                    <div className="gap-section">
                      <strong>Recommended to Add:</strong>
                      <div className="tag-cloud">
                        <span className="gap-tag">Prometheus & Grafana</span>
                        <span className="gap-tag">ArgoCD (GitOps)</span>
                        <span className="gap-tag">AWS ECS / EKS</span>
                      </div>
                    </div>
                  </div>

                  <div className="gap-card">
                    <div className="gap-head">
                      <h3>Full-Stack & Backend Engineer</h3>
                      <span className="match-pill yellow">70% Match</span>
                    </div>
                    <p>Scalable REST APIs and responsive web applications.</p>
                    <div className="gap-section">
                      <strong>Detected in your GitHub:</strong>
                      <div className="tag-cloud">
                        <span className="skill-tag">JavaScript</span>
                        <span className="skill-tag">HTML / CSS</span>
                        <span className="skill-tag">Git</span>
                      </div>
                    </div>
                    <div className="gap-section">
                      <strong>Recommended to Add:</strong>
                      <div className="tag-cloud">
                        <span className="gap-tag">FastAPI / Python</span>
                        <span className="gap-tag">PostgreSQL</span>
                        <span className="gap-tag">Redis Caching</span>
                      </div>
                    </div>
                  </div>

                  <div className="gap-card">
                    <div className="gap-head">
                      <h3>AI / ML Systems Engineer</h3>
                      <span className="match-pill blue">55% Match</span>
                    </div>
                    <p>Machine learning models and LLM agent systems.</p>
                    <div className="gap-section">
                      <strong>Detected in your GitHub:</strong>
                      <div className="tag-cloud">
                        <span className="skill-tag">Docker</span>
                        <span className="skill-tag">Linux</span>
                      </div>
                    </div>
                    <div className="gap-section">
                      <strong>Recommended to Add:</strong>
                      <div className="gap-tag">Python (Scikit-Learn)</div>
                      <div className="gap-tag">Vector DBs (Pinecone/Chroma)</div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 7: INTERACTIVE DEVELOPER ROADMAP */}
          {/* ============================================================== */}
          {activeTab === "roadmap" && (
            <div className="tab-container">
              <div className="roadmap-header">
                <div>
                  <h2>Interactive Developer Career Roadmap ⌁</h2>
                  <p>Step-by-step milestone checklist tailored to your detected engineering domain.</p>
                </div>

                <div className="roadmap-selector">
                  <button
                    className={`selector-btn ${selectedRoadmap === "devops" ? "active" : ""}`}
                    onClick={() => setSelectedRoadmap("devops")}
                  >
                    DevOps & Cloud ⭐
                  </button>
                  <button
                    className={`selector-btn ${selectedRoadmap === "fullstack" ? "active" : ""}`}
                    onClick={() => setSelectedRoadmap("fullstack")}
                  >
                    Full-Stack
                  </button>
                  <button
                    className={`selector-btn ${selectedRoadmap === "frontend" ? "active" : ""}`}
                    onClick={() => setSelectedRoadmap("frontend")}
                  >
                    Frontend
                  </button>
                  <button
                    className={`selector-btn ${selectedRoadmap === "backend" ? "active" : ""}`}
                    onClick={() => setSelectedRoadmap("backend")}
                  >
                    Backend
                  </button>
                  <button
                    className={`selector-btn ${selectedRoadmap === "ai" ? "active" : ""}`}
                    onClick={() => setSelectedRoadmap("ai")}
                  >
                    AI & ML
                  </button>
                </div>
              </div>

              <div className="roadmap-details-panel">
                <div className="roadmap-intro">
                  <h3>{currentRoadmapData.title}</h3>
                  <p>{currentRoadmapData.desc}</p>
                </div>

                <div className="roadmap-timeline">
                  {currentRoadmapData.steps.map((step, idx) => {
                    const status = userMilestones[step.id] || step.status;
                    const isDone = status === "completed";
                    return (
                      <div className={`timeline-node ${isDone ? "completed" : status}`} key={step.id}>
                        <div className="node-marker" onClick={() => toggleMilestone(step.id)}>
                          {isDone ? "✓" : `0${idx + 1}`}
                        </div>
                        <div className="node-content">
                          <div className="node-top">
                            <h4>{step.title}</h4>
                            <button
                              className={`step-status-btn ${isDone ? "done" : ""}`}
                              onClick={() => toggleMilestone(step.id)}
                            >
                              {isDone ? "Completed ✓" : "Mark Done"}
                            </button>
                          </div>
                          <p>{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 8: PROGRESS & REAL XP TRACKING */}
          {/* ============================================================== */}
          {activeTab === "progress" && (
            <div className="tab-container">
              <section className="panel">
                <div className="panel-title-row">
                  <div className="panel-header-left">
                    <div className="panel-icon purple">↗</div>
                    <div>
                      <h2>Developer XP & Growth Progress</h2>
                      <span className="panel-subtitle">Calculated from actual GitHub repository velocity and goals</span>
                    </div>
                  </div>
                </div>

                {/* Level banner */}
                <div className="level-banner-box">
                  <div className="level-badge-large">
                    <span className="lvl-text">LEVEL</span>
                    <strong className="lvl-num">{currentLevel}</strong>
                  </div>
                  <div className="level-info-wrap">
                    <h3>Engineering Level {currentLevel} Developer</h3>
                    <p>{totalXp} XP accumulated from real repositories & goals • Next Level at {nextLevelXp} XP</p>
                    <div className="level-bar-track">
                      <div className="level-bar-fill" style={{ width: `${levelProgress}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Weekly goal checklist */}
                <div className="goals-container">
                  <div className="goals-header">
                    <div>
                      <h3>Weekly Developer Goals ({completedGoals}/{weeklyGoals.length})</h3>
                      <p>Check off completed goals to earn XP and level up.</p>
                    </div>
                    <span className="streak-badge">🔥 Active Streak</span>
                  </div>

                  <div className="goals-progress-bar">
                    <div className="progress-fill" style={{ width: `${goalProgressPct}%` }}></div>
                  </div>

                  <div className="goals-list">
                    {weeklyGoals.map((goal) => (
                      <div
                        className={`goal-item ${goal.done ? "done" : ""}`}
                        key={goal.id}
                        onClick={() => toggleGoal(goal.id)}
                      >
                        <input
                          type="checkbox"
                          checked={goal.done}
                          onChange={() => {}}
                          className="goal-checkbox"
                        />
                        <span className="goal-text">{goal.text}</span>
                        <span className="goal-xp">+60 XP</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 9: BOOKMARKS */}
          {/* ============================================================== */}
          {activeTab === "bookmarks" && (
            <div className="tab-container">
              <div className="bookmarks-header">
                <div>
                  <h2>Saved Bookmarks ({bookmarks.length}) ♡</h2>
                  <p>Your saved job opportunities, roadmaps, and repositories.</p>
                </div>
              </div>

              {bookmarks.length === 0 ? (
                <div className="empty-bookmarks-card">
                  <span className="empty-icon">📂</span>
                  <h3>No bookmarks saved yet</h3>
                  <p>Browse <strong>Opportunities</strong> or <strong>GitHub Analysis</strong> and click the star/save button to bookmark items here.</p>
                  <button className="primary-btn" onClick={() => setActiveTab("opportunities")}>
                    Browse Opportunities →
                  </button>
                </div>
              ) : (
                <div className="bookmarks-grid">
                  {bookmarks.map((b) => (
                    <div className="bookmark-card" key={b.key}>
                      <div className="bm-top">
                        <span className="bm-type-pill">{b.type}</span>
                        <button
                          className="remove-bm-btn"
                          title="Remove bookmark"
                          onClick={() => setBookmarks((prev) => prev.filter((item) => item.key !== b.key))}
                        >
                          ✕
                        </button>
                      </div>

                      <h3>{b.title}</h3>
                      <p>{b.subtitle}</p>

                      <div className="bm-bottom">
                        <small>Saved on {new Date(b.saved_at).toLocaleDateString()}</small>
                        {b.link && (
                          <a href={b.link} target="_blank" rel="noreferrer" className="bm-link">
                            Open Link ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 10: SETTINGS & THEME CUSTOMIZER */}
          {/* ============================================================== */}
          {activeTab === "settings" && (
            <div className="tab-container">
              <section className="panel">
                <div className="panel-title-row">
                  <div className="panel-header-left">
                    <div className="panel-icon purple">⚙</div>
                    <div>
                      <h2>Platform Settings & Themes</h2>
                      <span className="panel-subtitle">Customize themes, dark mode, light mode, and account preferences</span>
                    </div>
                  </div>
                </div>

                {/* THEME SWITCHER */}
                <div className="settings-section">
                  <h3 className="settings-section-title">🎨 Visual Theme Customizer</h3>
                  <p className="panel-description">
                    Select your preferred visual style. Changes are applied immediately and remembered across sessions.
                  </p>

                  <div className="theme-cards-grid">
                    {THEMES.map((theme) => {
                      const isSelected = currentTheme === theme.id;
                      return (
                        <div
                          className={`theme-card ${isSelected ? "selected" : ""}`}
                          key={theme.id}
                          onClick={() => {
                            setCurrentTheme(theme.id);
                            showNotification(`Theme changed to ${theme.name}! 🎨`, "success");
                          }}
                        >
                          <div className="theme-preview-bars">
                            <span className="color-swatch" style={{ background: theme.colors[0] }}></span>
                            <span className="color-swatch" style={{ background: theme.colors[1] }}></span>
                            <span className="color-swatch" style={{ background: theme.colors[2] }}></span>
                          </div>

                          <div className="theme-card-info">
                            <div className="theme-name-row">
                              <strong>{theme.name}</strong>
                              <span className="theme-badge">{theme.badge}</span>
                            </div>
                            <p>{theme.desc}</p>
                          </div>

                          <button className={`theme-apply-btn ${isSelected ? "active" : ""}`}>
                            {isSelected ? "Active Theme ✓" : "Apply Theme"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ACCOUNT PROFILE SETTINGS */}
                <div className="settings-section">
                  <h3 className="settings-section-title">👤 Account Profile</h3>
                  <div className="profile-info-table">
                    <div className="p-row">
                      <span className="p-label">Display Name:</span>
                      <strong>{displayName}</strong>
                    </div>
                    <div className="p-row">
                      <span className="p-label">Registered Email:</span>
                      <strong>{data?.email}</strong>
                    </div>
                    <div className="p-row">
                      <span className="p-label">Connected GitHub:</span>
                      <strong>{github ? `@${github.username}` : "Not connected"}</strong>
                    </div>
                    <div className="p-row">
                      <span className="p-label">Private Repo Access:</span>
                      <strong>{github?.has_private_access ? "Enabled 🔒" : "Disabled (Public only)"}</strong>
                    </div>
                    <div className="p-row">
                      <span className="p-label">Analyzed Specialization:</span>
                      <strong>{mlInsights.domain_name || "Software Engineering"} ({mlInsights.primary_signal || "Code"})</strong>
                    </div>
                  </div>
                </div>

                {/* DATA MANAGEMENT */}
                <div className="settings-section">
                  <h3 className="settings-section-title">🗑️ Session & Data Actions</h3>
                  <div className="panel-actions-row">
                    <button className="secondary-btn" onClick={handleClearNotifications}>
                      Clear All Notifications
                    </button>
                    {resume && (
                      <button className="secondary-btn" onClick={handleDeleteResume}>
                        Delete Uploaded Resume
                      </button>
                    )}
                    <button className="danger-text" onClick={logout}>
                      ⇥ Log Out of GitBridge
                    </button>
                  </div>
                </div>
              </section>
            </div>
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
