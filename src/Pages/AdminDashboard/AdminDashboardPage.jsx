import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboardPage.css";

const THEME_MAP = {
  classic: { name: "GitBridge Classic", color: "#8b4de8", badge: "⚡ Classic" },
  oled: { name: "Midnight OLED", color: "#a855f7", badge: "🌌 Midnight" },
  cyberpunk: { name: "Cyberpunk Neon", color: "#00f0ff", badge: "🚀 Cyberpunk" },
  light: { name: "Modern Light", color: "#6366f1", badge: "☀️ Light" }
};

const LANG_MAP = {
  en: { label: "English", flag: "🇬🇧", tag: "EN" },
  hi: { label: "हिंदी", flag: "🇮🇳", tag: "HI" },
  mr: { label: "मराठी", flag: "🚩", tag: "MR" }
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    total_candidates: 0,
    google_logins: 0,
    email_logins: 0,
    resumes_uploaded: 0,
    github_analyzed: 0,
    users_with_2fa: 0,
    total_activities: 0,
    inquiries_count: 0,
    database_connected: true
  });

  const [users, setUsers] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [adminApplications, setAdminApplications] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [activities, setActivities] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [activeTab, setActiveTab] = useState("users"); // "users" | "recruiters" | "opportunities" | "applications" | "activities" | "tickets" | "system"
  
  // Filters & Modals
  const [searchTerm, setSearchTerm] = useState("");
  const [recruiterSearch, setRecruiterSearch] = useState("");
  const [recruiterFilter, setRecruiterFilter] = useState("ALL");
  const [appSearchTerm, setAppSearchTerm] = useState("");
  const [appFilter, setAppFilter] = useState("ALL");
  const [activitySearch, setActivitySearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("ALL");
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Opportunities state
  const [oppSearch, setOppSearch] = useState("");
  const [oppFilter, setOppFilter] = useState("ALL");
  const [oppModalOpen, setOppModalOpen] = useState(false);
  const [oppSubmitting, setOppSubmitting] = useState(false);
  const [fetchingLiveJobs, setFetchingLiveJobs] = useState(false);
  const [newOpp, setNewOpp] = useState({
    title: "",
    company: "",
    logo: "⚡",
    type: "Internship",
    domain: "software",
    location: "Bengaluru / Remote",
    city: "Bengaluru",
    stipend: "₹50,000 / month",
    experience: "Freshers (0-1 Yrs) / 2025-2026 Batch",
    required_skills: "React, Python, Docker, MongoDB",
    apply_url: "https://",
    description: "",
    hiring_timeline: "⚡ Hiring Sprint (48-hr turnaround)",
    deadline: "Immediate Hiring"
  });

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");

  const adminToken = localStorage.getItem("admin_token") || localStorage.getItem("gb_admin_token") || localStorage.getItem("token");
  const storedUser = localStorage.getItem("admin_user") || localStorage.getItem("user");
  const adminUser = storedUser ? JSON.parse(storedUser) : {};

  useEffect(() => {
    if (!adminToken) {
      navigate("/admin/login");
      return;
    }
    loadAdminData();
  }, [adminToken]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const headers = {
        "Authorization": `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      };

      // 1. Fetch Metrics
      const resMetrics = await fetch(`${API_BASE}/api/admin/metrics`, { headers });
      if (resMetrics.status === 401 || resMetrics.status === 403) {
        handleLogout();
        return;
      }
      const dataMetrics = await resMetrics.json();
      setMetrics(dataMetrics);

      // 2. Fetch Users (Candidates)
      const resUsers = await fetch(`${API_BASE}/api/admin/users`, { headers });
      const dataUsers = await resUsers.json();
      setUsers(dataUsers.users || []);

      // 3. Fetch Recruiters
      try {
        const resRec = await fetch(`${API_BASE}/api/admin/recruiters`, { headers });
        if (resRec.ok) {
          const dataRec = await resRec.json();
          setRecruiters(dataRec.recruiters || []);
        }
      } catch (errRec) {
        console.warn("Could not fetch recruiters:", errRec);
      }

      // 4. Fetch Platform Applications
      try {
        const resApps = await fetch(`${API_BASE}/api/admin/applications`, { headers });
        if (resApps.ok) {
          const dataApps = await resApps.json();
          setAdminApplications(dataApps.applications || []);
        }
      } catch (errApps) {
        console.warn("Could not fetch applications:", errApps);
      }

      // 5. Fetch Tickets
      const resTickets = await fetch(`${API_BASE}/api/admin/tickets`, { headers });
      const dataTickets = await resTickets.json();
      setTickets(dataTickets.tickets || []);

      // 6. Fetch Activities & Changes
      const resActivities = await fetch(`${API_BASE}/api/admin/activities?limit=200`, { headers });
      const dataActivities = await resActivities.json();
      setActivities(dataActivities.activities || []);

      // 7. Fetch Opportunities & Internships
      const resOpps = await fetch(`${API_BASE}/api/admin/opportunities`, { headers });
      const dataOpps = await resOpps.json();
      setOpportunities(dataOpps.opportunities || []);
    } catch (err) {
      console.error("Error loading admin data:", err);
      setActionMessage("⚠️ Error communicating with Backend API.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Are you sure you want to remove user "${email}"? This action is permanent.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${adminToken}` }
      });

      const resData = await response.json();
      if (!response.ok) {
        alert(resData.detail || "Could not delete user.");
        return;
      }

      setActionMessage(`✓ User ${email} removed successfully.`);
      loadAdminData();
      setTimeout(() => setActionMessage(""), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to delete user. Check backend status.");
    }
  };

  const handleCreateOpportunity = async (e) => {
    e.preventDefault();
    if (!newOpp.title || !newOpp.company) {
      alert("Please fill in both Job Title and Company Name.");
      return;
    }

    try {
      setOppSubmitting(true);
      const res = await fetch(`${API_BASE}/api/admin/opportunities`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${adminToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newOpp)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Failed to post opportunity.");
        return;
      }

      setActionMessage(`✓ Opportunity '${newOpp.title}' at ${newOpp.company} posted to MongoDB!`);
      setOppModalOpen(false);
      setNewOpp({
        title: "",
        company: "",
        logo: "⚡",
        type: "Internship",
        domain: "software",
        location: "Bengaluru / Remote",
        city: "Bengaluru",
        stipend: "₹50,000 / month",
        experience: "Freshers (0-1 Yrs) / 2025-2026 Batch",
        required_skills: "React, Python, Docker, MongoDB",
        apply_url: "https://",
        description: "",
        hiring_timeline: "⚡ Hiring Sprint (48-hr turnaround)",
        deadline: "Immediate Hiring"
      });
      loadAdminData();
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err) {
      console.error(err);
      alert("Error saving opportunity.");
    } finally {
      setOppSubmitting(false);
    }
  };

  const handleDeleteOpportunity = async (oppId, title) => {
    if (!window.confirm(`Delete opportunity "${title}" from platform?`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/opportunities/${oppId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${adminToken}` }
      });
      if (res.ok) {
        setActionMessage(`✓ Opportunity removed.`);
        loadAdminData();
        setTimeout(() => setActionMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete opportunity.");
    }
  };

  const handleUpdateRecruiterStatus = async (recruiterId, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/recruiters/${recruiterId}/status`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${adminToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`✓ Recruiter status updated to "${status}".`);
        loadAdminData();
        setTimeout(() => setActionMessage(""), 4000);
      } else {
        alert(data.detail || "Failed to update recruiter status");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating recruiter status.");
    }
  };

  const handleUpdateAppStatus = async (applicationId, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${adminToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`✓ Application status updated to "${status}".`);
        loadAdminData();
        setTimeout(() => setActionMessage(""), 4000);
      } else {
        alert(data.detail || "Failed to update application status");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating application status.");
    }
  };

  const handleFetchRealtimeJobs = async () => {
    try {
      setFetchingLiveJobs(true);
      setActionMessage("🌐 Connecting to Remotive API & fetching live developer openings...");
      const res = await fetch(`${API_BASE}/api/admin/opportunities/fetch-realtime`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`🎉 ${data.message}`);
        loadAdminData();
        setTimeout(() => setActionMessage(""), 6000);
      } else {
        alert(data.detail || "Failed to fetch live jobs.");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to real-time job feed.");
    } finally {
      setFetchingLiveJobs(false);
    }
  };

  const handleExportJSON = (type = "users") => {
    let dataToExport = users;
    let filename = "gitbridge_candidates";
    if (type === "activities") {
      dataToExport = activities;
      filename = "gitbridge_student_activities";
    } else if (type === "opportunities") {
      dataToExport = opportunities;
      filename = "gitbridge_live_opportunities";
    } else if (type === "recruiters") {
      dataToExport = recruiters;
      filename = "gitbridge_recruiters_directory";
    } else if (type === "applications") {
      dataToExport = adminApplications;
      filename = "gitbridge_platform_applications";
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = (type = "users") => {
    if (type === "activities") {
      if (activities.length === 0) return alert("No activity data to export.");
      const headers = ["ID", "Student Name", "Email", "Action Type", "Action Title", "Theme", "Language", "2FA", "Sound", "Timestamp"];
      const rows = activities.map(a => [
        a.id, `"${a.user_name || ''}"`, `"${a.user_email || ''}"`, a.action_type, `"${a.action_title || ''}"`,
        a.theme || 'classic', a.language || 'en', a.two_factor_enabled ? "Active" : "Disabled", a.sound_enabled ? "Enabled" : "Muted", `"${a.created_at || a.timestamp}"`
      ]);
      downloadCsvFile(headers, rows, "gitbridge_student_change_logs");
      return;
    }

    if (type === "opportunities") {
      if (opportunities.length === 0) return alert("No opportunities to export.");
      const headers = ["ID", "Title", "Company", "Type", "Domain", "Location", "Stipend", "Skills", "Apply URL", "Created At"];
      const rows = opportunities.map(o => [
        o.id, `"${o.title}"`, `"${o.company}"`, o.type, o.domain, `"${o.location}"`, `"${o.stipend}"`,
        `"${(o.required_skills || []).join(', ')}"`, `"${o.apply_url}"`, `"${o.created_at || ''}"`
      ]);
      downloadCsvFile(headers, rows, "gitbridge_opportunities_catalog");
      return;
    }

    if (type === "recruiters") {
      if (recruiters.length === 0) return alert("No recruiter data to export.");
      const headers = ["ID", "Name", "Email", "Company", "Status", "Joined Date"];
      const rows = recruiters.map(r => [
        r.id, `"${r.name || ''}"`, `"${r.email || ''}"`, `"${r.company || ''}"`, r.recruiter_status || 'pending', `"${r.created_at || ''}"`
      ]);
      downloadCsvFile(headers, rows, "gitbridge_recruiters_directory");
      return;
    }

    if (type === "applications") {
      if (adminApplications.length === 0) return alert("No applications to export.");
      const headers = ["ID", "Student Name", "Student Email", "Job Title", "Company", "Match Score", "Status", "Applied At"];
      const rows = adminApplications.map(a => [
        a.id, `"${a.student?.name || ''}"`, `"${a.student?.email || ''}"`, `"${a.opportunity?.title || ''}"`, `"${a.opportunity?.company || ''}"`, `${a.match_score || 0}%`, a.status || 'Applied', `"${a.applied_at || ''}"`
      ]);
      downloadCsvFile(headers, rows, "gitbridge_platform_applications");
      return;
    }

    if (users.length === 0) return alert("No candidate data to export.");
    const headers = ["ID", "Name", "Email", "Provider", "Role", "Theme", "Language", "2FA", "Sound", "Profile Strength", "Has Resume", "Joined Date"];
    const rows = users.map(u => [
      u.id, `"${u.name}"`, `"${u.email}"`, u.provider, u.role, u.theme || "classic", u.language || "en",
      u.two_factor_enabled ? "Active" : "Disabled", u.sound_enabled ? "On" : "Off", `${u.profile_strength || 0}%`, u.has_resume ? "Yes" : "No", `"${u.created_at}"`
    ]);
    downloadCsvFile(headers, rows, "gitbridge_candidates_directory");
  };

  const downloadCsvFile = (headers, rows, filename) => {
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    localStorage.removeItem("gb_admin_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/admin/login");
  };

  const filteredUsers = users.filter(u => {
    const q = searchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.github_username && u.github_username.toLowerCase().includes(q)) ||
      (u.theme && u.theme.toLowerCase().includes(q))
    );
  });

  const filteredRecruiters = recruiters.filter(r => {
    const matchFilter =
      recruiterFilter === "ALL" ||
      (recruiterFilter === "APPROVED" && (r.recruiter_status === "approved" || r.recruiter_status === "verified")) ||
      (recruiterFilter === "PENDING" && (!r.recruiter_status || r.recruiter_status === "pending")) ||
      (recruiterFilter === "REJECTED" && r.recruiter_status === "rejected") ||
      (recruiterFilter === "SUSPENDED" && r.recruiter_status === "suspended");

    const q = recruiterSearch.toLowerCase();
    const matchSearch =
      !q ||
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.email && r.email.toLowerCase().includes(q)) ||
      (r.company && r.company.toLowerCase().includes(q));

    return matchFilter && matchSearch;
  });

  const filteredAdminApplications = adminApplications.filter(a => {
    const matchStatus =
      appFilter === "ALL" ||
      (a.status && a.status.toLowerCase().replace(/\s+/g, "") === appFilter.toLowerCase().replace(/\s+/g, ""));

    const q = appSearchTerm.toLowerCase();
    const studentName = a.student?.name || "";
    const studentEmail = a.student?.email || "";
    const oppTitle = a.opportunity?.title || "";
    const oppCompany = a.opportunity?.company || "";
    const matchSearch =
      !q ||
      studentName.toLowerCase().includes(q) ||
      studentEmail.toLowerCase().includes(q) ||
      oppTitle.toLowerCase().includes(q) ||
      oppCompany.toLowerCase().includes(q);

    return matchStatus && matchSearch;
  });

  const filteredActivities = activities.filter(a => {
    const matchFilter =
      activityFilter === "ALL" ||
      (activityFilter === "THEME" && a.action_type === "THEME_CHANGE") ||
      (activityFilter === "2FA" && a.action_type.includes("2FA")) ||
      (activityFilter === "LANG" && a.action_type.includes("LANG")) ||
      (activityFilter === "SOUND" && a.action_type.includes("SOUND")) ||
      (activityFilter === "PROFILE" && a.action_type.includes("PROFILE")) ||
      (activityFilter === "NOTIF" && a.action_type.includes("NOTIF"));

    const q = activitySearch.toLowerCase();
    const matchSearch =
      !q ||
      (a.user_name && a.user_name.toLowerCase().includes(q)) ||
      (a.user_email && a.user_email.toLowerCase().includes(q)) ||
      (a.action_title && a.action_title.toLowerCase().includes(q)) ||
      (a.action_type && a.action_type.toLowerCase().includes(q));

    return matchFilter && matchSearch;
  });

  const filteredOpportunities = opportunities.filter(o => {
    const matchType =
      oppFilter === "ALL" ||
      (oppFilter === "INTERNSHIP" && o.type.toLowerCase().includes("intern")) ||
      (oppFilter === "FULLTIME" && o.type.toLowerCase().includes("full")) ||
      (oppFilter === "REMOTE" && (o.location.toLowerCase().includes("remote") || o.city.toLowerCase().includes("remote")));

    const q = oppSearch.toLowerCase();
    const matchSearch =
      !q ||
      (o.title && o.title.toLowerCase().includes(q)) ||
      (o.company && o.company.toLowerCase().includes(q)) ||
      (o.city && o.city.toLowerCase().includes(q)) ||
      (o.domain && o.domain.toLowerCase().includes(q)) ||
      (o.required_skills && o.required_skills.some(s => s.toLowerCase().includes(q)));

    return matchType && matchSearch;
  });

  const studentActivities = selectedStudent
    ? activities.filter(a => a.user_id === selectedStudent.id || a.user_email === selectedStudent.email)
    : [];

  return (
    <div className="admin-dashboard-page">
      {/* TOP ADMIN HEADER */}
      <header className="admin-header">
        <div className="admin-header-brand" onClick={() => navigate("/")}>
          <div className="admin-logo-badge">⚡</div>
          <div>
            <h1>GitBridge Enterprise</h1>
            <span className="sub">Executive Administration & Live Opportunities Manager</span>
          </div>
        </div>

        <div className="admin-header-actions">
          <div className="admin-session-badge">
            <span className="online-indicator"></span>
            <span>{adminUser.email || "admin@gitbridge.com"}</span>
            <span className="role-pill">MASTER ADMIN</span>
          </div>

          <button 
            className="switch-portal-btn"
            onClick={() => navigate("/dashboard")}
            title="Preview Student / Candidate Portal"
          >
            🎓 Student Portal
          </button>

          <button className="admin-logout-btn" onClick={handleLogout}>
            Logout ⏻
          </button>
        </div>
      </header>

      <main className="admin-main">
        {/* BANNER NOTIFICATION */}
        {actionMessage && (
          <div className="admin-flash-banner">
            {actionMessage}
          </div>
        )}

        {/* METRICS ROW */}
        <section className="metrics-grid">
          <div className="metric-card cyan">
            <div className="metric-icon">👥</div>
            <div className="metric-data">
              <span className="metric-label">Total Candidates</span>
              <span className="metric-value">{metrics.total_candidates}</span>
            </div>
          </div>

          <div className="metric-card purple">
            <div className="metric-icon">💼</div>
            <div className="metric-data">
              <span className="metric-label">Live Opportunities</span>
              <span className="metric-value">{opportunities.length}</span>
            </div>
          </div>

          <div className="metric-card green">
            <div className="metric-icon">🔐</div>
            <div className="metric-data">
              <span className="metric-label">2FA Protected Accounts</span>
              <span className="metric-value">{metrics.users_with_2fa || 0}</span>
            </div>
          </div>

          <div className="metric-card pink">
            <div className="metric-icon">⚡</div>
            <div className="metric-data">
              <span className="metric-label">Student Changes Tracked</span>
              <span className="metric-value">{metrics.total_activities || activities.length}</span>
            </div>
          </div>

          <div className="metric-card amber">
            <div className="metric-icon">📄</div>
            <div className="metric-data">
              <span className="metric-label">Resumes Screened</span>
              <span className="metric-value">{metrics.resumes_uploaded}</span>
            </div>
          </div>

          <div className="metric-card cyan">
            <div className="metric-icon">💬</div>
            <div className="metric-data">
              <span className="metric-label">Support Inquiries</span>
              <span className="metric-value">{metrics.inquiries_count}</span>
            </div>
          </div>

          <div className="metric-card green">
            <div className="metric-icon">🏢</div>
            <div className="metric-data">
              <span className="metric-label">Recruiters Registered</span>
              <span className="metric-value">{recruiters.length}</span>
            </div>
          </div>

          <div className="metric-card purple">
            <div className="metric-icon">📋</div>
            <div className="metric-data">
              <span className="metric-label">Total Applications</span>
              <span className="metric-value">{adminApplications.length}</span>
            </div>
          </div>
        </section>

        {/* TABS CONTROLLER */}
        <div className="admin-tabs-bar">
          <div className="admin-tabs">
            <button 
              className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              👥 Candidates ({users.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === "recruiters" ? "active" : ""}`}
              onClick={() => setActiveTab("recruiters")}
            >
              🏢 Recruiters ({recruiters.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === "opportunities" ? "active" : ""}`}
              onClick={() => setActiveTab("opportunities")}
            >
              💼 Jobs & Internships ({opportunities.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === "applications" ? "active" : ""}`}
              onClick={() => setActiveTab("applications")}
            >
              📋 Platform Applications ({adminApplications.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === "activities" ? "active" : ""}`}
              onClick={() => setActiveTab("activities")}
            >
              ⚡ Changes & Audit ({activities.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === "tickets" ? "active" : ""}`}
              onClick={() => setActiveTab("tickets")}
            >
              💬 Inquiries ({tickets.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === "system" ? "active" : ""}`}
              onClick={() => setActiveTab("system")}
            >
              ⚙️ Cluster & DB Telemetry
            </button>
          </div>

          <div className="tab-actions">
            {activeTab === "recruiters" && (
              <>
                <button className="export-btn" onClick={() => handleExportCSV("recruiters")}>
                  📥 Export CSV
                </button>
                <button className="export-btn" onClick={() => handleExportJSON("recruiters")}>
                  Export JSON
                </button>
              </>
            )}

            {activeTab === "applications" && (
              <>
                <button className="export-btn" onClick={() => handleExportCSV("applications")}>
                  📥 Export CSV
                </button>
                <button className="export-btn" onClick={() => handleExportJSON("applications")}>
                  Export JSON
                </button>
              </>
            )}

            {activeTab === "opportunities" && (
              <>
                <button
                  className="post-opp-primary-btn"
                  onClick={() => setOppModalOpen(true)}
                >
                  ➕ Post New Job / Internship
                </button>
                <button
                  className="live-sync-btn"
                  onClick={handleFetchRealtimeJobs}
                  disabled={fetchingLiveJobs}
                  title="Pull live jobs directly from Remotive API"
                >
                  {fetchingLiveJobs ? "🔄 Syncing..." : "🌐 1-Click Live Web Sync"}
                </button>
                <button className="export-btn" onClick={() => handleExportCSV("opportunities")}>
                  📥 Export CSV
                </button>
              </>
            )}

            {activeTab === "users" && (
              <>
                <button className="export-btn" onClick={() => handleExportCSV("users")}>
                  📥 Export CSV
                </button>
                <button className="export-btn" onClick={() => handleExportJSON("users")}>
                  Export JSON
                </button>
              </>
            )}

            {activeTab === "activities" && (
              <>
                <button className="export-btn" onClick={() => handleExportCSV("activities")}>
                  📥 Export Logs CSV
                </button>
                <button className="export-btn" onClick={() => handleExportJSON("activities")}>
                  Export Logs JSON
                </button>
              </>
            )}

            <button className="refresh-btn" onClick={loadAdminData} disabled={loading}>
              {loading ? "Refreshing..." : "🔄 Refresh Data"}
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: USERS DATA TABLE */}
        {/* ============================================================== */}
        {activeTab === "users" && (
          <section className="admin-content-section">
            <div className="table-controls">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by name, email, GitHub handle, or active theme..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="clear-btn" onClick={() => setSearchTerm("")}>✕</button>
                )}
              </div>

              <div className="table-summary">
                Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> candidates
              </div>
            </div>

            {loading ? (
              <div className="admin-loading-state">
                <span className="spinner">⚡</span> Fetching MongoDB candidate records...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="admin-empty-state">
                <p>No candidates match your search filter.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Email ID</th>
                      <th>Active Theme</th>
                      <th>Language</th>
                      <th>2FA Security</th>
                      <th>Audio Sound</th>
                      <th>Profile Strength</th>
                      <th>Last Activity / Change</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const isMasterAdmin = u.email && u.email.toLowerCase() === "admin@gitbridge.com";
                      const themeInfo = THEME_MAP[u.theme] || { name: u.theme || "Classic", color: "#8b4de8", badge: u.theme || "Classic" };
                      const langInfo = LANG_MAP[u.language] || { label: "English", flag: "🇬🇧", tag: "EN" };

                      return (
                        <tr key={u.id} className={isMasterAdmin ? "admin-row" : ""}>
                          <td>
                            <div className="user-name-cell">
                              <span className="user-avatar">{u.name ? u.name.charAt(0).toUpperCase() : "U"}</span>
                              <div>
                                <strong className="name-text">{u.name || "Candidate"}</strong>
                                {u.github_username && (
                                  <span className="github-handle">@{u.github_username}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="user-email-cell">{u.email}</td>
                          <td>
                            <span className="theme-indicator-chip" style={{ borderColor: themeInfo.color }}>
                              <span className="theme-dot" style={{ backgroundColor: themeInfo.color }}></span>
                              <span>{themeInfo.badge}</span>
                            </span>
                          </td>
                          <td>
                            <span className="lang-indicator-chip">
                              <span>{langInfo.flag}</span>
                              <span>{langInfo.tag}</span>
                            </span>
                          </td>
                          <td>
                            {u.two_factor_enabled ? (
                              <span className="twofa-status-badge active" title="Account protected by 2FA">
                                🔐 Active
                              </span>
                            ) : (
                              <span className="twofa-status-badge disabled" title="2FA not yet enabled">
                                ● Disabled
                              </span>
                            )}
                          </td>
                          <td>
                            {u.sound_enabled ? (
                              <span className="sound-chip on" title="Audio feedback enabled">🔊 On</span>
                            ) : (
                              <span className="sound-chip off" title="Audio muted">🔇 Muted</span>
                            )}
                          </td>
                          <td>
                            <div className="profile-strength-cell">
                              <div className="mini-progress-bar">
                                <div
                                  className="mini-progress-fill"
                                  style={{
                                    width: `${u.profile_strength || 40}%`,
                                    backgroundColor: (u.profile_strength || 40) > 75 ? "#22c55e" : "#f59e0b"
                                  }}
                                ></div>
                              </div>
                              <small>{u.profile_strength || 40}%</small>
                            </div>
                          </td>
                          <td className="last-action-cell">
                            <span className="last-action-text" title={u.last_action || "Active"}>
                              {u.last_action || "Registered on platform"}
                            </span>
                            <small className="last-active-time">
                              {u.last_active ? new Date(u.last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recent"}
                            </small>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div className="action-buttons-group">
                              <button
                                className="inspect-btn"
                                onClick={() => setSelectedStudent(u)}
                                title="Inspect full profile, theme details and change timeline"
                              >
                                👁️ Inspect
                              </button>
                              {!isMasterAdmin && (
                                <button
                                  className="delete-user-btn"
                                  onClick={() => handleDeleteUser(u.id, u.email)}
                                  title="Remove candidate from MongoDB"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB: RECRUITERS DIRECTORY & VERIFICATION */}
        {/* ============================================================== */}
        {activeTab === "recruiters" && (
          <section className="admin-content-section">
            <div className="table-controls">
              <div className="activity-filter-pills">
                <button
                  className={`filter-pill ${recruiterFilter === "ALL" ? "active" : ""}`}
                  onClick={() => setRecruiterFilter("ALL")}
                >
                  ⚡ All ({recruiters.length})
                </button>
                <button
                  className={`filter-pill ${recruiterFilter === "PENDING" ? "active" : ""}`}
                  onClick={() => setRecruiterFilter("PENDING")}
                >
                  ⏳ Pending ({recruiters.filter(r => !r.recruiter_status || r.recruiter_status === "pending").length})
                </button>
                <button
                  className={`filter-pill ${recruiterFilter === "APPROVED" ? "active" : ""}`}
                  onClick={() => setRecruiterFilter("APPROVED")}
                >
                  ✓ Verified ({recruiters.filter(r => r.recruiter_status === "approved" || r.recruiter_status === "verified").length})
                </button>
                <button
                  className={`filter-pill ${recruiterFilter === "REJECTED" ? "active" : ""}`}
                  onClick={() => setRecruiterFilter("REJECTED")}
                >
                  ✕ Rejected
                </button>
                <button
                  className={`filter-pill ${recruiterFilter === "SUSPENDED" ? "active" : ""}`}
                  onClick={() => setRecruiterFilter("SUSPENDED")}
                >
                  ⚠️ Suspended
                </button>
              </div>

              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search recruiters by name, email, or company..."
                  value={recruiterSearch}
                  onChange={(e) => setRecruiterSearch(e.target.value)}
                />
                {recruiterSearch && (
                  <button className="clear-btn" onClick={() => setRecruiterSearch("")}>✕</button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="admin-loading-state">
                <span className="spinner">⚡</span> Loading recruiter profiles...
              </div>
            ) : filteredRecruiters.length === 0 ? (
              <div className="admin-empty-state">
                <p>No recruiters match the selected filter.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Recruiter & Organization</th>
                      <th>Work Email</th>
                      <th>Company Website / Info</th>
                      <th>Account Status</th>
                      <th>Registration Date</th>
                      <th style={{ textAlign: "right" }}>Verification Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecruiters.map((r) => {
                      const status = r.recruiter_status || "pending";
                      const isApproved = status === "approved" || status === "verified";
                      const isPending = status === "pending";
                      const isSuspended = status === "suspended";
                      const isRejected = status === "rejected";

                      return (
                        <tr key={r.id}>
                          <td>
                            <div className="user-name-cell">
                              <span className="user-avatar" style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
                                {r.name ? r.name.charAt(0).toUpperCase() : "R"}
                              </span>
                              <div>
                                <strong className="name-text">{r.name || "Recruiter"}</strong>
                                <span className="recruiter-company-sub">{r.company || "Company Not Set"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="user-email-cell">{r.email}</td>
                          <td>
                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                              {r.company ? `🏢 ${r.company}` : "—"}
                              {r.website && ` • `}
                              {r.website && (
                                <a href={r.website} target="_blank" rel="noreferrer" style={{ color: "#38bdf8" }}>
                                  Website ↗
                                </a>
                              )}
                            </span>
                          </td>
                          <td>
                            <span className={`recruiter-status-pill ${status}`}>
                              {isApproved && "✓ Verified"}
                              {isPending && "⏳ Pending"}
                              {isRejected && "✕ Rejected"}
                              {isSuspended && "⚠️ Suspended"}
                            </span>
                          </td>
                          <td style={{ fontSize: "12px", color: "#94a3b8" }}>
                            {r.created_at ? new Date(r.created_at).toLocaleDateString() : "Active"}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div className="action-buttons-group">
                              {!isApproved && (
                                <button
                                  className="admin-action-btn verify"
                                  onClick={() => handleUpdateRecruiterStatus(r.id, "approved")}
                                  title="Approve & Verify recruiter account"
                                >
                                  ✓ Approve
                                </button>
                              )}
                              {!isRejected && (
                                <button
                                  className="admin-action-btn reject"
                                  onClick={() => handleUpdateRecruiterStatus(r.id, "rejected")}
                                  title="Reject recruiter application"
                                >
                                  ✕ Reject
                                </button>
                              )}
                              {!isSuspended ? (
                                <button
                                  className="admin-action-btn suspend"
                                  onClick={() => handleUpdateRecruiterStatus(r.id, "suspended")}
                                  title="Suspend account access"
                                >
                                  ⚠️ Suspend
                                </button>
                              ) : (
                                <button
                                  className="admin-action-btn verify"
                                  onClick={() => handleUpdateRecruiterStatus(r.id, "approved")}
                                  title="Reinstate recruiter account"
                                >
                                  🔄 Reinstate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 2: OPPORTUNITIES & INTERNSHIPS MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === "opportunities" && (
          <section className="admin-content-section">
            <div className="table-controls">
              <div className="activity-filter-pills">
                <button
                  className={`filter-pill ${oppFilter === "ALL" ? "active" : ""}`}
                  onClick={() => setOppFilter("ALL")}
                >
                  ⚡ All ({opportunities.length})
                </button>
                <button
                  className={`filter-pill ${oppFilter === "INTERNSHIP" ? "active" : ""}`}
                  onClick={() => setOppFilter("INTERNSHIP")}
                >
                  💼 Internships
                </button>
                <button
                  className={`filter-pill ${oppFilter === "FULLTIME" ? "active" : ""}`}
                  onClick={() => setOppFilter("FULLTIME")}
                >
                  ⚡ Full-Time Roles
                </button>
                <button
                  className={`filter-pill ${oppFilter === "REMOTE" ? "active" : ""}`}
                  onClick={() => setOppFilter("REMOTE")}
                >
                  🌐 Remote Only
                </button>
              </div>

              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search opportunities by title, company, skills, or city..."
                  value={oppSearch}
                  onChange={(e) => setOppSearch(e.target.value)}
                />
                {oppSearch && (
                  <button className="clear-btn" onClick={() => setOppSearch("")}>✕</button>
                )}
              </div>
            </div>

            {filteredOpportunities.length === 0 ? (
              <div className="admin-empty-state">
                <p>No opportunities match your filter.</p>
                <small>Click "➕ Post New Job / Internship" to add real-time openings or "🌐 1-Click Live Web Sync" to pull fresh postings!</small>
              </div>
            ) : (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Company & Role</th>
                      <th>Type & Domain</th>
                      <th>Location / City</th>
                      <th>Stipend / Salary</th>
                      <th>Required Skills</th>
                      <th>Hiring Timeline</th>
                      <th>Source</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOpportunities.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <div className="user-name-cell">
                            <span className="opp-logo-badge">{o.logo || "💼"}</span>
                            <div>
                              <strong className="name-text">{o.title}</strong>
                              <span className="opp-company-name">{o.company}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="opp-type-badge-row">
                            <span className={`opp-type-tag ${o.type.toLowerCase().includes("intern") ? "internship" : "fulltime"}`}>
                              {o.type}
                            </span>
                            <span className="opp-domain-tag">{o.domain}</span>
                          </div>
                        </td>
                        <td>
                          <span className="opp-location-text">📍 {o.location}</span>
                        </td>
                        <td>
                          <strong className="opp-stipend-text">{o.stipend}</strong>
                        </td>
                        <td>
                          <div className="opp-skills-list">
                            {(o.required_skills || []).slice(0, 4).map((s, idx) => (
                              <span key={idx} className="opp-skill-chip">{s}</span>
                            ))}
                            {(o.required_skills || []).length > 4 && (
                              <small>+{(o.required_skills || []).length - 4}</small>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="opp-timeline-badge">{o.hiring_timeline || "Open"}</span>
                        </td>
                        <td>
                          <span className={`opp-source-tag ${o.source === 'Remotive Live API' ? 'api' : 'direct'}`}>
                            {o.source || "Direct"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="action-buttons-group">
                            <a
                              href={o.apply_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inspect-btn"
                              title="Visit application portal link"
                            >
                              🔗 Link
                            </a>
                            <button
                              className="delete-user-btn"
                              onClick={() => handleDeleteOpportunity(o.id, o.title)}
                              title="Delete opportunity from platform"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB: PLATFORM APPLICATIONS PIPELINE */}
        {/* ============================================================== */}
        {activeTab === "applications" && (
          <section className="admin-content-section">
            <div className="table-controls">
              <div className="activity-filter-pills">
                <button
                  className={`filter-pill ${appFilter === "ALL" ? "active" : ""}`}
                  onClick={() => setAppFilter("ALL")}
                >
                  ⚡ All ({adminApplications.length})
                </button>
                <button
                  className={`filter-pill ${appFilter === "Applied" ? "active" : ""}`}
                  onClick={() => setAppFilter("Applied")}
                >
                  📥 Applied
                </button>
                <button
                  className={`filter-pill ${appFilter === "Under Review" ? "active" : ""}`}
                  onClick={() => setAppFilter("Under Review")}
                >
                  🔍 Under Review
                </button>
                <button
                  className={`filter-pill ${appFilter === "Shortlisted" ? "active" : ""}`}
                  onClick={() => setAppFilter("Shortlisted")}
                >
                  ⭐ Shortlisted
                </button>
                <button
                  className={`filter-pill ${appFilter === "Interview" ? "active" : ""}`}
                  onClick={() => setAppFilter("Interview")}
                >
                  💼 Interview
                </button>
                <button
                  className={`filter-pill ${appFilter === "Selected" ? "active" : ""}`}
                  onClick={() => setAppFilter("Selected")}
                >
                  🎉 Selected
                </button>
                <button
                  className={`filter-pill ${appFilter === "Rejected" ? "active" : ""}`}
                  onClick={() => setAppFilter("Rejected")}
                >
                  ✕ Rejected
                </button>
              </div>

              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by student, email, company, or job role..."
                  value={appSearchTerm}
                  onChange={(e) => setAppSearchTerm(e.target.value)}
                />
                {appSearchTerm && (
                  <button className="clear-btn" onClick={() => setAppSearchTerm("")}>✕</button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="admin-loading-state">
                <span className="spinner">⚡</span> Loading applications...
              </div>
            ) : filteredAdminApplications.length === 0 ? (
              <div className="admin-empty-state">
                <p>No student applications found for this filter.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Applied Opportunity</th>
                      <th>AI Match Score</th>
                      <th>Applied Date</th>
                      <th>Current Status</th>
                      <th style={{ textAlign: "right" }}>Update Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdminApplications.map((app) => (
                      <tr key={app.id}>
                        <td>
                          <div className="user-name-cell">
                            <span className="user-avatar">
                              {app.student?.name ? app.student.name.charAt(0).toUpperCase() : "C"}
                            </span>
                            <div>
                              <strong className="name-text">{app.student?.name || "Student"}</strong>
                              <span className="user-email-cell" style={{ display: "block", fontSize: "11px" }}>
                                {app.student?.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong className="name-text">{app.opportunity?.title || "Opportunity"}</strong>
                            <span className="recruiter-company-sub">
                              🏢 {app.opportunity?.company || "Company"} {app.opportunity?.location && `• 📍 ${app.opportunity.location}`}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`admin-match-badge ${(app.match_score || 0) >= 70 ? "high" : ""}`}>
                            🎯 {app.match_score || (app.ai_match ? app.ai_match.overall_match : 0)}% Match
                          </span>
                        </td>
                        <td style={{ fontSize: "12px", color: "#94a3b8" }}>
                          {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : "Recent"}
                        </td>
                        <td>
                          <span className={`opp-type-tag ${app.status?.toLowerCase().includes("select") ? "fulltime" : app.status?.toLowerCase().includes("short") ? "internship" : ""}`}>
                            {app.status || "Applied"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <select
                            className="admin-app-status-select"
                            value={app.status || "Applied"}
                            onChange={(e) => handleUpdateAppStatus(app.id, e.target.value)}
                          >
                            <option value="Applied">Applied</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interview">Interview</option>
                            <option value="Selected">Selected</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 3: LIVE STUDENT ACTIVITY & CHANGE LOGS */}
        {/* ============================================================== */}
        {activeTab === "activities" && (
          <section className="admin-content-section">
            <div className="activities-controls">
              <div className="activity-filter-pills">
                <button
                  className={`filter-pill ${activityFilter === "ALL" ? "active" : ""}`}
                  onClick={() => setActivityFilter("ALL")}
                >
                  ⚡ All ({activities.length})
                </button>
                <button
                  className={`filter-pill ${activityFilter === "THEME" ? "active" : ""}`}
                  onClick={() => setActivityFilter("THEME")}
                >
                  🎨 Themes
                </button>
                <button
                  className={`filter-pill ${activityFilter === "2FA" ? "active" : ""}`}
                  onClick={() => setActivityFilter("2FA")}
                >
                  🔐 2-Step Verification
                </button>
                <button
                  className={`filter-pill ${activityFilter === "LANG" ? "active" : ""}`}
                  onClick={() => setActivityFilter("LANG")}
                >
                  🌐 Language
                </button>
                <button
                  className={`filter-pill ${activityFilter === "SOUND" ? "active" : ""}`}
                  onClick={() => setActivityFilter("SOUND")}
                >
                  🔊 Sound Effects
                </button>
                <button
                  className={`filter-pill ${activityFilter === "PROFILE" ? "active" : ""}`}
                  onClick={() => setActivityFilter("PROFILE")}
                >
                  👤 Profile Edits
                </button>
                <button
                  className={`filter-pill ${activityFilter === "NOTIF" ? "active" : ""}`}
                  onClick={() => setActivityFilter("NOTIF")}
                >
                  🔔 Notifications
                </button>
              </div>

              <div className="search-box activity-search">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Filter activities by student name, email, or change..."
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                />
                {activitySearch && (
                  <button className="clear-btn" onClick={() => setActivitySearch("")}>✕</button>
                )}
              </div>
            </div>

            {filteredActivities.length === 0 ? (
              <div className="admin-empty-state">
                <p>No student change logs match your current filter.</p>
                <small>When students change themes, verify 2FA, toggle sounds, or update profiles, entries appear here instantly.</small>
              </div>
            ) : (
              <div className="activity-stream-timeline">
                {filteredActivities.map((act) => {
                  const themeObj = THEME_MAP[act.theme] || { name: act.theme || "Classic", color: "#8b4de8", badge: act.theme || "Classic" };
                  const langObj = LANG_MAP[act.language] || { label: "English", flag: "🇬🇧", tag: "EN" };

                  return (
                    <div key={act.id} className="activity-log-card">
                      <div className="activity-card-left">
                        <div className="activity-user-badge">
                          <span className="user-avatar-sm">
                            {act.user_name ? act.user_name.charAt(0).toUpperCase() : "S"}
                          </span>
                          <div>
                            <strong className="act-user-name">{act.user_name || "Student"}</strong>
                            <span className="act-user-email">{act.user_email}</span>
                          </div>
                        </div>

                        <div className="activity-main-info">
                          <div className="activity-title-row">
                            <span className={`action-type-pill ${act.action_type.toLowerCase().replace(/^2fa/, "twofa")}`}>
                              {act.action_type.replace(/_/g, " ")}
                            </span>
                            <span className="act-timestamp">
                              {act.created_at || (act.timestamp ? new Date(act.timestamp).toLocaleString() : "Just now")}
                            </span>
                          </div>

                          <div className="activity-action-heading">
                            {act.action_title}
                          </div>

                          {act.details && Object.keys(act.details).length > 0 && (
                            <div className="act-details-box">
                              {Object.entries(act.details).map(([k, v]) => (
                                <span key={k} className="detail-tag">
                                  <b>{k}:</b> {String(v)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="activity-card-right">
                        <div className="context-chips-row">
                          <span className="theme-indicator-chip small" style={{ borderColor: themeObj.color }}>
                            <span className="theme-dot" style={{ backgroundColor: themeObj.color }}></span>
                            <span>{themeObj.badge}</span>
                          </span>

                          <span className="lang-indicator-chip small">
                            <span>{langObj.flag}</span>
                            <span>{langObj.tag}</span>
                          </span>

                          <span className={`twofa-status-badge small ${act.two_factor_enabled ? "active" : "disabled"}`}>
                            {act.two_factor_enabled ? "🔐 2FA" : "● No 2FA"}
                          </span>

                          <span className={`sound-chip small ${act.sound_enabled ? "on" : "off"}`}>
                            {act.sound_enabled ? "🔊 Sound" : "🔇 Muted"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 4: INQUIRIES & TICKETS */}
        {/* ============================================================== */}
        {activeTab === "tickets" && (
          <section className="admin-content-section">
            <h3 className="section-title">Public Inquiries & Helpdesk Tickets</h3>
            {tickets.length === 0 ? (
              <div className="admin-empty-state">
                <p>No support inquiries recorded in MongoDB yet.</p>
              </div>
            ) : (
              <div className="tickets-grid">
                {tickets.map((t) => (
                  <div key={t.id} className="ticket-card">
                    <div className="ticket-header">
                      <span className="ticket-name">{t.name || "Anonymous Candidate"}</span>
                      <span className="ticket-date">{t.created_at || "Recent"}</span>
                    </div>
                    <div className="ticket-email">{t.email}</div>
                    <div className="ticket-subject">{t.subject || "Support Query"}</div>
                    <p className="ticket-message">"{t.message}"</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 5: SYSTEM TELEMETRY */}
        {/* ============================================================== */}
        {activeTab === "system" && (
          <section className="admin-content-section telemetry-panel">
            <h3 className="section-title">System & Cluster Architecture Status</h3>
            <div className="telemetry-grid">
              <div className="telemetry-card">
                <h4>Database Engine & Collections</h4>
                <div className="telemetry-item">
                  <span>Engine:</span> <strong>MongoDB 8.0 (Local Service)</strong>
                </div>
                <div className="telemetry-item">
                  <span>Host:</span> <code>mongodb://localhost:27017</code>
                </div>
                <div className="telemetry-item">
                  <span>Active Database:</span> <code>gitbridge</code>
                </div>
                <div className="telemetry-item">
                  <span>Opportunities Collection:</span> <code>opportunities</code> ({opportunities.length} live jobs)
                </div>
                <div className="telemetry-item">
                  <span>Audit Logs Collection:</span> <code>activity_logs</code> ({activities.length} records)
                </div>
                <div className="telemetry-item">
                  <span>Connection State:</span> <strong style={{ color: "#22c55e" }}>CONNECTED ✓</strong>
                </div>
              </div>

              <div className="telemetry-card">
                <h4>Application Security & Auditing</h4>
                <div className="telemetry-item">
                  <span>Master Admin Account:</span> <code>admin@gitbridge.com</code>
                </div>
                <div className="telemetry-item">
                  <span>Real-Time Job Sync API:</span> <strong>Remotive Free Public Feed (Active)</strong>
                </div>
                <div className="telemetry-item">
                  <span>2FA Security Enforcement:</span> <strong>Active (Simulated TOTP & Recovery)</strong>
                </div>
                <div className="telemetry-item">
                  <span>Student Change Logging:</span> <strong style={{ color: "#06b6d4" }}>ACTIVE & REALTIME</strong>
                </div>
              </div>

              <div className="telemetry-card">
                <h4>Port & Service Topology</h4>
                <div className="telemetry-item">
                  <span>Backend REST API:</span> <code>http://127.0.0.1:8000</code>
                </div>
                <div className="telemetry-item">
                  <span>Interactive Docs:</span> <code>http://127.0.0.1:8000/docs</code>
                </div>
                <div className="telemetry-item">
                  <span>Frontend Client:</span> <code>http://localhost:5173</code>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ============================================================== */}
      {/* POST NEW OPPORTUNITY MODAL */}
      {/* ============================================================== */}
      {oppModalOpen && (
        <div className="modal-backdrop" onClick={() => setOppModalOpen(false)}>
          <div className="modal-card post-opp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>➕ Post New Opportunity / Tech Internship</h3>
                <p>Add a real-time opening directly to MongoDB. Candidates will immediately see it on their dashboard!</p>
              </div>
              <button className="modal-close-btn" onClick={() => setOppModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateOpportunity} className="post-opp-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google, Zomato, Razorpay"
                    value={newOpp.company}
                    onChange={(e) => setNewOpp({ ...newOpp, company: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Company Emoji / Logo</label>
                  <input
                    type="text"
                    placeholder="e.g. ⚡, 🚀, 💎, 🦄, 🧠"
                    value={newOpp.logo}
                    onChange={(e) => setNewOpp({ ...newOpp, logo: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Role / Position Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cloud & DevOps Engineer Intern"
                    value={newOpp.title}
                    onChange={(e) => setNewOpp({ ...newOpp, title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Job Type</label>
                  <select
                    value={newOpp.type}
                    onChange={(e) => setNewOpp({ ...newOpp, type: e.target.value })}
                  >
                    <option value="Internship">Internship</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Contract">Contract / Project</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label>Domain</label>
                  <select
                    value={newOpp.domain}
                    onChange={(e) => setNewOpp({ ...newOpp, domain: e.target.value })}
                  >
                    <option value="software">Software Engineering</option>
                    <option value="devops">Cloud & DevOps</option>
                    <option value="ai_ml">AI / Machine Learning</option>
                    <option value="data">Data Science & Analytics</option>
                    <option value="security">Cybersecurity</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Location / City</label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru / Remote, Mumbai, Pune"
                    value={newOpp.location}
                    onChange={(e) => setNewOpp({ ...newOpp, location: e.target.value, city: e.target.value.split('/')[0].trim() })}
                  />
                </div>

                <div className="form-group">
                  <label>Stipend / Salary Package</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹50,000 / mo or ₹14-18 LPA"
                    value={newOpp.stipend}
                    onChange={(e) => setNewOpp({ ...newOpp, stipend: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Required Skills (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Python, Docker, Kubernetes, Linux, React"
                  value={newOpp.required_skills}
                  onChange={(e) => setNewOpp({ ...newOpp, required_skills: e.target.value })}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Direct Application URL *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://company.com/careers or form link"
                    value={newOpp.apply_url}
                    onChange={(e) => setNewOpp({ ...newOpp, apply_url: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Hiring Timeline / Batch</label>
                  <input
                    type="text"
                    placeholder="e.g. Active Sprint • 2025/2026 Batch"
                    value={newOpp.hiring_timeline}
                    onChange={(e) => setNewOpp({ ...newOpp, hiring_timeline: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Job Description & Responsibilities</label>
                <textarea
                  rows={3}
                  placeholder="Key responsibilities and expectations for the candidate..."
                  value={newOpp.description}
                  onChange={(e) => setNewOpp({ ...newOpp, description: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setOppModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={oppSubmitting}>
                  {oppSubmitting ? "Publishing to MongoDB..." : "Publish Opportunity 🚀"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANDIDATE INSPECTOR MODAL */}
      {selectedStudent && (
        <div className="modal-backdrop" onClick={() => setSelectedStudent(null)}>
          <div className="modal-card student-inspector-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="inspector-head-left">
                <span className="inspector-avatar">
                  {selectedStudent.name ? selectedStudent.name.charAt(0).toUpperCase() : "U"}
                </span>
                <div>
                  <h3>{selectedStudent.name || "Candidate"} Profile & Live Settings</h3>
                  <p>{selectedStudent.email} • ID: <code>{selectedStudent.id}</code></p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedStudent(null)}>✕</button>
            </div>

            <div className="inspector-body">
              <div className="inspector-matrix-grid">
                <div className="matrix-card">
                  <span className="matrix-icon">🎨</span>
                  <div className="matrix-info">
                    <label>Active Theme Selected</label>
                    <strong style={{ color: THEME_MAP[selectedStudent.theme]?.color || "#00f0ff" }}>
                      {THEME_MAP[selectedStudent.theme]?.name || selectedStudent.theme || "Classic"}
                    </strong>
                    <small>Applied to dashboard & remembered</small>
                  </div>
                </div>

                <div className="matrix-card">
                  <span className="matrix-icon">🌐</span>
                  <div className="matrix-info">
                    <label>Selected Platform Language</label>
                    <strong>
                      {LANG_MAP[selectedStudent.language]?.flag} {LANG_MAP[selectedStudent.language]?.label || "English"}
                    </strong>
                    <small>Interface & label localization</small>
                  </div>
                </div>

                <div className="matrix-card">
                  <span className="matrix-icon">🔐</span>
                  <div className="matrix-info">
                    <label>Two-Factor Authentication</label>
                    <strong style={{ color: selectedStudent.two_factor_enabled ? "#22c55e" : "#94a3b8" }}>
                      {selectedStudent.two_factor_enabled ? "✓ Active & Enforced" : "● Disabled"}
                    </strong>
                    <small>{selectedStudent.two_factor_enabled ? "High Security Protection" : "Standard Security"}</small>
                  </div>
                </div>

                <div className="matrix-card">
                  <span className="matrix-icon">🔊</span>
                  <div className="matrix-info">
                    <label>UI Sound Effects</label>
                    <strong>{selectedStudent.sound_enabled ? "Enabled (Audio On)" : "Muted (Silent Mode)"}</strong>
                    <small>Synthesized acoustic tones</small>
                  </div>
                </div>
              </div>

              <div className="inspector-section">
                <h4>👤 Candidate Professional Information</h4>
                <div className="inspector-details-row">
                  <div><strong>Target Role:</strong> {selectedStudent.target_role || "Full-Stack Software Engineer"}</div>
                  <div><strong>Location:</strong> {selectedStudent.location_pref || "Bengaluru / Remote"}</div>
                  <div><strong>Profile Strength:</strong> {selectedStudent.profile_strength || 40}%</div>
                  <div><strong>ATS Resume:</strong> {selectedStudent.has_resume ? "✓ Uploaded & Screened" : "No Resume"}</div>
                </div>
                {selectedStudent.bio && (
                  <div className="inspector-bio-box">
                    <strong>Professional Bio:</strong>
                    <p>{selectedStudent.bio}</p>
                  </div>
                )}
              </div>

              <div className="inspector-section">
                <h4>⚡ Student Change History & Audit Timeline ({studentActivities.length} events)</h4>
                {studentActivities.length === 0 ? (
                  <div className="inspector-empty-timeline">
                    <p>No recent activity changes recorded yet for this student.</p>
                  </div>
                ) : (
                  <div className="inspector-timeline-list">
                    {studentActivities.map((act) => (
                      <div key={act.id} className="inspector-timeline-item">
                        <span className="timeline-dot"></span>
                        <div className="timeline-content">
                          <div className="timeline-heading">
                            <strong>{act.action_title}</strong>
                            <span className="timeline-time">
                              {act.created_at || (act.timestamp ? new Date(act.timestamp).toLocaleString() : "")}
                            </span>
                          </div>
                          <span className={`action-type-pill ${act.action_type.toLowerCase().replace(/^2fa/, "twofa")}`}>
                            {act.action_type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="primary-btn" onClick={() => setSelectedStudent(null)}>
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
