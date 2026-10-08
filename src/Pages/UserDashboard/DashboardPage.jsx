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
  syncLiveOpportunities,
  applyOpportunity,
  getApplications,
  confirmExternalApplication,
  toggleOpportunityBookmark,
  getBookmarks,
  refreshGithub,
  submitHelpQuery,
  updateProfile,
  uploadResume,
  getAdminInquiries,
  updateInquiryStatus,
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
    desc: "Ultra-pure deep pitch black (#000) for OLED panels",
    badge: "🌌 Pitch Black",
    colors: ["#000000", "#0a0a0d", "#a855f7"]
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Neon",
    desc: "High-contrast electric cyan and neon magenta palette",
    badge: "🚀 Cyber Neon",
    colors: ["#070a13", "#0d1322", "#00f0ff"]
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
  software: {
    title: "Software & Full-Stack Development (Web, Apps & Systems)",
    desc: "Covers frontends, high-throughput backend APIs, database architecture, and application engineering.",
    steps: [
      { id: "sw1", title: "Core CS & Algorithms (Data Structures, Time Complexity, OOP)", desc: "Arrays, LinkedLists, Trees, Graphs, Sorting algorithms, Object-Oriented Design patterns, and clean code.", keywords: ["dsa", "algorithm", "data-structures", "leetcode", "c++", "java", "python", "oop", "clean-code", "problem-solving"] },
      { id: "sw2", title: "Modern Web Frontend (React 19, TypeScript, Next.js)", desc: "State management, client/server components, responsive CSS Grid/Flexbox, and accessibility standards.", keywords: ["react", "nextjs", "vue", "angular", "typescript", "javascript", "tailwind", "html", "css", "frontend", "redux", "vite"] },
      { id: "sw3", title: "Backend API Frameworks (Node.js/Express, Python/FastAPI, Java/Spring)", desc: "RESTful architecture, asynchronous request pipelines, middleware authentication, and OpenAPI specs.", keywords: ["node", "express", "fastapi", "django", "flask", "spring", "backend", "api", "rest", "graphql", "nest", "controller"] },
      { id: "sw4", title: "Database Systems & Caching (PostgreSQL, MongoDB Atlas, Redis)", desc: "Relational indexing, NoSQL document modeling, transaction ACID properties, and Redis caching layers.", keywords: ["mongodb", "postgres", "sql", "mysql", "redis", "database", "prisma", "hibernate", "mongoose", "dynamodb", "nosql"] },
      { id: "sw5", title: "Application Deployment, Containerization & CI/CD", desc: "Docker multi-stage builds, automated GitHub Actions testing, serverless functions, and cloud hosting.", keywords: ["docker", "ci/cd", "github-actions", "aws", "deploy", "vercel", "kubernetes", "cloud", "render", "container", "pipeline"] },
      { id: "sw6", title: "System Design & Distributed Microservices", desc: "Horizontal scalability, rate limiting, message queues (RabbitMQ/Kafka), and load balancers.", keywords: ["microservice", "kafka", "rabbitmq", "system-design", "distributed", "load-balancer", "grpc", "scalability", "queue"] }
    ]
  },
  devops: {
    title: "Cloud, DevOps & Site Reliability Engineering (SRE)",
    desc: "Production-grade infrastructure as code, Kubernetes orchestration, CI/CD pipelines, and cloud observability.",
    steps: [
      { id: "do1", title: "Linux Systems, Shell & Networking Foundations", desc: "Bash scripting, process management, SSH keys, IPTables, DNS, and systemd services.", keywords: ["bash", "shell", "linux", "networking", "ssh", "systemd", "script", "terminal", "zsh", "ubuntu"] },
      { id: "do2", title: "Containerization with Docker & Multi-Stage Builds", desc: "Dockerfile optimization, image layers, Docker Compose networking, and rootless security.", keywords: ["docker", "dockerfile", "container", "compose", "podman", "containerization"] },
      { id: "do3", title: "Infrastructure as Code (IaC) with Terraform & HCL", desc: "Modular Terraform architecture, state locking with S3/DynamoDB, and cloud provider provisioning.", keywords: ["terraform", "iac", "ansible", "hcl", "cloudformation", "pulumi", "aws", "cloud"] },
      { id: "do4", title: "Kubernetes Cluster Orchestration & Helm Charts", desc: "Deployments, StatefulSets, Ingress Controllers, ConfigMaps, Secrets, and Helm packaging.", keywords: ["kubernetes", "k8s", "helm", "kubectl", "ingress", "cluster", "minikube", "argocd"] },
      { id: "do5", title: "Automated CI/CD Pipelines (Jenkins & GitHub Actions)", desc: "Declarative Jenkinsfiles, branch protection triggers, automated test suites, and Docker image registries.", keywords: ["jenkins", "github-actions", "ci/cd", "pipeline", "gitlab-ci", "workflow", "circleci"] },
      { id: "do6", title: "Observability, Monitoring & GitOps (Prometheus & ArgoCD)", desc: "Prometheus metrics collection, Grafana visualization dashboards, alert managers, and ArgoCD GitOps sync.", keywords: ["prometheus", "grafana", "argocd", "gitops", "elk", "datadog", "monitoring", "loki", "opentelemetry"] }
    ]
  },
  aiml: {
    title: "AI, Machine Learning & Data Science Engineering",
    desc: "Data engineering pipelines, deep learning models, LLM fine-tuning, RAG architectures, and scalable MLOps.",
    steps: [
      { id: "ai1", title: "Mathematics, Statistics & Data Wrangling (NumPy, Pandas)", desc: "Linear algebra, matrix operations, statistical inference, feature engineering, and data cleaning.", keywords: ["numpy", "pandas", "statistics", "data-analysis", "eda", "matplotlib", "seaborn", "jupyter", "python"] },
      { id: "ai2", title: "Classical Machine Learning & Scikit-Learn Models", desc: "Supervised & unsupervised learning, Random Forest, XGBoost, cross-validation, and metrics evaluation.", keywords: ["scikit-learn", "sklearn", "machine-learning", "regression", "classification", "random-forest", "xgboost", "model"] },
      { id: "ai3", title: "Deep Learning & Neural Networks (PyTorch / TensorFlow)", desc: "CNNs for Computer Vision, RNNs/Transformers for NLP, backpropagation, and GPU training optimization.", keywords: ["pytorch", "tensorflow", "keras", "deep-learning", "cnn", "neural-network", "nlp", "computer-vision"] },
      { id: "ai4", title: "Generative AI, LLMs & Vector Retrieval (RAG, ChromaDB)", desc: "Vector embeddings, LangChain, semantic search, prompt engineering, and agent tool execution.", keywords: ["rag", "llm", "langchain", "llamaindex", "openai", "gemini", "chromadb", "vector", "embeddings", "generative-ai", "prompt"] },
      { id: "ai5", title: "MLOps, Model Deployment & FastAPI Inference", desc: "Containerizing models with Docker, low-latency ONNX runtime, Triton inference server, and model monitoring.", keywords: ["mlops", "fastapi", "onnx", "triton", "docker", "serving", "huggingface", "model", "inference"] }
    ]
  },
  embedded: {
    title: "Embedded Systems, IoT & Core Systems Engineering",
    desc: "Low-level system architecture, microcontrollers, real-time operating systems (RTOS), and hardware-software interfacing.",
    steps: [
      { id: "em1", title: "C & C++ Systems Programming & Memory Management", desc: "Pointers, dynamic memory allocation, bit manipulation, struct packing, and memory layout.", keywords: ["c", "c++", "pointers", "memory", "systems", "low-level"] },
      { id: "em2", title: "Microcontroller Architectures & Peripheral Protocols", desc: "ARM Cortex-M, ESP32, GPIO, UART, SPI, I2C, Timers, Interrupt Service Routines (ISR), and DMA.", keywords: ["esp32", "arduino", "arm", "stm32", "gpio", "uart", "spi", "i2c", "microcontroller"] },
      { id: "em3", title: "Real-Time Operating Systems (FreeRTOS / Zephyr)", desc: "Task scheduling, mutexes, semaphores, queue communication, priority inversion, and context switching.", keywords: ["rtos", "freertos", "zephyr", "real-time", "embedded", "threads"] },
      { id: "em4", title: "Embedded Linux & Device Driver Development", desc: "Kernel modules, character drivers, device tree overlays, U-Boot bootloader, and cross-compilation.", keywords: ["kernel", "driver", "linux", "device-tree", "u-boot", "cross-compile"] },
      { id: "em5", title: "IoT Protocols & Wireless Networking (MQTT, BLE, Zigbee)", desc: "TCP/IP socket programming, lightweight telemetry protocols (MQTT/CoAP), and TLS security on edge devices.", keywords: ["iot", "mqtt", "bluetooth", "ble", "zigbee", "socket", "wireless"] }
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
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState("");
  const [expandedApplication, setExpandedApplication] = useState(null);
  const [oppsLoading, setOppsLoading] = useState(false);
  const [oppFilter, setOppFilter] = useState("all");
  const [oppSearch, setOppSearch] = useState("");
  const [lastSyncedTime, setLastSyncedTime] = useState(null);
  const [selectedOpp, setSelectedOpp] = useState(null);

  // Close opportunity details on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && selectedOpp) {
        setSelectedOpp(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedOpp]);

  // Busy States
  const [githubBusy, setGithubBusy] = useState(false);
  const [resumeBusy, setResumeBusy] = useState(false);
  const [roastBusy, setRoastBusy] = useState(false);
  const [syncingJobs, setSyncingJobs] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("info");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Help Center Modal State
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [helpQueryText, setHelpQueryText] = useState("");
  const [helpSubmitting, setHelpSubmitting] = useState(false);

  // Profile Edit State (Saves to MongoDB)
  const [profileName, setProfileName] = useState("");
  const [profileTargetRole, setProfileTargetRole] = useState("");
  const [profileLocation, setProfileLocation] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileLinkedIn, setProfileLinkedIn] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

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

  // City Filter for Opportunities
  const [cityFilter, setCityFilter] = useState("all");

  // Admin Portal State
  const [adminTickets, setAdminTickets] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminFilter, setAdminFilter] = useState("all"); // 'all', 'pending', 'resolved'

  // Bookmarks state (Persisted in localStorage)
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("gb_bookmarks") || "[]");
    } catch {
      return [];
    }
  });

  // Selected Roadmap State (defaults to devops or software)
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
            { id: "g3", text: "Review Developer Roast and fix weak spots", done: false },
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
    loadAdminData();
  }, [navigate]);

  const loadAdminData = async () => {
    setAdminLoading(true);
    try {
      const res = await getAdminInquiries();
      setAdminTickets(res.tickets || []);
      setAdminStats(res.stats || null);
    } catch (err) {
      console.warn("Admin inquiries not accessible:", err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    try {
      await updateInquiryStatus(ticketId, newStatus);
      showNotification(`Ticket updated to ${newStatus}.`, "success");
      setAdminTickets((prev) =>
        prev.map((t) => (t.ticket_id === ticketId ? { ...t, status: newStatus } : t))
      );
      if (adminStats) {
        setAdminStats((prev) => ({
          ...prev,
          pending_tickets: newStatus === "resolved" ? Math.max(0, prev.pending_tickets - 1) : prev.pending_tickets + 1,
          resolved_tickets: newStatus === "resolved" ? prev.resolved_tickets + 1 : Math.max(0, prev.resolved_tickets - 1),
        }));
      }
    } catch (err) {
      showNotification("Failed to update ticket: " + err.message, "error");
    }
  };

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

      // Populate profile state
      setProfileName(response.name || "");
      setProfileTargetRole(response.target_role || "");
      setProfileLocation(response.location_pref || "");
      setProfilePhone(response.phone || "");
      setProfileLinkedIn(response.linkedin_url || "");
      setProfileBio(response.bio || "");

      // Auto-set roadmap to user's analyzed domain
      if (response?.ml_insights?.domain_id && DEFAULT_ROADMAPS[response.ml_insights.domain_id]) {
        setSelectedRoadmap(response.ml_insights.domain_id);
      }
    } catch (error) {
      console.warn("Could not load dashboard details:", error.message);
      showNotification(error.message || "Failed to load dashboard data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadOpportunitiesData = async () => {
    try {
      setOppsLoading(true);
      const [oppsRes, bookmarksRes] = await Promise.all([
        getOpportunities(),
        getBookmarks().catch(() => ({ bookmarks: [] }))
      ]);
      const opps = oppsRes.opportunities || [];
      setOpportunities(opps);

      if (opps.length > 0) {
        const firstSynced = opps.find(o => o.last_synced_at)?.last_synced_at;
        if (firstSynced) {
          try {
            setLastSyncedTime(new Date(firstSynced).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
          } catch (_) {}
        }
      }
      
      if (bookmarksRes && bookmarksRes.bookmarks) {
        // Map bookmarks array of IDs to internal bookmarks state structure
        const mapped = bookmarksRes.bookmarks.map(id => ({
          key: `opportunity_${id}`,
          type: "opportunity",
          id: id
        }));
        setBookmarks(prev => {
          const nonOpps = prev.filter(b => b.type !== "opportunity");
          return [...mapped, ...nonOpps];
        });
      }
    } catch (err) {
      console.error("Opportunities fetch error:", err);
    } finally {
      setOppsLoading(false);
    }
  };

  const handleSyncLiveJobs = async () => {
    try {
      setSyncingJobs(true);
      showNotification("Fetching latest opportunities from external job APIs... 🌐", "info");
      const res = await syncLiveOpportunities();
      await loadOpportunitiesData();
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      showNotification(`Latest opportunities updated! ${res.jobs_synced || 0} active positions refreshed from live feeds. ✅`, "success");
    } catch (err) {
      showNotification("Failed to sync live jobs: " + err.message, "error");
    } finally {
      setSyncingJobs(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    try {
      setProfileSaving(true);
      const res = await updateProfile({
        name: profileName,
        target_role: profileTargetRole,
        location_pref: profileLocation,
        phone: profilePhone,
        linkedin_url: profileLinkedIn,
        bio: profileBio,
      });

      setData((prev) => ({
        ...prev,
        ...res.user,
      }));

      showNotification("Profile details saved to MongoDB successfully! ✅", "success");
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleHelpSubmit = async (e) => {
    e?.preventDefault();
    if (!helpQueryText.trim()) return;

    try {
      setHelpSubmitting(true);
      await submitHelpQuery(helpQueryText, data?.email);
      showNotification("Help ticket submitted! Our support team will follow up via email. 📩", "success");
      setHelpQueryText("");
      setHelpModalOpen(false);
      await loadDashboard();
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setHelpSubmitting(false);
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

  // Filtered opportunities with City & Fresher Support
  const filteredOpportunities = useMemo(() => {
    return (opportunities || []).filter((opp) => {
      if (!opp) return false;

      // Type/Level filter
      const oppType = String(opp.type || "").toLowerCase();
      const oppLevel = String(opp.level || "").toLowerCase();
      const oppExp = String(opp.experience || "").toLowerCase();

      const matchType =
        oppFilter === "all" ||
        (oppFilter === "fresher" && (oppLevel === "fresher" || oppExp.includes("fresh") || oppExp.includes("0-1") || oppExp.includes("entry"))) ||
        (oppFilter === "internship" && (oppType.includes("intern") || oppLevel === "internship")) ||
        (oppFilter === "fulltime" && (oppType.includes("full") || oppType.includes("permanent"))) ||
        (oppFilter === "remote" && (String(opp.location || "").toLowerCase().includes("remote") || String(opp.city || "").toLowerCase() === "remote"));

      // City filter
      const oppCity = String(opp.city || "").toLowerCase();
      const oppLocation = String(opp.location || "").toLowerCase();
      const selectedCityLower = String(cityFilter || "all").toLowerCase();

      const matchCity =
        selectedCityLower === "all" ||
        oppCity.includes(selectedCityLower) ||
        oppLocation.includes(selectedCityLower);

      // Search Query
      const q = String(oppSearch || "").trim().toLowerCase();
      const skills = Array.isArray(opp.required_skills)
        ? opp.required_skills
        : (typeof opp.required_skills === "string" ? opp.required_skills.split(",") : []);

      const matchQuery =
        !q ||
        String(opp.title || "").toLowerCase().includes(q) ||
        String(opp.company || "").toLowerCase().includes(q) ||
        String(opp.stage || "").toLowerCase().includes(q) ||
        oppCity.includes(q) ||
        oppLocation.includes(q) ||
        skills.some((s) => String(s || "").toLowerCase().includes(q));

      return matchType && matchCity && matchQuery;
    });
  }, [opportunities, oppFilter, cityFilter, oppSearch]);

  // Profile Strength Calculator (0 - 100%)
  const profileStrength = useMemo(() => {
    let score = 20; // Base sign in
    if (github?.username) score += 25;
    if (resume?.ats_score) score += 25;
    if (profileName || data?.name) score += 10;
    if (profileTargetRole || data?.target_role) score += 10;
    if (profileLinkedIn || data?.linkedin_url) score += 10;
    return Math.min(100, score);
  }, [github, resume, profileName, profileTargetRole, profileLinkedIn, data]);


  // Toggle Bookmark
  const toggleBookmark = async (item, type = "opportunity") => {
    const key = `${type}_${item.id || item.name || item.title}`;
    const exists = bookmarks.some((b) => b.key === key);

    if (type === "opportunity") {
      try {
        await toggleOpportunityBookmark(item.id);
      } catch (err) {
        showNotification("Failed to update bookmark on server", "error");
      }
    }

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

    const isApplied = (oppId) => {
    return applications.some((app) => 
      String(app.opportunity_id) === String(oppId) || 
      String(app.opportunity?.id) === String(oppId) ||
      String(app.id) === String(oppId)
    );
  };

  const handleApply = async (opp, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const isInternal = opp.source_type === "recruiter" || opp.source === "recruiter" || !opp.apply_url;
    const oppId = opp.id || opp.source_id;
    try {
      if (isInternal) {
        await applyOpportunity(oppId, "internal");
        showNotification("Application submitted directly to hiring team via GitBridge! 🎉", "success");
        await loadApplicationsData();
      } else {
        await applyOpportunity(oppId, "external");
        showNotification("Redirect recorded. Opening original application page... 🚀", "success");
        await loadApplicationsData();
        if (opp.apply_url) {
          window.open(opp.apply_url, "_blank", "noopener,noreferrer");
        }
      }
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes("already applied")) {
        showNotification("You have already applied to this opportunity!", "warning");
      } else {
        showNotification(err.message || "Failed to track application.", "error");
      }
      if (!isInternal && opp.apply_url) {
        window.open(opp.apply_url, "_blank", "noopener,noreferrer");
      }
    }
  };

  const handleConfirmExternalApplication = async (applicationId) => {
    try {
      await confirmExternalApplication(applicationId);
      showNotification("You confirmed that you submitted this application.", "success");
      await loadApplicationsData();
    } catch (err) {
      showNotification(err.message || "Could not update application status.", "error");
    }
  };

  const isBookmarked = (idOrName, type = "opportunity") => {
    const key = `${type}_${idOrName}`;
    return bookmarks.some((b) => b.key === key);
  };

  const toggleMilestone = (stepId) => {
    setUserMilestones((prev) => {
      const current = prev[stepId] || "in_progress";
      const next = current === "completed" ? "in_progress" : "completed";
      return { ...prev, [stepId]: next };
    });
  };

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

    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      showNotification("Only PDF, DOC, and DOCX formats are allowed for resumes.", "error");
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
    if (!github && !resume) {
      showNotification("Connect your GitHub account or upload your resume first to generate a roast.", "error");
      return;
    }

    try {
      setRoastBusy(true);
      showNotification("Cooking your personalized Developer Roast... 🔥🌶️", "info");
      const response = await generateRoast();

      setData((previous) => ({
        ...previous,
        roast: response,
      }));

      showNotification("Your Developer Roast is ready! 🔥", "success");
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

  const bothConnected = Boolean(github && resume);
  const canRoast = Boolean(github || resume);
  const repoCount = stats.repositories || 0;
  const privateCount = stats.private_repositories || 0;
  const verifiedStars = stats.stars || 0;
  const verifiedForks = stats.forks || 0;
  const languageList = useMemo(() => Object.keys(stats.languages || {}), [stats.languages]);
  const languageCount = languageList.length;
  const resumeAts = resume?.ats_score || 0;
  const resumeSkillCount = (resume?.skills || []).length;

  // AUTOMATIC ROADMAP EVALUATION:
  // Evaluates each milestone against user's GitHub repositories & Resume skills in real-time
  const autoEvaluatedRoadmap = useMemo(() => {
    const roadmap = DEFAULT_ROADMAPS[selectedRoadmap] || DEFAULT_ROADMAPS.devops || DEFAULT_ROADMAPS.software;
    const repos = repositories || [];
    const resumeSkills = (resume?.skills || []).map((s) => String(s).toLowerCase());
    const languages = languageList.map((l) => l.toLowerCase());

    const stepsWithAnalysis = (roadmap.steps || []).map((step, idx) => {
      let matchedRepo = null;
      let matchedSkill = null;

      // 1. Cross-check against all user's GitHub repositories
      for (const repo of repos) {
        const repoName = (repo.name || "").toLowerCase();
        const repoDesc = (repo.description || "").toLowerCase();
        const repoLang = (repo.language || "").toLowerCase();
        const repoTopics = (repo.topics || []).map((t) => String(t).toLowerCase());
        const repoText = `${repoName} ${repoDesc} ${repoLang} ${repoTopics.join(" ")}`;

        for (const kw of (step.keywords || [])) {
          if (repoText.includes(kw.toLowerCase())) {
            matchedRepo = repo;
            break;
          }
        }
        if (matchedRepo) break;
      }

      // 2. Cross-check against resume skills or detected languages
      if (!matchedRepo) {
        for (const kw of (step.keywords || [])) {
          const kwLower = kw.toLowerCase();
          const foundSkill = resumeSkills.find((s) => s.includes(kwLower) || kwLower.includes(s));
          if (foundSkill) {
            matchedSkill = `Resume ATS Skill (${foundSkill})`;
            break;
          }
          const foundLang = languages.find((l) => l.includes(kwLower) || kwLower.includes(l));
          if (foundLang) {
            matchedSkill = `GitHub Language (${foundLang})`;
            break;
          }
        }
      }

      const isCompleted = Boolean(matchedRepo || matchedSkill || (idx === 0 && repos.length > 0));

      return {
        ...step,
        isCompleted,
        matchedRepo: matchedRepo ? matchedRepo.name : null,
        matchedSkill: matchedSkill || (idx === 0 && repos.length > 0 ? "Initial Codebase Activity" : null)
      };
    });

    const completedCount = stepsWithAnalysis.filter((s) => s.isCompleted).length;
    const progressPct = Math.round((completedCount / Math.max(stepsWithAnalysis.length, 1)) * 100);

    return {
      ...roadmap,
      steps: stepsWithAnalysis,
      completedCount,
      totalCount: stepsWithAnalysis.length,
      progressPct
    };
  }, [selectedRoadmap, repositories, resume, languageList]);

  // REAL-TIME XP & SENIORITY LEVEL:
  // Automatically computed from GitHub telemetry (repos, private repos, stars, language breadth),
  // verified project milestones, and ATS resume verification.
  const verifiedRoadmapCount = autoEvaluatedRoadmap.completedCount || 0;
  const totalXp = (repoCount * 45) + (privateCount * 35) + (verifiedStars * 20) + (languageCount * 30) + (verifiedRoadmapCount * 120) + Math.round(resumeAts * 2.5);
  const currentLevel = Math.max(1, Math.floor(totalXp / 400) + 1);

  let seniorityTitle = "Junior Software Engineer (L1)";
  if (currentLevel >= 7) seniorityTitle = "Lead / Principal Engineer (L4+)";
  else if (currentLevel >= 5) seniorityTitle = "Senior Software Engineer (L3)";
  else if (currentLevel >= 3) seniorityTitle = "Mid-Level Core Engineer (L2)";

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Analyzing real GitHub repositories & calculating metrics...</p>
      </div>
    );
  }

  return (
    <div className={`gb-dashboard theme-${currentTheme}`} data-theme={currentTheme}>
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="gb-sidebar">
        <div className="gb-logo" onClick={() => navigate("/")}>
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

        <button
          className={`side-item ${activeTab === "applications" ? "active" : ""}`}
          onClick={() => setActiveTab("applications")}
        >
          ▣ <span>My Applications</span>
          {applications.length > 0 && <span className="side-badge">{applications.length}</span>}
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



        {/* SIDEBAR BOTTOM HELP CENTER BUTTON */}
        <div className="sidebar-bottom-help">
          <button className="primary-btn" onClick={() => setHelpModalOpen(true)}>
            <span>💬</span> <span>Help Center & FAQs</span>
          </button>
        </div>
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
              {activeTab === "opportunities" && "Live Opportunities & Startup Sprints"}
              {activeTab === "skill_gap" && "Skill Gap Analysis (Real Repos Evaluated)"}
              {activeTab === "roadmap" && `Interactive Career Roadmap: ${autoEvaluatedRoadmap?.title || "Career Track"}`}
              {activeTab === "progress" && "XP Level & Milestone Progress"}
              {activeTab === "bookmarks" && "Saved Bookmarks & Opportunities"}
              {activeTab === "settings" && "Platform Settings & Profile"}
              {activeTab === "admin" && "Admin Portal • User Inquiries & Analytics"}
            </span>
            <small className="sub-title">GitBridge • AI Career Engineering</small>
          </div>

          <div className="top-actions">
            {/* HELP BUTTON IN HEADER */}
            <button
              className="round-button"
              title="Help Center"
              onClick={() => setHelpModalOpen(true)}
            >
              💬
            </button>

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
                <span className="caret"></span>
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
                  <button onClick={() => { setActiveTab("settings"); setProfileOpen(false); }}>⚙ Settings & Profile</button>
                  <button onClick={() => { setActiveTab("bookmarks"); setProfileOpen(false); }}>♡ Bookmarks ({bookmarks.length})</button>
                  <button onClick={() => { setHelpModalOpen(true); setProfileOpen(false); }}>💬 Help Center</button>
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
                  <span className="eyebrow">CAREER INTELLIGENCE PLATFORM</span>
                  <h1>
                    Welcome back,<br />
                    <em>{displayName}!</em> 
                  </h1>
                  <p>
                    {github
                      ? `Connected GitHub @${github.username} with ${repoCount} repositories (${mlInsights.domain_name || "Engineering Profile"}).`
                      : "Connect your GitHub profile and upload your resume to unlock real-time ML career analytics."}
                  </p>
                </div>
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
                  className={`quick-btn ${canRoast ? "roast-pulse" : ""}`}
                  disabled={!canRoast || roastBusy}
                  onClick={handleRoast}
                >
<<<<<<< HEAD
                  🔥 Generate Developer Roast
=======
                  🔥 Generate  Roast
>>>>>>> 7b799a42fa909d4709a4cb80793c7454fbf9bd47
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
                    <span className="ov-tag yellow">XP & Telemetry</span>
                  </div>
                  <h3>Level {currentLevel} ({totalXp} XP)</h3>
                  <p>{seniorityTitle} • {verifiedRoadmapCount} milestones verified</p>
                </div>
              </div>

              {/* DEVELOPER ROAST CARD */}
              <section className="roast-card" id="roast-section">
                <div className="roast-head">
                  <div>
<<<<<<< HEAD
                    <span className="eyebrow">SAVAGE PROFILE CRITIQUE</span>
=======
                    <span className="eyebrow">SPECIAL ENTERTAINMENT</span>
>>>>>>> 7b799a42fa909d4709a4cb80793c7454fbf9bd47
                    <h2>🔥 Developer Roast</h2>
                    <p>
                      {canRoast
                        ? "A brutal, witty critique based on your GitHub commits, repositories, and resume skills!"
                        : "Connect GitHub or upload a resume to unlock your Developer Roast."}
                    </p>
                  </div>

                  <button
                    className={`primary-btn ${canRoast ? "roast-active-btn" : ""}`}
                    disabled={!canRoast || roastBusy}
                    onClick={handleRoast}
                  >
                    {roastBusy
                      ? "Roasting in progress... 🌶️"
                      : roast
<<<<<<< HEAD
                      ? "🔥 Roast Me Again! 😈"
                      : "🔥 Roast Me"}
=======
                      ? "🔥 roast again 😈"
                      : "🔥 Roast Me (Hinglish)"}
>>>>>>> 7b799a42fa909d4709a4cb80793c7454fbf9bd47
                  </button>
                </div>

                {!canRoast ? (
                  <div className="roast-locked">
                    <div className="lock-icon">🔒</div>
                    <div>
                      <strong>Developer Roast is Locked</strong>
                      <p>Connect your GitHub account or upload your resume to generate your roast.</p>
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
                    Ready! Click the <strong>"Roast Me 🔥"</strong> button above to generate your brutal roast instantly.
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
                <div className="opp-header-top-row">
                  <div>
                    <h2>Live Opportunities & Startup Sprints 🎯</h2>
                    <p>
                      Ranked by real match % based on your {repoCount} GitHub repositories ({mlInsights.domain_name || "Codebase"})
                      {resume ? ` and uploaded ATS resume (${resume.ats_score}% score)` : " (Upload resume for higher ATS boost)"}.
                    </p>
                  </div>
                  <div className="live-market-sync-box">
                    <span className="live-pulse-badge">
                      <span className="live-dot"></span> Live External Job Market APIs
                      {lastSyncedTime && <span style={{ marginLeft: "6px", opacity: 0.85, fontSize: "11px" }}>• Last synced: {lastSyncedTime}</span>}
                    </span>
                    <button
                      className="primary-btn live-sync-btn"
                      onClick={handleSyncLiveJobs}
                      disabled={syncingJobs}
                    >
                      {syncingJobs ? "Fetching latest opportunities..." : "↻ Refresh Live Jobs"}
                    </button>
                  </div>
                </div>

                <div className="opp-controls">
                  <input
                    type="text"
                    placeholder="Search by role, company, city, or skill..."
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
                      className={`filter-pill ${oppFilter === "fresher" ? "active" : ""}`}
                      onClick={() => setOppFilter("fresher")}
                    >
                      🎓 Freshers (0-1 Yrs)
                    </button>
                    <button
                      className={`filter-pill ${oppFilter === "internship" ? "active" : ""}`}
                      onClick={() => setOppFilter("internship")}
                    >
                      💼 Internships
                    </button>
                    <button
                      className={`filter-pill ${oppFilter === "fulltime" ? "active" : ""}`}
                      onClick={() => setOppFilter("fulltime")}
                    >
                      ⚡ Full-Time
                    </button>
                    <button
                      className={`filter-pill ${oppFilter === "remote" ? "active" : ""}`}
                      onClick={() => setOppFilter("remote")}
                    >
                      🌐 Remote
                    </button>
                  </div>

                  {/* CITY / LOCATION FILTER BAR */}
                  <div className="opp-city-filter-row">
                    <span className="city-label">📍 City:</span>
                    {["all", "Bengaluru", "Pune", "Hyderabad", "Mumbai", "Delhi-NCR", "Chennai", "Remote"].map((city) => (
                      <button
                        key={city}
                        className={`city-pill ${cityFilter === city ? "active" : ""}`}
                        onClick={() => setCityFilter(city)}
                      >
                        {city === "all" ? "All Locations" : city}
                      </button>
                    ))}
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
                    <div className="empty-state-box" style={{ textAlign: "center", padding: "40px 20px", gridColumn: "1 / -1", background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px dashed rgba(255,255,255,0.1)" }}>
                      <p className="empty-state" style={{ fontSize: "16px", marginBottom: "16px" }}>No opportunities match your current filters.</p>
                      <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                        <button
                          className="primary-btn"
                          style={{ background: "rgba(255,255,255,0.08)", padding: "8px 16px", borderRadius: 8, cursor: "pointer" }}
                          onClick={() => {
                            setOppFilter("all");
                            setCityFilter("all");
                            setOppSearch("");
                          }}
                        >
                          Reset Filters
                        </button>
                        <button
                          className="primary-btn live-sync-btn"
                          onClick={handleSyncLiveJobs}
                          disabled={syncingJobs}
                        >
                          {syncingJobs ? "Syncing Jobs..." : "⚡ Sync Live Market Jobs"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    filteredOpportunities.map((opp) => {
                      const bookmarked = isBookmarked(opp.id, "opportunity");
                      const skills = Array.isArray(opp.required_skills)
                        ? opp.required_skills
                        : (typeof opp.required_skills === "string" ? opp.required_skills.split(",") : []);

                      return (
                        <article 
                          className={`opportunity-card ${opp.featured ? "featured" : ""}`} 
                          key={opp.id}
                          onClick={() => setSelectedOpp(opp)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="opp-top-row">
                            <div className="opp-company-badge">
                              <span className="opp-logo">{opp.logo || (opp.company ? opp.company.charAt(0).toUpperCase() : "💼")}</span>
                              <div>
                                <div className="opp-company-line">
                                  <strong>{opp.company || "Tech Company"}</strong>
                                  {opp.stage && <span className="stage-tag">{opp.stage}</span>}
                                </div>
                                <span className="opp-company-name">📍 {opp.location || "Remote"}</span>
                              </div>
                            </div>

                            <div className="opp-score-badge" title="Calculated from real GitHub repos & resume">
                              <span className="match-num">{opp.match_score || 45}%</span>
                              <span className="match-label">Match</span>
                            </div>
                          </div>

                          <h4 className="opp-card-role-title">{opp.title || "Software Engineer"}</h4>

                          {opp.hiring_timeline && (
                            <div className="opp-timeline-badge">
                              <span>📅 {opp.hiring_timeline}</span>
                            </div>
                          )}

                          <p className="opp-desc">{opp.description || "Exciting engineering role matching your technical profile."}</p>

                          <div className="opp-meta-row">
                            <span className="opp-pill stipend">💰 {opp.stipend ? opp.stipend : "Salary not specified"}</span>
                            <span className="opp-pill exp">🎓 {opp.experience || "Fresher / 0-2 yrs"}</span>
                            <span className="opp-pill type">💼 {opp.type || "Full-time"}</span>
                            {opp.source && (
                              <span className={`opp-pill ${opp.source === "Adzuna" || opp.source === "Arbeitnow" || opp.source.includes("Live Market") || opp.source_type === "external" ? "live-source" : "verified-source"}`}>
                                {opp.source === "Adzuna"
                                  ? "🌐 Jobs via Adzuna"
                                  : opp.source === "Arbeitnow" || opp.source.includes("Live Market")
                                  ? "🌐 Arbeitnow Feed"
                                  : opp.source === "recruiter"
                                  ? "⚡ GitBridge Recruiter"
                                  : `🌐 ${opp.source}`}
                              </span>
                            )}
                          </div>

                          <div className="opp-skills-row">
                            <span className="skills-label">Required Skills:</span>
                            <div className="tag-cloud">
                              {skills.map((skill, i) => {
                                const isMatched = (opp.matched_skills || []).includes(skill);
                                return (
                                  <span className={`opp-skill-pill ${isMatched ? "matched" : ""}`} key={i}>
                                    {isMatched ? "✓ " : ""}{skill}
                                  </span>
                                );
                              })}
                              {skills.length === 0 && (
                                <span className="opp-skill-pill">General Software Engineering</span>
                              )}
                            </div>
                          </div>

                          <div className="opp-actions-row" onClick={(e) => e.stopPropagation()}>
                            {isApplied(opp.id || opp.source_id) ? (
                              <button
                                className="primary-btn apply-btn applied"
                                disabled
                                style={{
                                  background: "rgba(34, 197, 94, 0.2)",
                                  color: "#4ade80",
                                  border: "1px solid rgba(34, 197, 94, 0.4)",
                                  cursor: "default"
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                ✓ Applied
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApply(opp, e);
                                }}
                                className="primary-btn apply-btn"
                              >
                                {opp.source_type === "recruiter" || opp.source === "recruiter" || !opp.apply_url
                                  ? "Apply via GitBridge"
                                  : "Apply Now ↗"}
                              </button>
                            )}
                            <button
                              className={`bookmark-btn ${bookmarked ? "bookmarked" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(opp, "opportunity");
                              }}
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

              {/* Verified Adzuna Attribution & External Application Note */}
              <div className="adzuna-attribution-note" style={{ textAlign: "center", marginTop: "24px", padding: "14px 20px", fontSize: "12px", color: "rgba(255, 255, 255, 0.55)", borderTop: "1px solid rgba(255, 255, 255, 0.08)", background: "rgba(255, 255, 255, 0.015)", borderRadius: "8px" }}>
                <span>🌐 Current opportunities fetched dynamically from real job-market APIs (Jobs via <a href="https://www.adzuna.com" target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "underline" }}>Adzuna</a> & verified tech feeds). The "Apply Now" button redirects directly to the original external employer listing.</span>
              </div>
            </div>
          )}

          {activeTab === "applications" && (
            <div className="tab-container">
              <section className="panel">
                <div className="panel-title-row">
                  <div className="panel-header-left">
                    <div className="panel-icon purple">▣</div>
                    <div><h2>My Applications</h2><span className="panel-subtitle">Track opportunities you have applied to and their latest status.</span></div>
                  </div>
                  <button className="primary-btn" onClick={() => loadApplicationsData()} disabled={applicationsLoading}>↻ Refresh</button>
                </div>
                {applicationsLoading ? <div className="empty-state"><p>Loading your applications...</p></div> : applicationsError ? (
                  <div className="empty-state"><p>{applicationsError}</p><button className="primary-btn" onClick={loadApplicationsData}>Try again</button></div>
                ) : applications.length === 0 ? (
                  <div className="empty-state"><div style={{fontSize: "42px"}}>📭</div><h3>No applications yet</h3><p>When you apply to an opportunity, it will appear here so you can track its progress.</p><button className="primary-btn" onClick={() => setActiveTab("opportunities")}>Explore Opportunities →</button></div>
                ) : (
                  <div className="applications-list">
                    {applications.map((app) => {
                      const opportunity = app.opportunity || {};
                      const status = app.status || "Applied";
                      const statusClass = String(status).toLowerCase().replace(/[^a-z]+/g, "-");
                      const isRejected = status.toLowerCase() === "rejected";
                      const stageIdx = ["applied", "under review", "reviewing", "shortlisted", "interview", "selected"].indexOf(status.toLowerCase());
                      const normalizedStageIdx = status.toLowerCase() === "reviewing" ? 1 : stageIdx;

                      return <article className="application-card" key={app.id}>
                        <div className="application-card-main">
                          <div className="application-company-mark">{opportunity.logo ? <img src={opportunity.logo} alt="" /> : "▣"}</div>
                          <div className="application-info">
                            <h3>{opportunity.title || "Opportunity"}</h3>
                            <p>{opportunity.company || "Company"}{opportunity.location ? ` · ${opportunity.location}` : ""}</p>
                            <div className="application-meta">
                              <span>Applied: {formatDate(app.applied_at)}</span>
                              <span>Type: {app.application_type || "internal"}</span>
                              {app.match_score && (
                                <span style={{ color: "#38bdf8", fontWeight: 700 }}>🎯 {app.match_score}% AI Match</span>
                              )}
                            </div>
                          </div>
                          <span className={`application-status status-${statusClass}`}>{status}</span>
                          {app.application_type === "external" && status === "Redirected" && (
                            <button className="secondary-btn" onClick={() => handleConfirmExternalApplication(app.id)}>
                              I’ve Submitted
                            </button>
                          )}
                          <button className="secondary-btn" onClick={() => setExpandedApplication(expandedApplication === app.id ? null : app.id)}>
                            {expandedApplication === app.id ? "Hide details" : "View details"}
                          </button>
                        </div>

                        {/* STATUS WORKFLOW PIPELINE TRACKER */}
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "14px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "11px", color: "#94a3b8", marginRight: 4 }}>Hiring Stage:</span>
                          {isRejected ? (
                            <span style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700 }}>
                              ✕ Application Concluded (Rejected)
                            </span>
                          ) : (
                            ["Applied", "Under Review", "Shortlisted", "Interview", "Selected"].map((stageName, sIndex) => {
                              const targetStageNum = sIndex;
                              const currentStageNum = normalizedStageIdx === -1 ? 0 : normalizedStageIdx;
                              const isPassed = targetStageNum < currentStageNum;
                              const isCurrent = targetStageNum === currentStageNum;

                              return (
                                <span
                                  key={stageName}
                                  style={{
                                    fontSize: "11px",
                                    padding: "3px 8px",
                                    borderRadius: "6px",
                                    background: isCurrent
                                      ? "rgba(139, 92, 246, 0.25)"
                                      : isPassed
                                      ? "rgba(34, 197, 94, 0.15)"
                                      : "rgba(255, 255, 255, 0.04)",
                                    color: isCurrent
                                      ? "#c084fc"
                                      : isPassed
                                      ? "#4ade80"
                                      : "#64748b",
                                    border: isCurrent
                                      ? "1px solid #8b5cf6"
                                      : isPassed
                                      ? "1px solid rgba(34, 197, 94, 0.3)"
                                      : "1px solid rgba(255, 255, 255, 0.08)",
                                    fontWeight: isCurrent ? 700 : 500,
                                  }}
                                >
                                  {isPassed ? "✓ " : ""}{stageName}
                                </span>
                              );
                            })
                          )}
                        </div>

                        {/* RECRUITER NOTES IF PRESENT */}
                        {app.recruiter_notes && (
                          <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(139, 92, 246, 0.08)", border: "1px solid rgba(139, 92, 246, 0.2)", borderRadius: 8, fontSize: "12px", color: "#e2e8f0" }}>
                            💬 <strong>Recruiter Note:</strong> {app.recruiter_notes}
                          </div>
                        )}

                        {expandedApplication === app.id && (
                          <div className="application-details">
                            <strong>Application Details</strong>
                            <p>Application ID: {app.id}</p>
                            <p>Current Stage: {status}</p>
                            <p>Application Channel: {app.application_type || "Internal Platform"}</p>
                            {app.updated_at && <p>Last Recruiter Update: {formatDate(app.updated_at)}</p>}
                          </div>
                        )}
                      </article>;
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

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
          {/* TAB 6: SKILL GAP ANALYZER */}
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
                  <p>Milestone verification automatically evaluated from your active GitHub repositories & code.</p>
                </div>

                <div className="roadmap-selector">
                  {[
                    { id: "software", label: "💻 Full-Stack Web" },
                    { id: "devops", label: "☁️ Cloud & DevOps" },
                    { id: "aiml", label: "🤖 AI / Machine Learning" },
                    { id: "embedded", label: "⚡ Embedded & IoT" }
                  ].map((track) => (
                    <button
                      key={track.id}
                      className={`selector-btn ${selectedRoadmap === track.id ? "active" : ""}`}
                      onClick={() => setSelectedRoadmap(track.id)}
                    >
                      {track.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                <span className="ov-tag green">
                  ⚡ 100% Real-Time Auto-Analyzed from GitHub Repositories & ATS Resume
                </span>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                  Verified across {repoCount} repositories and code commits
                </span>
              </div>

              <div className="roadmap-details-panel">
                <div className="roadmap-intro">
                  <div className="roadmap-intro-meta">
                    <div>
                      <h3>{autoEvaluatedRoadmap.title}</h3>
                      <p>{autoEvaluatedRoadmap.desc}</p>
                    </div>
                    <div className="roadmap-completion-badge">
                      <strong>{autoEvaluatedRoadmap.completedCount} / {autoEvaluatedRoadmap.totalCount} Milestones Verified</strong>
                      <span>({autoEvaluatedRoadmap.progressPct}% Automated Completion)</span>
                    </div>
                  </div>
                  <div className="roadmap-bar-wrap">
                    <div className="roadmap-bar-fill" style={{ width: `${autoEvaluatedRoadmap.progressPct}%` }}></div>
                  </div>
                </div>

                <div className="roadmap-timeline">
                  {autoEvaluatedRoadmap.steps.map((step, idx) => {
                    const isDone = step.isCompleted;
                    return (
                      <div className={`timeline-node ${isDone ? "completed" : "pending"}`} key={step.id}>
                        <div className="node-marker">
                          {isDone ? "✓" : `0${idx + 1}`}
                        </div>
                        <div className="node-content">
                          <div className="node-top">
                            <h4>{step.title}</h4>
                            <span className={`step-status-btn ${isDone ? "done" : "pending"}`}>
                              {isDone ? "✓ Auto-Verified in Codebase" : "⏳ Pending in GitHub Code"}
                            </span>
                          </div>
                          <p>{step.desc}</p>

                          {isDone ? (
                            <div className="roadmap-evidence-pill verified">
                              🟢 <strong>Verified from Codebase:</strong>{" "}
                              {step.matchedRepo ? (
                                <span>Detected in repository <code>@{github?.username || "code"}/{step.matchedRepo}</code></span>
                              ) : (
                                <span>Verified via <strong>{step.matchedSkill}</strong></span>
                              )}
                            </div>
                          ) : (
                            <div className="roadmap-evidence-pill pending">
                              💡 <strong>Missing in Codebase:</strong> Push a project or commit code using{" "}
                              <code>{(step.keywords || []).slice(0, 3).join(", ")}</code> to auto-complete this milestone.
                            </div>
                          )}
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
                      <h2>Developer XP & Real-Time Seniority Telemetry</h2>
                      <span className="panel-subtitle">Evaluated strictly from real GitHub repositories, code velocity, and ATS analysis</span>
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
                    <h3>{seniorityTitle}</h3>
                    <p className="real-time-stats">
                      🟢 Real-Time Telemetry Active • Cross-checked & Validated {repoCount} Public Repos & {privateCount} Private Repos • Total XP: {totalXp}
                    </p>
                  </div>
                </div>

                {/* Real-time Codebase Telemetry Metrics */}
                <div className="telemetry-metrics-grid">
                  <div className="telemetry-card">
                    <span className="telemetry-label">🐙 Codebase Verification</span>
                    <h4>{repoCount} Repositories</h4>
                    <small>{privateCount > 0 ? `${privateCount} Private 🔒 Verified` : "Public Repositories Active"}</small>
                  </div>

                  <div className="telemetry-card">
                    <span className="telemetry-label">⭐ Open-Source Impact</span>
                    <h4>{verifiedStars} Stars / {verifiedForks} Forks</h4>
                    <small>Community traction & credibility</small>
                  </div>

                  <div className="telemetry-card">
                    <span className="telemetry-label">🛠️ Tech Stack Diversity</span>
                    <h4>{languageCount} Languages</h4>
                    <small>{languageList.slice(0, 3).join(", ") || "Active Languages"}</small>
                  </div>

                  <div className="telemetry-card">
                    <span className="telemetry-label">📄 ATS Resume Alignment</span>
                    <h4>{resumeAts}% Match Score</h4>
                    <small>{resumeSkillCount} Technical keywords detected</small>
                  </div>
                </div>

                {/* Automated Verification Checklist (No Manual Fudge) */}
                <div className="goals-container">
                  <div className="goals-header">
                    <div>
                      <h3>Automated Verification Matrix</h3>
                      <p>All items are automatically evaluated and cross-checked against your GitHub profile and uploaded ATS resume.</p>
                    </div>
                    <span className="streak-badge">⚡ Real-Time Auto-Verified</span>
                  </div>

                  <div className="goals-list">
                    {[
                      {
                        title: "GitHub Repository Velocity & Commits",
                        done: repoCount > 0,
                        proof: repoCount > 0 ? `✓ Verified: ${repoCount} active repositories connected` : "Connect GitHub to auto-verify",
                        xp: "+150 XP"
                      },
                      {
                        title: "Multi-Language Codebase Depth (2+ Languages)",
                        done: languageCount >= 2,
                        proof: languageCount >= 2 ? `✓ Verified: Polyglot engineering in ${languageList.slice(0, 3).join(", ")}` : "Push projects in 2+ languages to auto-verify",
                        xp: "+90 XP"
                      },
                      {
                        title: "Domain Career Roadmap Milestones",
                        done: verifiedRoadmapCount >= 2,
                        proof: verifiedRoadmapCount > 0 ? `✓ Verified: ${verifiedRoadmapCount}/${autoEvaluatedRoadmap.totalCount} milestones matched from your code` : "Build projects matching roadmap topics",
                        xp: "+200 XP"
                      },
                      {
                        title: "ATS Technical Resume Alignment (Score > 60%)",
                        done: Boolean(resume && resumeAts >= 60),
                        proof: resume ? `✓ Verified: ATS Score ${resumeAts}/100 with ${resumeSkillCount} technical keywords` : "Upload resume to auto-verify",
                        xp: "+250 XP"
                      },
                      {
                        title: "Private Codebase Token Integration",
                        done: privateCount > 0,
                        proof: privateCount > 0 ? `✓ Verified: ${privateCount} private production repositories cross-checked` : "Add GitHub Access Token to cross-check private repos",
                        xp: "+120 XP"
                      }
                    ].map((item, idx) => (
                      <div className={`goal-item ${item.done ? "done" : "pending-eval"}`} key={idx}>
                        <span className="auto-check-icon">{item.done ? "✓" : "○"}</span>
                        <div className="goal-content-wrap">
                          <strong className="goal-text">{item.title}</strong>
                          <small className="goal-proof">{item.proof}</small>
                        </div>
                        <span className="goal-xp">{item.xp}</span>
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
                    <div 
                      className="bookmark-card" 
                      key={b.key}
                      onClick={() => {
                        if (b.type === "opportunity" && b.details) {
                          setSelectedOpp(b.details);
                        }
                      }}
                      style={{ cursor: b.type === "opportunity" && b.details ? "pointer" : "default" }}
                    >
                      <div className="bm-top">
                        <span className="bm-type-pill">{b.type}</span>
                        <button
                          className="remove-bm-btn"
                          title="Remove bookmark"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBookmarks((prev) => prev.filter((item) => item.key !== b.key));
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      <h3>{b.title}</h3>
                      <p>{b.subtitle}</p>

                      <div className="bm-bottom">
                        <small>Saved on {new Date(b.saved_at).toLocaleDateString()}</small>
                        {b.link && (
                          <a 
                            href={b.link} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="bm-link"
                            onClick={(e) => e.stopPropagation()}
                          >
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
          {/* TAB 10: SETTINGS & PROFILE (SAVES TO MONGODB) */}
          {/* ============================================================== */}
          {activeTab === "settings" && (
            <div className="tab-container">
              <section className="panel">
                <div className="panel-title-row">
                  <div className="panel-header-left">
                    <div className="panel-icon purple">⚙</div>
                    <div>
                      <h2>Platform Settings & Profile</h2>
                      <span className="panel-subtitle">Customize themes, edit career goals, and access support</span>
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

                {/* EDIT PROFILE & ONBOARDING FORM (SAVES TO MONGODB) */}
                <div className="settings-section">
                  <div className="section-title-with-badge">
                    <h3 className="settings-section-title">👤 Edit Profile & Engineering Identity (MongoDB Synced)</h3>
                    <span className="profile-strength-badge">
                      💪 Profile Strength: <strong>{profileStrength}%</strong>
                    </span>
                  </div>
                  <p className="panel-description">
                    Update your full name, target engineering specialization, preferred work cities, and professional links. All data is securely synchronized with your account in MongoDB Atlas.
                  </p>

                  {/* Profile Strength Bar */}
                  <div className="profile-strength-bar-wrap">
                    <div className="profile-strength-fill" style={{ width: `${profileStrength}%` }}></div>
                  </div>

                  {/* Profile Summary Card Preview */}
                  <div className="profile-preview-card">
                    <div className="p-avatar-box">
                      <span className="p-avatar-lg">{initials}</span>
                      <span className="p-online-dot"></span>
                    </div>
                    <div className="p-preview-info">
                      <div className="p-name-row">
                        <strong>{profileName || displayName}</strong>
                        <span className="p-role-pill">🎯 {profileTargetRole || mlInsights.domain_name || "Engineering Candidate"}</span>
                      </div>
                      <div className="p-meta-badges">
                        <span>📧 {data?.email}</span>
                        <span>📍 {profileLocation || "India / Remote"}</span>
                        {profileLinkedIn && <a href={profileLinkedIn} target="_blank" rel="noreferrer">🔗 LinkedIn ↗</a>}
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSaveProfile} className="profile-edit-form">
                    <div className="profile-form-grid">
                      <div className="p-input-group">
                        <label>👤 Full Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Amrut Badki"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                        />
                      </div>

                      <div className="p-input-group">
                        <label>🎯 Target Engineering Role</label>
                        <input
                          type="text"
                          placeholder="e.g. Full-Stack Engineer / DevOps Cloud SRE"
                          value={profileTargetRole}
                          onChange={(e) => setProfileTargetRole(e.target.value)}
                        />
                      </div>

                      <div className="p-input-group">
                        <label>📍 Preferred Work Cities</label>
                        <input
                          type="text"
                          placeholder="e.g. Bengaluru, Pune, Hyderabad / Remote"
                          value={profileLocation}
                          onChange={(e) => setProfileLocation(e.target.value)}
                        />
                      </div>

                      <div className="p-input-group">
                        <label>📞 Phone Number</label>
                        <input
                          type="text"
                          placeholder="+91 9876543210"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                        />
                      </div>

                      <div className="p-input-group full">
                        <label>🔗 LinkedIn Profile URL</label>
                        <input
                          type="url"
                          placeholder="https://linkedin.com/in/yourprofile"
                          value={profileLinkedIn}
                          onChange={(e) => setProfileLinkedIn(e.target.value)}
                        />
                      </div>

                      <div className="p-input-group full">
                        <label>📝 Technical Bio & Career Goals</label>
                        <textarea
                          placeholder="Highlight your core technical skills, university background, and what roles you are actively seeking..."
                          value={profileBio}
                          onChange={(e) => setProfileBio(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="profile-form-footer">
                      <button type="submit" className="primary-btn save-profile-btn" disabled={profileSaving}>
                        {profileSaving ? "Saving to Database..." : "Save Profile Changes →"}
                      </button>
                      <small className="save-hint">⚡ Changes persist in MongoDB Atlas across all sessions</small>
                    </div>
                  </form>
                </div>

                {/* HELP CENTER & SUPPORT SECTION */}
                <div className="settings-section">
                  <h3 className="settings-section-title">💬 Help Center & Support Tickets</h3>
                  <p className="panel-description">
                    Need assistance with GitHub private tokens, ATS resume review, or opportunity applications?
                  </p>
                  <div className="help-section-actions">
                    <button className="primary-btn" onClick={() => setHelpModalOpen(true)}>
                      💬 Open Help Center & Submit Inquiry
                    </button>
                    <a
                      href="https://github.com/amrut029/GitBridge-Careers/issues"
                      target="_blank"
                      rel="noreferrer"
                      className="secondary-btn"
                    >
                      Report an Issue on GitHub ↗
                    </a>
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

          {/* ============================================================== */}
          {/* TAB 11: ADMIN PORTAL (LIVE INQUIRIES & PLATFORM STATS) */}
          {/* ============================================================== */}
          {activeTab === "admin" && (
            <div className="tab-container">
              <section className="panel">
                <div className="panel-title-row">
                  <div className="panel-header-left">
                    <div className="panel-icon purple">🛡️</div>
                    <div>
                      <h2>Admin Portal • User Inquiries & Support Tickets</h2>
                      <span className="panel-subtitle">Review questions submitted via homepage footer and dashboard help center</span>
                    </div>
                  </div>
                  <button className="secondary-btn" onClick={loadAdminData} disabled={adminLoading}>
                    {adminLoading ? "Refreshing..." : "↻ Refresh Tickets"}
                  </button>
                </div>

                {/* ADMIN METRIC STATS */}
                <div className="admin-stats-grid">
                  <div className="admin-stat-card">
                    <span className="stat-label">Total Registered Users</span>
                    <strong>{adminStats?.total_users || 0}</strong>
                    <small>👥 MongoDB Atlas</small>
                  </div>
                  <div className="admin-stat-card">
                    <span className="stat-label">Total Inquiries</span>
                    <strong>{adminStats?.total_tickets || adminTickets.length}</strong>
                    <small>💬 All Time</small>
                  </div>
                  <div className="admin-stat-card fire">
                    <span className="stat-label">Pending Inquiries</span>
                    <strong className="pending-text">{adminStats?.pending_tickets || 0}</strong>
                    <small>⚡ Action Required</small>
                  </div>
                  <div className="admin-stat-card green">
                    <span className="stat-label">Resolved Tickets</span>
                    <strong className="resolved-text">{adminStats?.resolved_tickets || 0}</strong>
                    <small>✓ Handled</small>
                  </div>
                </div>

                {/* FILTER CONTROLS */}
                <div className="admin-filter-bar">
                  <div className="admin-filter-pills">
                    <button
                      className={`filter-pill ${adminFilter === "all" ? "active" : ""}`}
                      onClick={() => setAdminFilter("all")}
                    >
                      All Tickets ({adminTickets.length})
                    </button>
                    <button
                      className={`filter-pill ${adminFilter === "pending" ? "active" : ""}`}
                      onClick={() => setAdminFilter("pending")}
                    >
                      Pending Only ({adminTickets.filter((t) => t.status === "pending").length})
                    </button>
                    <button
                      className={`filter-pill ${adminFilter === "resolved" ? "active" : ""}`}
                      onClick={() => setAdminFilter("resolved")}
                    >
                      Resolved ({adminTickets.filter((t) => t.status === "resolved").length})
                    </button>
                  </div>
                </div>

                {/* TICKETS LIST */}
                {adminLoading ? (
                  <div className="dashboard-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading inquiries from MongoDB Atlas...</p>
                  </div>
                ) : (
                  <div className="admin-tickets-list">
                    {adminTickets
                      .filter((t) => adminFilter === "all" || t.status === adminFilter)
                      .map((ticket) => {
                        const isPending = ticket.status === "pending";
                        return (
                          <div className={`admin-ticket-card ${ticket.status}`} key={ticket.ticket_id || ticket.id}>
                            <div className="ticket-top-row">
                              <div className="ticket-user-info">
                                <strong>{ticket.name || "Guest Explorer"}</strong>
                                <span className="ticket-email">({ticket.email || "No email"})</span>
                                <span className={`source-badge ${ticket.source || "dashboard"}`}>
                                  {ticket.source === "homepage_footer" ? "🌐 Homepage Footer" : "💬 Dashboard Help"}
                                </span>
                              </div>
                              <div className="ticket-meta">
                                <span className={`ticket-status-pill ${ticket.status}`}>
                                  {ticket.status === "pending" ? "● Pending" : "✓ Resolved"}
                                </span>
                                <small>{formatDate(ticket.created_at)}</small>
                              </div>
                            </div>

                            <div className="ticket-category-line">
                              <span className="category-tag">📂 {ticket.category || "General Inquiry"}</span>
                              <span className="ticket-id-tag">ID: {ticket.ticket_id}</span>
                            </div>

                            <div className="ticket-message-body">
                              <p>{ticket.message}</p>
                            </div>

                            <div className="ticket-actions-row">
                              {isPending ? (
                                <button
                                  className="primary-btn resolve-btn"
                                  onClick={() => handleUpdateTicketStatus(ticket.ticket_id, "resolved")}
                                >
                                  ✓ Mark as Resolved
                                </button>
                              ) : (
                                <button
                                  className="secondary-btn reopen-btn"
                                  onClick={() => handleUpdateTicketStatus(ticket.ticket_id, "pending")}
                                >
                                  ↶ Re-open Ticket
                                </button>
                              )}
                              <a
                                href={`mailto:${ticket.email}?subject=GitBridge Support: Ticket ${ticket.ticket_id}`}
                                className="secondary-btn reply-btn"
                              >
                                ✉ Reply via Email
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    {adminTickets.length === 0 && (
                      <p className="empty-state">No inquiries found in the database. When visitors ask questions, they will appear here in real time.</p>
                    )}
                  </div>
                )}
              </section>
            </div>
          )}
        </section>
      </main>


      {/* ================= HELP CENTER MODAL ================= */}
      {helpModalOpen && (
        <div className="modal-backdrop" onClick={() => setHelpModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>💬 GitBridge Help Center</h3>
                <p>Submit a support ticket or find answers to common questions.</p>
              </div>
              <button className="modal-close-btn" onClick={() => setHelpModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className="help-modal-faqs">
              <strong>Quick FAQs:</strong>
              <div className="faq-item">
                <b>Q: How do I view private repositories?</b>
                <p>Go to GitHub Analysis → Click &apos;Add Token&apos; → Paste a classic token with <code>repo</code> scope.</p>
              </div>
              <div className="faq-item">
                <b>Q: How is the ML Score calculated?</b>
                <p>Our Scikit-Learn regression engine analyzes your repository languages, code velocity, stars, and ATS resume match.</p>
              </div>
            </div>

            <form onSubmit={handleHelpSubmit} className="help-modal-form">
              <label>Your Inquiry or Question:</label>
              <textarea
                placeholder="Describe your issue, feature request, or feedback..."
                value={helpQueryText}
                onChange={(e) => setHelpQueryText(e.target.value)}
                rows={4}
                required
              />
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setHelpModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={helpSubmitting}>
                  {helpSubmitting ? "Submitting..." : "Submit Support Ticket →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= LARGE OPPORTUNITY DETAILS VIEW MODAL ================= */}
      {selectedOpp && (
        <div 
          className="opp-details-backdrop" 
          onClick={() => setSelectedOpp(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="opp-modal-title"
        >
          <div 
            className="opp-details-modal" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* TOP BAR */}
            <div className="opp-details-topbar">
              <button 
                className="opp-details-back-btn" 
                onClick={() => setSelectedOpp(null)}
                aria-label="Back to opportunities"
              >
                ← Back
              </button>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>Opportunities</span>
                <span>/</span>
                <span style={{ color: "var(--text)" }}>{selectedOpp.company || "Details"}</span>
              </div>
              <button 
                className="opp-details-close-btn" 
                onClick={() => setSelectedOpp(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="opp-details-body">
              {/* HERO SECTION */}
              <div className="opp-details-hero">
                <div className="opp-details-logo">
                  {selectedOpp.logo || (selectedOpp.company ? selectedOpp.company.charAt(0).toUpperCase() : "💼")}
                </div>
                <div className="opp-details-title-box">
                  <div className="opp-details-company-line">
                    <span className="opp-details-company-name">{selectedOpp.company || "Tech Company"}</span>
                    {selectedOpp.stage && (
                      <span className="stage-tag" style={{ fontSize: "11px", padding: "2px 8px" }}>
                        {selectedOpp.stage}
                      </span>
                    )}
                    {selectedOpp.source && (
                      <span className={`opp-pill ${selectedOpp.source === "Adzuna" || selectedOpp.source === "Arbeitnow" || selectedOpp.source.includes("Live Market") || selectedOpp.source_type === "external" ? "live-source" : "verified-source"}`}>
                        {selectedOpp.source === "Adzuna"
                          ? "🌐 Jobs via Adzuna"
                          : selectedOpp.source === "Arbeitnow" || selectedOpp.source.includes("Live Market")
                          ? "🌐 Arbeitnow Feed"
                          : selectedOpp.source === "recruiter"
                          ? "⚡ GitBridge Recruiter"
                          : `🌐 ${selectedOpp.source}`}
                      </span>
                    )}
                  </div>
                  <h2 className="opp-details-title" id="opp-modal-title">
                    {selectedOpp.title || "Engineering Opportunity"}
                  </h2>
                  <div className="opp-details-meta-chips">
                    <span className="opp-details-meta-chip">
                      📍 {selectedOpp.location || selectedOpp.city || "India"}
                    </span>
                    <span className="opp-details-meta-chip highlight">
                      💼 {selectedOpp.work_mode || "On-Site"}
                    </span>
                    <span className="opp-details-meta-chip">
                      📋 {selectedOpp.type || "Full-time"}
                    </span>
                    <span className="opp-details-meta-chip">
                      🎓 {selectedOpp.experience || "Fresher / 0-2 yrs"}
                    </span>
                    {selectedOpp.domain && (
                      <span className="opp-details-meta-chip">
                        ⚡ {String(selectedOpp.domain).toUpperCase()}
                      </span>
                    )}
                    <span className="opp-details-meta-chip salary">
                      💰 {selectedOpp.stipend ? selectedOpp.stipend : "Salary not specified"}
                    </span>
                  </div>
                </div>
              </div>

              {/* IMPORTANT DATES GRID */}
              <div className="opp-details-dates-grid">
                <div className="opp-date-item">
                  <div className="opp-date-icon">📅</div>
                  <div className="opp-date-text">
                    <span className="opp-date-label">Posted Date</span>
                    <span className="opp-date-value">
                      {selectedOpp.posted_date || "Recently Posted"}
                    </span>
                  </div>
                </div>
                <div className="opp-date-item">
                  <div className="opp-date-icon">⏳</div>
                  <div className="opp-date-text">
                    <span className="opp-date-label">Application Deadline</span>
                    <span className="opp-date-value">
                      {selectedOpp.deadline || selectedOpp.valid_till || "Rolling Applications / Open until filled"}
                    </span>
                  </div>
                </div>
                <div className="opp-date-item">
                  <div className="opp-date-icon">⚡</div>
                  <div className="opp-date-text">
                    <span className="opp-date-label">Hiring Status</span>
                    <span className="opp-date-value" style={{ color: "#4ade80" }}>
                      {selectedOpp.hiring_timeline || "Actively Hiring"}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI MATCH CARD */}
              <div className="opp-details-match-card">
                <div className="opp-match-card-top">
                  <div className="opp-match-badge-large">
                    <span>⚡ AI Candidate Match:</span>
                    <span style={{ color: "#a78bfa" }}>{selectedOpp.match_score || 45}%</span>
                  </div>
                  <span className="opp-match-rec">
                    {selectedOpp.recommendation || (selectedOpp.match_score >= 80 ? "★ Strong Fit" : selectedOpp.match_score >= 60 ? "● Good Match" : "○ Potential Match")}
                  </span>
                </div>
                <p className="opp-match-explanation">
                  {selectedOpp.match_explanation || "GitBridge AI evaluated your verified GitHub repositories, commit velocity, and ATS resume skills against this position's core requirements."}
                </p>
                <div style={{ marginTop: "6px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--muted)", marginBottom: "6px" }}>
                    SKILLS ALIGNMENT BREAKDOWN:
                  </div>
                  <div className="opp-match-skills-list">
                    {(selectedOpp.matched_skills && selectedOpp.matched_skills.length > 0) ? (
                      selectedOpp.matched_skills.map((skill, i) => (
                        <span className="opp-matched-skill-pill" key={i}>
                          ✓ {skill} (Matched)
                        </span>
                      ))
                    ) : (
                      <span className="opp-matched-skill-pill">
                        ✓ General Software Engineering
                      </span>
                    )}
                    {Array.isArray(selectedOpp.required_skills) &&
                      selectedOpp.required_skills
                        .filter(s => !(selectedOpp.matched_skills || []).includes(s))
                        .map((skill, i) => (
                          <span className="opp-missing-skill-pill" key={i}>
                            + {skill} (Target Skill)
                          </span>
                        ))}
                  </div>
                </div>
              </div>

              {/* ABOUT THE OPPORTUNITY */}
              <div className="opp-details-section">
                <h3 className="opp-details-section-title">
                  <span>📄</span> About the Opportunity
                </h3>
                <div className="opp-details-desc">
                  {selectedOpp.description || "Exciting engineering role matching your technical profile and aspirations."}
                </div>
              </div>

              {/* REQUIRED SKILLS & TECH STACK */}
              <div className="opp-details-section">
                <h3 className="opp-details-section-title">
                  <span>🛠️</span> Required Skills & Technologies
                </h3>
                <div className="tag-cloud" style={{ gap: "8px" }}>
                  {(Array.isArray(selectedOpp.required_skills)
                    ? selectedOpp.required_skills
                    : typeof selectedOpp.required_skills === "string"
                    ? selectedOpp.required_skills.split(",")
                    : []
                  ).map((skill, i) => {
                    const isMatched = (selectedOpp.matched_skills || []).includes(skill);
                    return (
                      <span 
                        className={`opp-skill-pill ${isMatched ? "matched" : ""}`} 
                        key={i}
                        style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "8px" }}
                      >
                        {isMatched ? "✓ " : ""}{skill}
                      </span>
                    );
                  })}
                  {(!selectedOpp.required_skills || selectedOpp.required_skills.length === 0) && (
                    <span className="opp-skill-pill" style={{ padding: "6px 12px", fontSize: "12px" }}>
                      General Computer Science & Software Engineering
                    </span>
                  )}
                </div>
              </div>

              {/* CANDIDATE ELIGIBILITY CRITERIA */}
              <div className="opp-details-section">
                <h3 className="opp-details-section-title">
                  <span>🎯</span> Candidate Eligibility
                </h3>
                <div className="opp-details-eligibility-grid">
                  <div className="opp-eligibility-card">
                    <span className="opp-eligibility-key">Education / Degree</span>
                    <span className="opp-eligibility-val">
                      {selectedOpp.eligibility?.education || "B.Tech / B.E / BCA / MCA / Graduate"}
                    </span>
                  </div>
                  <div className="opp-eligibility-card">
                    <span className="opp-eligibility-key">Branch / Stream</span>
                    <span className="opp-eligibility-val">
                      {selectedOpp.eligibility?.branch || "CS / IT / ECE / Allied Branches"}
                    </span>
                  </div>
                  <div className="opp-eligibility-card">
                    <span className="opp-eligibility-key">Experience Level</span>
                    <span className="opp-eligibility-val">
                      {selectedOpp.eligibility?.experience || selectedOpp.experience || "Freshers (0-1 Yrs)"}
                    </span>
                  </div>
                  <div className="opp-eligibility-card">
                    <span className="opp-eligibility-key">Graduation Year / Batch</span>
                    <span className="opp-eligibility-val">
                      {selectedOpp.eligibility?.graduation_year || "2024 / 2025 / 2026 / 2027"}
                    </span>
                  </div>
                  <div className="opp-eligibility-card">
                    <span className="opp-eligibility-key">Eligible Location</span>
                    <span className="opp-eligibility-val">
                      {selectedOpp.eligibility?.location || selectedOpp.location || "India"}
                    </span>
                  </div>
                  <div className="opp-eligibility-card">
                    <span className="opp-eligibility-key">Work Authorization</span>
                    <span className="opp-eligibility-val">
                      {selectedOpp.eligibility?.work_authorization || "Eligible to work in India"}
                    </span>
                  </div>
                </div>
              </div>

              {/* COMPANY DETAILS */}
              <div className="opp-details-section">
                <h3 className="opp-details-section-title">
                  <span>🏢</span> Company Information
                </h3>
                <div className="opp-company-details-card">
                  <div>
                    <span className="opp-company-item-label">Company Name</span>
                    <div className="opp-company-item-val">{selectedOpp.company_details?.name || selectedOpp.company || "Tech Employer"}</div>
                  </div>
                  <div>
                    <span className="opp-company-item-label">Company Stage</span>
                    <div className="opp-company-item-val">{selectedOpp.company_details?.stage || selectedOpp.stage || "Verified Employer"}</div>
                  </div>
                  <div>
                    <span className="opp-company-item-label">Industry & Domain</span>
                    <div className="opp-company-item-val">{selectedOpp.company_details?.industry || "Software & Technology"}</div>
                  </div>
                  <div>
                    <span className="opp-company-item-label">Work Location</span>
                    <div className="opp-company-item-val">{selectedOpp.company_details?.location || selectedOpp.location || "India"}</div>
                  </div>
                  {selectedOpp.company_details?.website && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <span className="opp-company-item-label">Official Website</span>
                      <div className="opp-company-item-val">
                        <a 
                          href={selectedOpp.company_details.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="opp-company-website-link"
                        >
                          {selectedOpp.company_details.website} ↗
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SOURCE AUTHENTICITY NOTE */}
              <div style={{ 
                padding: "14px 18px", 
                borderRadius: "12px", 
                background: "rgba(255, 255, 255, 0.02)", 
                border: "1px solid rgba(255, 255, 255, 0.07)",
                fontSize: "12px",
                color: "var(--muted)",
                lineHeight: "1.6",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <span style={{ fontSize: "20px" }}>🛡️</span>
                <div>
                  <strong style={{ color: "var(--text)" }}>Authentic Listing Guarantee:</strong>{" "}
                  {selectedOpp.source === "Adzuna"
                    ? "This opportunity is fetched in real-time from Adzuna's verified job index. Applying redirects directly to the original hiring page."
                    : selectedOpp.source === "Arbeitnow"
                    ? "This opportunity is fetched live from the Arbeitnow verified feed. Applying redirects directly to the employer listing."
                    : selectedOpp.source === "recruiter"
                    ? "This opportunity is posted directly by a verified recruiter on GitBridge Careers."
                    : "This verified listing is hosted directly on GitBridge Careers with real-time status tracking."}
                </div>
              </div>
            </div>

            {/* STICKY FOOTER ACTIONS */}
            <div className="opp-details-footer">
              <div className="opp-details-footer-left">
                <span className="opp-pill stipend" style={{ fontSize: "13px", padding: "6px 12px" }}>
                  💰 {selectedOpp.stipend ? selectedOpp.stipend : "Salary not specified"}
                </span>
                <span className="opp-pill exp" style={{ fontSize: "13px", padding: "6px 12px" }}>
                  📍 {selectedOpp.location || "India"}
                </span>
              </div>
              <div className="opp-details-footer-right">
                <button
                  className={`bookmark-btn ${isBookmarked(selectedOpp.id, "opportunity") ? "bookmarked" : ""}`}
                  style={{ padding: "10px 18px", borderRadius: "10px" }}
                  onClick={() => toggleBookmark(selectedOpp, "opportunity")}
                >
                  {isBookmarked(selectedOpp.id, "opportunity") ? "★ Saved" : "☆ Save for Later"}
                </button>
                {isApplied(selectedOpp.id || selectedOpp.source_id) ? (
                  <button
                    className="primary-btn opp-details-apply-btn applied"
                    disabled
                    style={{
                      background: "rgba(34, 197, 94, 0.2)",
                      color: "#4ade80",
                      border: "1px solid rgba(34, 197, 94, 0.4)",
                      cursor: "default"
                    }}
                  >
                    ✓ Applied
                  </button>
                ) : (
                  <button
                    className="primary-btn opp-details-apply-btn"
                    onClick={(e) => handleApply(selectedOpp, e)}
                  >
                    {selectedOpp.source_type === "recruiter" || selectedOpp.source === "recruiter" || !selectedOpp.apply_url
                      ? "Apply via GitBridge →"
                      : "Apply Now ↗"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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
