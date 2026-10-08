import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import "./RecruiterDashboard.css";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api/recruiter";

const emptyOppForm = {
  title: "",
  type: "Full-time",
  domain: "software",
  location: "Remote",
  stipend: "",
  experience: "0-2 Years",
  required_skills: "",
  apply_url: "",
  deadline: "",
  description: "",
  status: "Published",
};

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout, setUser } = useAuth();

  const [activeTab, setActiveTab] = useState("overview"); // overview, opportunities, applicants, profile
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [notificationsList, setNotificationsList] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Opportunity Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingOpp, setEditingOpp] = useState(null);
  const [oppForm, setOppForm] = useState(emptyOppForm);
  const [savingOpp, setSavingOpp] = useState(false);

  // Candidate Details Modal
  const [selectedCandidateApp, setSelectedCandidateApp] = useState(null);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [candidateModalData, setCandidateModalData] = useState(null);

  // AI Matching Candidates Discovery Modal for an Opportunity
  const [matchingOppModal, setMatchingOppModal] = useState(null);
  const [matchedCandidates, setMatchedCandidates] = useState([]);
  const [matchedLoading, setMatchedLoading] = useState(false);

  // Search & Filter
  const [oppSearch, setOppSearch] = useState("");
  const [applicantSearch, setApplicantSearch] = useState("");
  const [selectedOppFilter, setSelectedOppFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Profile Form
  const [profileForm, setProfileForm] = useState({
    name: "",
    company: "",
    website: "",
    location: "",
    phone: "",
    about: "",
    linkedin: "",
    logo: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const notify = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 4000);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/dashboard`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Auth-Token": token,
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Unable to load recruiter dashboard.");
      }

      const res = await response.json();
      setData(res);

      // Prepopulate profile if not already edited
      setProfileForm({
        name: user?.name || "",
        company: res.company || user?.company || "",
        website: res.website || "",
        location: res.location || "",
        phone: res.phone || "",
        about: res.about || "",
        linkedin: res.linkedin || "",
        logo: res.logo || "",
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Auth-Token": token,
        },
      });
      if (res.ok) {
        const d = await res.json();
        setNotificationsList(d.notifications || []);
      }
    } catch (e) {
      // silently ignore
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
      fetchNotifications();
    }
  }, [token]);

  // Handle Opportunity Create or Update
  const handleSaveOpportunity = async (e) => {
    e.preventDefault();
    if (!oppForm.title.trim()) {
      notify("Please provide an opportunity title.", "error");
      return;
    }

    try {
      setSavingOpp(true);
      const url = editingOpp
        ? `${API_BASE}/opportunities/${editingOpp.id}`
        : `${API_BASE}/opportunities`;
      const method = editingOpp ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Auth-Token": token,
        },
        body: JSON.stringify(oppForm),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.detail || "Failed to save opportunity.");
      }

      notify(
        editingOpp
          ? "Opportunity updated successfully!"
          : "Opportunity published successfully!",
        "success"
      );
      setShowModal(false);
      setEditingOpp(null);
      setOppForm(emptyOppForm);
      fetchDashboardData();
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSavingOpp(false);
    }
  };

  // Toggle Opportunity Active/Inactive
  const handleToggleStatus = async (opp) => {
    try {
      const response = await fetch(`${API_BASE}/opportunities/${opp.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Auth-Token": token,
        },
        body: JSON.stringify({ is_active: !opp.is_active }),
      });

      if (!response.ok) {
        throw new Error("Unable to change opportunity status.");
      }

      notify(
        `Opportunity ${!opp.is_active ? "published & active" : "closed / deactivated"}.`,
        "success"
      );
      fetchDashboardData();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  // Delete Opportunity
  const handleDeleteOpp = async (opp) => {
    if (!window.confirm(`Are you sure you want to delete "${opp.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/opportunities/${opp.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Auth-Token": token,
        },
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.detail || "Unable to delete opportunity.");
      }

      notify("Opportunity deleted successfully.", "success");
      fetchDashboardData();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (opp) => {
    setEditingOpp(opp);
    setOppForm({
      title: opp.title || "",
      type: opp.type || "Full-time",
      domain: opp.domain || "software",
      location: opp.location || "Remote",
      stipend: opp.stipend || opp.salary || "",
      experience: opp.experience || "0-2 Years",
      required_skills: Array.isArray(opp.required_skills)
        ? opp.required_skills.join(", ")
        : opp.required_skills || "",
      apply_url: opp.apply_url || "",
      deadline: opp.deadline || "",
      description: opp.description || "",
      status: opp.status || (opp.is_active !== false ? "Published" : "Closed"),
    });
    setShowModal(true);
  };

  // Open Candidate Details Modal
  const handleOpenCandidateDetails = async (app) => {
    setSelectedCandidateApp(app);
    setCandidateLoading(true);
    setCandidateModalData(null);
    try {
      const response = await fetch(`${API_BASE}/applications/${app.id}/candidate`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Auth-Token": token,
        },
      });
      if (response.ok) {
        const details = await response.json();
        setCandidateModalData(details);
      } else {
        // Fallback to application data
        setCandidateModalData({
          application_id: app.id,
          status: app.status,
          recruiter_notes: app.recruiter_notes,
          student: {
            name: app.student_name,
            email: app.student_email,
            phone: app.student_phone,
            target_role: app.target_role,
          },
          resume: {
            skills: app.skills || [],
            ats_score: app.ats_score || 0,
            filename: app.resume_filename,
          },
          github: {
            username: app.github_username,
            repositories: [],
          },
          match_analysis: app.match_analysis || {
            overall_match: app.match_score || 75,
            skills_match: app.skills_match || 75,
            github_match: app.github_match || 60,
            resume_match: app.resume_match || 65,
            experience_match: app.experience_match || 80,
            recommendation: app.recommendation || "Good Match",
            explanation: app.explanation || "Candidate matches key requirements.",
            matched_skills: app.matched_skills || [],
            missing_skills: app.missing_skills || [],
          },
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCandidateLoading(false);
    }
  };

  // Open AI Matched Candidates Discovery Modal for an Opportunity
  const handleOpenAiMatches = async (opp) => {
    setMatchingOppModal(opp);
    setMatchedLoading(true);
    setMatchedCandidates([]);
    try {
      const res = await fetch(`${API_BASE}/opportunities/${opp.id}/matched-candidates`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Auth-Token": token,
        },
      });
      if (res.ok) {
        const d = await res.json();
        setMatchedCandidates(d.candidates || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMatchedLoading(false);
    }
  };

  // Update Applicant Status
  const handleApplicantStatusChange = async (appId, newStatus, currentNotes) => {
    try {
      const response = await fetch(`${API_BASE}/applications/${appId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Auth-Token": token,
        },
        body: JSON.stringify({ status: newStatus, notes: currentNotes || "" }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to update status.");
      }

      notify(`Application status updated to "${newStatus}". Student notified!`, "success");
      if (candidateModalData && candidateModalData.application_id === appId) {
        setCandidateModalData((prev) => ({ ...prev, status: newStatus }));
      }
      fetchDashboardData();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  // Save Recruiter Notes for Applicant
  const handleSaveNotes = async (appId, notes, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE}/applications/${appId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Auth-Token": token,
        },
        body: JSON.stringify({ status: currentStatus, notes: notes }),
      });

      if (!response.ok) {
        throw new Error("Unable to save notes.");
      }

      notify("Recruiter notes saved successfully.", "success");
      fetchDashboardData();
    } catch (err) {
      notify(err.message, "error");
    }
  };

  // Save Company Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const response = await fetch(`${API_BASE}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Auth-Token": token,
        },
        body: JSON.stringify(profileForm),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.detail || "Failed to update company profile.");
      }

      notify("Company profile saved successfully!", "success");
      if (resData.profile && setUser) {
        setUser((prev) => ({ ...prev, ...resData.profile }));
      }
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const isApproved = data?.status === "approved" || data?.status === "verified" || user?.recruiter_status === "approved" || user?.recruiter_status === "verified";
  const myOpportunities = data?.opportunities || [];
  const myApplications = data?.applications || [];

  // Filtered Opportunities
  const filteredOpps = myOpportunities.filter((o) => {
    if (!oppSearch.trim()) return true;
    const q = oppSearch.toLowerCase();
    return (
      o.title?.toLowerCase().includes(q) ||
      o.location?.toLowerCase().includes(q) ||
      o.domain?.toLowerCase().includes(q) ||
      (Array.isArray(o.required_skills) &&
        o.required_skills.some((s) => s.toLowerCase().includes(q)))
    );
  });

  // Filtered Applicants
  const filteredApplicants = myApplications.filter((a) => {
    const matchesOpp =
      selectedOppFilter === "all" || a.opportunity_id === selectedOppFilter;
    if (!matchesOpp) return false;

    const matchesStatus =
      statusFilter === "all" ||
      a.status?.toLowerCase() === statusFilter.toLowerCase();
    if (!matchesStatus) return false;

    if (!applicantSearch.trim()) return true;
    const q = applicantSearch.toLowerCase();
    return (
      a.student_name?.toLowerCase().includes(q) ||
      a.student_email?.toLowerCase().includes(q) ||
      a.opportunity_title?.toLowerCase().includes(q) ||
      (Array.isArray(a.skills) &&
        a.skills.some((s) => s.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="recruiter-container">
      {/* NAVBAR */}
      <nav className="recruiter-nav">
        <div className="brand" onClick={() => navigate("/")}>
          <div className="brand-logo">⚡</div>
          <h1>GitBridge Recruiter</h1>
        </div>

        <div className="recruiter-nav-actions">
          {/* Notifications Trigger */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              className="small-btn"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              style={{ position: "relative" }}
            >
              🔔 Notifications {notificationsList.length > 0 && <span style={{ marginLeft: 4, background: "#8b5cf6", color: "#fff", borderRadius: "50%", padding: "1px 6px", fontSize: "10px" }}>{notificationsList.length}</span>}
            </button>

            {showNotifDropdown && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  width: 320,
                  background: "#111226",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  padding: 14,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  zIndex: 200,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <strong style={{ fontSize: "13px", color: "#fff" }}>Recent Activity</strong>
                  <button className="small-btn" style={{ fontSize: "10px", padding: "2px 6px" }} onClick={() => setShowNotifDropdown(false)}>✕</button>
                </div>
                {notificationsList.length === 0 ? (
                  <p style={{ fontSize: "12px", color: "#94a3b8", margin: "10px 0" }}>No notifications yet.</p>
                ) : (
                  <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                    {notificationsList.map((n, i) => (
                      <div key={i} style={{ background: "rgba(255,255,255,0.03)", padding: 8, borderRadius: 8, borderLeft: "3px solid #8b5cf6" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#e2e8f0" }}>{n.title}</div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: 2 }}>{n.message}</div>
                        <div style={{ fontSize: "9px", color: "#64748b", marginTop: 4 }}>{n.time ? new Date(n.time).toLocaleString() : ""}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="user-badge">
            <span>{profileForm.company || user?.name || "Recruiter"}</span>
            <span
              className={`status-pill ${
                isApproved ? "approved" : data?.status || "pending"
              }`}
            >
              {isApproved ? "✓ Verified Recruiter" : data?.status || "Pending Verification"}
            </span>
          </div>
          <button
            className="logout-btn"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* PENDING NOTIFICATION BANNER */}
      {!isApproved && (
        <div className="pending-alert-banner">
          <div>
            ⚠️ <strong>Verification Pending:</strong> Your recruiter account is
            currently awaiting administrator approval. You can complete your
            company profile now; posting opportunities and candidate actions will
            unlock upon approval.
          </div>
          <button
            className="small-btn"
            onClick={() => setActiveTab("profile")}
          >
            Complete Profile →
          </button>
        </div>
      )}

      {/* NOTIFICATION TOAST */}
      {notification.message && (
        <div
          style={{
            position: "fixed",
            top: 75,
            right: 24,
            padding: "12px 20px",
            borderRadius: 8,
            background:
              notification.type === "error"
                ? "rgba(239, 68, 68, 0.95)"
                : "rgba(34, 197, 94, 0.95)",
            color: "#fff",
            zIndex: 9999,
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          {notification.message}
        </div>
      )}

      {/* TABS */}
      <div className="recruiter-tabs-bar">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button
          className={`tab-btn ${activeTab === "opportunities" ? "active" : ""}`}
          onClick={() => setActiveTab("opportunities")}
        >
          💼 Opportunities ({myOpportunities.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "applicants" ? "active" : ""}`}
          onClick={() => setActiveTab("applicants")}
        >
          👥 Applications ({myApplications.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          🏢 Company Profile
        </button>
      </div>

      {/* MAIN BODY */}
      <main className="recruiter-main">
        {error && (
          <div
            style={{
              padding: 16,
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: 8,
              color: "#fca5a5",
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {loading && !data ? (
          <div className="empty-state">Loading recruiter workspace...</div>
        ) : (
          <>
            {/* 1. OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">💼</div>
                    <div className="stat-info">
                      <h3>Total Postings</h3>
                      <p>{data?.stats?.total_opportunities || 0}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">⚡</div>
                    <div className="stat-info">
                      <h3>Active Listings</h3>
                      <p>{data?.stats?.active_opportunities || 0}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                      <h3>Total Applicants</h3>
                      <p>{data?.stats?.total_applications || 0}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-info">
                      <h3>Pending Review</h3>
                      <p>{data?.stats?.pending_review || 0}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-info">
                      <h3>Shortlisted</h3>
                      <p>{data?.stats?.shortlisted || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="section-header">
                  <div>
                    <h2>Recent Opportunities</h2>
                    <p>Manage your open tech opportunities and candidate pipelines.</p>
                  </div>
                  <button
                    className="action-btn"
                    disabled={!isApproved}
                    onClick={() => {
                      setEditingOpp(null);
                      setOppForm(emptyOppForm);
                      setShowModal(true);
                    }}
                  >
                    + Post New Opportunity
                  </button>
                </div>

                <div className="card-table-wrapper">
                  <table className="recruiter-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Type / Domain</th>
                        <th>Location</th>
                        <th>Applicants</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myOpportunities.slice(0, 5).map((opp) => (
                        <tr key={opp.id}>
                          <td>
                            <strong>{opp.title}</strong>
                            <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: 4 }}>
                              {opp.company}
                            </div>
                          </td>
                          <td>
                            {opp.type} • {opp.domain}
                          </td>
                          <td>{opp.location}</td>
                          <td>
                            <button
                              type="button"
                              className="small-btn"
                              onClick={() => {
                                setSelectedOppFilter(opp.id);
                                setActiveTab("applicants");
                              }}
                            >
                              👥 {opp.applications_count || 0} Applicants
                            </button>
                          </td>
                          <td>
                            <span
                              className={`status-pill ${
                                opp.is_active !== false ? "approved" : "rejected"
                              }`}
                            >
                              {opp.is_active !== false ? "Active" : "Closed"}
                            </span>
                          </td>
                          <td>
                            <div className="btn-row">
                              <button
                                className="small-btn"
                                onClick={() => handleOpenAiMatches(opp)}
                                title="Discover high-matching students"
                              >
                                🎯 AI Matches
                              </button>
                              <button
                                className="small-btn"
                                onClick={() => handleOpenEdit(opp)}
                              >
                                Edit
                              </button>
                              <button
                                className="small-btn"
                                onClick={() => handleToggleStatus(opp)}
                              >
                                {opp.is_active !== false ? "Close" : "Publish"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {myOpportunities.length === 0 && (
                    <div className="empty-state">
                      No opportunities posted yet. Click "+ Post New Opportunity" to get started.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. OPPORTUNITIES TAB */}
            {activeTab === "opportunities" && (
              <div>
                <div className="section-header">
                  <div>
                    <h2>Opportunity Postings</h2>
                    <p>Create, update and manage developer listings for your company.</p>
                  </div>
                  <button
                    className="action-btn"
                    disabled={!isApproved}
                    onClick={() => {
                      setEditingOpp(null);
                      setOppForm(emptyOppForm);
                      setShowModal(true);
                    }}
                  >
                    + Post Opportunity
                  </button>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <input
                    type="search"
                    placeholder="Search by title, location, skill..."
                    value={oppSearch}
                    onChange={(e) => setOppSearch(e.target.value)}
                    style={{
                      width: "100%",
                      maxWidth: 400,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      padding: "10px 14px",
                      color: "#fff",
                      outline: "none",
                    }}
                  />
                </div>

                <div className="card-table-wrapper">
                  <table className="recruiter-table">
                    <thead>
                      <tr>
                        <th>Title & Domain</th>
                        <th>Type & Compensation</th>
                        <th>Location</th>
                        <th>Skills</th>
                        <th>Applicants</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOpps.map((opp) => (
                        <tr key={opp.id}>
                          <td>
                            <strong>{opp.title}</strong>
                            <div style={{ color: "#a78bfa", fontSize: "12px", marginTop: 3 }}>
                              Domain: {opp.domain}
                            </div>
                          </td>
                          <td>
                            <div>{opp.type}</div>
                            <small style={{ color: "#94a3b8" }}>
                              {opp.stipend || opp.salary || "Competitive"}
                            </small>
                          </td>
                          <td>{opp.location}</td>
                          <td>
                            <div className="skills-tags">
                              {(Array.isArray(opp.required_skills)
                                ? opp.required_skills
                                : []
                              )
                                .slice(0, 3)
                                .map((s) => (
                                  <span key={s} className="skill-tag">
                                    {s}
                                  </span>
                                ))}
                            </div>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="small-btn"
                              onClick={() => {
                                setSelectedOppFilter(opp.id);
                                setActiveTab("applicants");
                              }}
                            >
                              👥 {opp.applications_count || 0}
                            </button>
                          </td>
                          <td>
                            <span
                              className={`status-pill ${
                                opp.is_active !== false ? "approved" : "rejected"
                              }`}
                            >
                              {opp.is_active !== false ? "Published" : "Closed"}
                            </span>
                          </td>
                          <td>
                            <div className="btn-row">
                              <button
                                className="small-btn"
                                onClick={() => handleOpenAiMatches(opp)}
                                title="Run AI candidate matching"
                              >
                                🎯 AI Matches
                              </button>
                              <button
                                className="small-btn"
                                onClick={() => handleOpenEdit(opp)}
                              >
                                Edit
                              </button>
                              <button
                                className="small-btn"
                                onClick={() => handleToggleStatus(opp)}
                              >
                                {opp.is_active !== false ? "Close" : "Publish"}
                              </button>
                              <button
                                className="small-btn delete"
                                onClick={() => handleDeleteOpp(opp)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredOpps.length === 0 && (
                    <div className="empty-state">No opportunities found matching your criteria.</div>
                  )}
                </div>
              </div>
            )}

            {/* 3. APPLICANTS TAB */}
            {activeTab === "applicants" && (
              <div>
                <div className="section-header">
                  <div>
                    <h2>Candidate Applications</h2>
                    <p>Review candidate profiles, verify skills, inspect AI matches, and update hiring workflow.</p>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <select
                      value={selectedOppFilter}
                      onChange={(e) => setSelectedOppFilter(e.target.value)}
                      className="status-select"
                      style={{ minWidth: 180 }}
                    >
                      <option value="all">All Opportunities</option>
                      {myOpportunities.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.title}
                        </option>
                      ))}
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="status-select"
                      style={{ minWidth: 150 }}
                    >
                      <option value="all">All Statuses</option>
                      <option value="applied">Applied</option>
                      <option value="under review">Under Review</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interview">Interview</option>
                      <option value="selected">Selected</option>
                      <option value="rejected">Rejected</option>
                    </select>

                    <input
                      type="search"
                      placeholder="Search name, skills, email..."
                      value={applicantSearch}
                      onChange={(e) => setApplicantSearch(e.target.value)}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 8,
                        padding: "8px 14px",
                        color: "#fff",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div className="applicants-grid">
                  {filteredApplicants.map((app) => (
                    <div key={app.id} className="applicant-card">
                      <div className="applicant-header">
                        <div className="applicant-title">
                          <h3>{app.student_name}</h3>
                          <p>{app.student_email}</p>
                          {app.student_phone && (
                            <small style={{ color: "#71717a" }}>📞 {app.student_phone}</small>
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          <span
                            className={`status-pill ${
                              app.status === "Selected" || app.status === "Shortlisted"
                                ? "approved"
                                : app.status === "Rejected"
                                ? "rejected"
                                : "pending"
                            }`}
                          >
                            {app.status}
                          </span>
                          {app.match_score && (
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#38bdf8" }}>
                              🎯 {app.match_score}% AI Match
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: "13px", color: "#cbd5e1" }}>
                        <strong>Applied for:</strong> {app.opportunity_title}
                        <br />
                        <small style={{ color: "#94a3b8" }}>
                          Applied on:{" "}
                          {app.applied_at
                            ? new Date(app.applied_at).toLocaleDateString()
                            : "Recent"}
                        </small>
                      </div>

                      {/* AI Matching Recommendation Pill */}
                      {app.recommendation && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "12px" }}>
                          <span style={{ color: "#94a3b8" }}>AI Verdict:</span>
                          <span
                            className={`recommendation-pill ${
                              app.recommendation === "Strong Candidate"
                                ? "rec-strong"
                                : app.recommendation === "Good Match"
                                ? "rec-good"
                                : "rec-needs"
                            }`}
                          >
                            {app.recommendation}
                          </span>
                        </div>
                      )}

                      {app.skills && app.skills.length > 0 && (
                        <div>
                          <small style={{ color: "#94a3b8", display: "block", marginBottom: 6 }}>
                            Candidate Skills:
                          </small>
                          <div className="skills-tags">
                            {app.skills.slice(0, 5).map((sk) => (
                              <span key={sk} className="skill-tag">
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* RECRUITER NOTES */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <small style={{ color: "#94a3b8" }}>Recruiter Internal Notes:</small>
                        <input
                          type="text"
                          defaultValue={app.recruiter_notes || ""}
                          placeholder="e.g. Cleared round 1, strong DSA"
                          onBlur={(e) =>
                            handleSaveNotes(app.id, e.target.value, app.status)
                          }
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 6,
                            padding: "6px 10px",
                            color: "#e2e8f0",
                            fontSize: "12px",
                            outline: "none",
                          }}
                        />
                      </div>

                      <div className="applicant-footer">
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <small style={{ color: "#94a3b8" }}>Status:</small>
                          <select
                            value={app.status || "Applied"}
                            onChange={(e) =>
                              handleApplicantStatusChange(
                                app.id,
                                e.target.value,
                                app.recruiter_notes
                              )
                            }
                            className="status-select"
                          >
                            <option value="Applied">Applied</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interview">Interview</option>
                            <option value="Selected">Selected</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          className="action-btn"
                          style={{ padding: "6px 14px", fontSize: "12px" }}
                          onClick={() => handleOpenCandidateDetails(app)}
                        >
                          View Profile & AI Match →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredApplicants.length === 0 && (
                  <div className="empty-state">
                    No candidate applications found for the selected filter.
                  </div>
                )}
              </div>
            )}

            {/* 4. COMPANY PROFILE TAB */}
            {activeTab === "profile" && (
              <div style={{ maxWidth: 740 }}>
                <div className="section-header">
                  <div>
                    <h2>Company & Recruiter Profile</h2>
                    <p>Manage your organization details, hiring branding, and verified status.</p>
                  </div>
                  <div>
                    <span
                      className={`status-pill ${
                        isApproved ? "approved" : "pending"
                      }`}
                    >
                      {isApproved ? "✓ Verified Recruiter" : "⏳ Pending Admin Review"}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 14,
                    padding: 28,
                  }}
                >
                  <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div className="form-group">
                      <label>Contact Person / Recruiter Name *</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, name: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Company / Organization Name *</label>
                      <input
                        type="text"
                        value={profileForm.company}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, company: e.target.value })
                        }
                        required
                        placeholder="e.g. Acme Technologies"
                      />
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label>Company Website</label>
                        <input
                          type="url"
                          value={profileForm.website}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, website: e.target.value })
                          }
                          placeholder="https://company.com"
                        />
                      </div>

                      <div className="form-group">
                        <label>LinkedIn Page / Profile</label>
                        <input
                          type="url"
                          value={profileForm.linkedin}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, linkedin: e.target.value })
                          }
                          placeholder="https://linkedin.com/company/..."
                        />
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label>Headquarters / Location</label>
                        <input
                          type="text"
                          value={profileForm.location}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, location: e.target.value })
                          }
                          placeholder="Bengaluru / Remote"
                        />
                      </div>

                      <div className="form-group">
                        <label>Recruiter Phone / Contact</label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, phone: e.target.value })
                          }
                          placeholder="+91 9876543210"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>About Company & Tech Culture</label>
                      <textarea
                        rows={4}
                        value={profileForm.about}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, about: e.target.value })
                        }
                        placeholder="Brief overview of your company mission, tech stack, and hiring culture..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="action-btn"
                      disabled={savingProfile}
                      style={{ alignSelf: "flex-start", marginTop: 8 }}
                    >
                      {savingProfile ? "Saving Profile..." : "Save Company Profile"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* CREATE / EDIT OPPORTUNITY MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !savingOpp && setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingOpp ? "Edit Opportunity" : "Post Tech Opportunity"}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOpportunity} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="form-group">
                <label>Job / Internship Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Backend Engineer (Python / FastAPI)"
                  value={oppForm.title}
                  onChange={(e) => setOppForm({ ...oppForm, title: e.target.value })}
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Role Type *</label>
                  <select
                    value={oppForm.type}
                    onChange={(e) => setOppForm({ ...oppForm, type: e.target.value })}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Engineering Domain *</label>
                  <select
                    value={oppForm.domain}
                    onChange={(e) => setOppForm({ ...oppForm, domain: e.target.value })}
                  >
                    <option value="software">Software & Web Development</option>
                    <option value="devops">Cloud & DevOps / SRE</option>
                    <option value="aiml">AI / Machine Learning</option>
                    <option value="embedded">Embedded / Systems</option>
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="Bengaluru / Remote / Hybrid"
                    value={oppForm.location}
                    onChange={(e) => setOppForm({ ...oppForm, location: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Stipend / Salary Range</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹50,000/mo or ₹12 - ₹18 LPA"
                    value={oppForm.stipend}
                    onChange={(e) => setOppForm({ ...oppForm, stipend: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Experience Level</label>
                  <input
                    type="text"
                    placeholder="e.g. Freshers (0-1 Yrs) / 2025 Batch"
                    value={oppForm.experience}
                    onChange={(e) => setOppForm({ ...oppForm, experience: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Application Deadline</label>
                  <input
                    type="text"
                    placeholder="e.g. 2026-06-30 or Immediate Hiring"
                    value={oppForm.deadline}
                    onChange={(e) => setOppForm({ ...oppForm, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Required Skills (Comma separated) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. React, Python, FastAPI, Docker, MongoDB"
                  value={oppForm.required_skills}
                  onChange={(e) => setOppForm({ ...oppForm, required_skills: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Direct Apply URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://company.com/apply (leave empty for internal platform application)"
                  value={oppForm.apply_url}
                  onChange={(e) => setOppForm({ ...oppForm, apply_url: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Job Description & Responsibilities</label>
                <textarea
                  rows={4}
                  placeholder="Describe the technical challenges, team goals, and expectations..."
                  value={oppForm.description}
                  onChange={(e) => setOppForm({ ...oppForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  className="small-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="action-btn"
                  disabled={savingOpp}
                >
                  {savingOpp ? "Saving..." : editingOpp ? "Save Changes" : "Publish Opportunity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANDIDATE DETAILS & AI MATCH MODAL */}
      {selectedCandidateApp && (
        <div className="candidate-modal-overlay" onClick={() => setSelectedCandidateApp(null)}>
          <div className="candidate-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="candidate-header-row">
              <div className="candidate-name-block">
                <h2>{candidateModalData?.student?.name || selectedCandidateApp.student_name}</h2>
                <p>
                  {candidateModalData?.student?.email || selectedCandidateApp.student_email}
                  {candidateModalData?.student?.phone && ` · 📞 ${candidateModalData.student.phone}`}
                  {candidateModalData?.student?.target_role && ` · 🎯 ${candidateModalData.student.target_role}`}
                </p>
              </div>

              <div className="match-score-badge">
                <span className="match-score-value">
                  {candidateModalData?.match_analysis?.overall_match || selectedCandidateApp.match_score || 75}%
                </span>
                <span
                  className={`recommendation-pill ${
                    (candidateModalData?.match_analysis?.recommendation || selectedCandidateApp.recommendation) === "Strong Candidate"
                      ? "rec-strong"
                      : (candidateModalData?.match_analysis?.recommendation || selectedCandidateApp.recommendation) === "Good Match"
                      ? "rec-good"
                      : "rec-needs"
                  }`}
                >
                  {candidateModalData?.match_analysis?.recommendation || selectedCandidateApp.recommendation || "Good Match"}
                </span>
              </div>
            </div>

            {/* WHY THIS CANDIDATE? */}
            <div className="why-candidate-box">
              <strong>🤖 AI Matching Assessment:</strong>
              <p>
                {candidateModalData?.match_analysis?.explanation ||
                  selectedCandidateApp.explanation ||
                  "Candidate demonstrates aligned foundational technical skills with verified repository history."}
              </p>
            </div>

            {/* BREAKDOWN METRICS */}
            <div className="metrics-breakdown-grid">
              <div className="metric-bar-card">
                <span>Skills Match</span>
                <strong>{candidateModalData?.match_analysis?.skills_match || 80}%</strong>
                <div className="metric-bar-track">
                  <div
                    className="metric-bar-fill fill-purple"
                    style={{ width: `${candidateModalData?.match_analysis?.skills_match || 80}%` }}
                  />
                </div>
              </div>

              <div className="metric-bar-card">
                <span>GitHub Alignment</span>
                <strong>{candidateModalData?.match_analysis?.github_match || 70}%</strong>
                <div className="metric-bar-track">
                  <div
                    className="metric-bar-fill fill-blue"
                    style={{ width: `${candidateModalData?.match_analysis?.github_match || 70}%` }}
                  />
                </div>
              </div>

              <div className="metric-bar-card">
                <span>Resume ATS Match</span>
                <strong>{candidateModalData?.match_analysis?.resume_match || 75}%</strong>
                <div className="metric-bar-track">
                  <div
                    className="metric-bar-fill fill-green"
                    style={{ width: `${candidateModalData?.match_analysis?.resume_match || 75}%` }}
                  />
                </div>
              </div>

              <div className="metric-bar-card">
                <span>Experience Fit</span>
                <strong>{candidateModalData?.match_analysis?.experience_match || 85}%</strong>
                <div className="metric-bar-track">
                  <div
                    className="metric-bar-fill fill-yellow"
                    style={{ width: `${candidateModalData?.match_analysis?.experience_match || 85}%` }}
                  />
                </div>
              </div>
            </div>

            {/* SKILLS COMPARISON */}
            <div className="candidate-detail-section">
              <h4>🎯 Matched vs Missing Skills</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <small style={{ color: "#4ade80", display: "block", marginBottom: 4 }}>✓ Matched Requirements:</small>
                  <div className="skills-pill-row">
                    {(candidateModalData?.match_analysis?.matched_skills || []).length > 0 ? (
                      candidateModalData.match_analysis.matched_skills.map((s) => (
                        <span key={s} className="skill-match-tag">✓ {s}</span>
                      ))
                    ) : (
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>General software engineering alignment</span>
                    )}
                  </div>
                </div>

                {(candidateModalData?.match_analysis?.missing_skills || []).length > 0 && (
                  <div>
                    <small style={{ color: "#f87171", display: "block", marginBottom: 4 }}>⚠️ Missing / Upskilling Needed:</small>
                    <div className="skills-pill-row">
                      {candidateModalData.match_analysis.missing_skills.map((s) => (
                        <span key={s} className="skill-missing-tag">○ {s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* GITHUB REPOSITORIES & PROJECTS */}
            {candidateModalData?.github?.username && (
              <div className="candidate-detail-section">
                <h4>
                  🐙 GitHub Profile: @{candidateModalData.github.username}
                  <a
                    href={`https://github.com/${candidateModalData.github.username}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#8b5cf6", fontSize: "12px", textDecoration: "underline", marginLeft: 6 }}
                  >
                    View on GitHub ↗
                  </a>
                </h4>
                {candidateModalData.github.repositories && candidateModalData.github.repositories.length > 0 ? (
                  <div className="candidate-repos-grid">
                    {candidateModalData.github.repositories.slice(0, 4).map((repo, idx) => (
                      <div key={idx} className="candidate-repo-item">
                        <strong>{repo.name}</strong>
                        <p>{repo.description || "Public repository with source code."}</p>
                        <small>{repo.language || "Code"} · ⭐ {repo.stars}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                    Repositories: {candidateModalData.github?.stats?.repositories || 0} · Stars: {candidateModalData.github?.stats?.stars || 0}
                  </p>
                )}
              </div>
            )}

            {/* STATUS ACTION & NOTES */}
            <div className="candidate-modal-actions">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "13px", color: "#cbd5e1" }}>Application Stage:</span>
                <select
                  value={candidateModalData?.status || selectedCandidateApp.status || "Applied"}
                  onChange={(e) =>
                    handleApplicantStatusChange(
                      selectedCandidateApp.id,
                      e.target.value,
                      candidateModalData?.recruiter_notes || selectedCandidateApp.recruiter_notes
                    )
                  }
                  className="status-select"
                >
                  <option value="Applied">Applied</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Interview">Interview</option>
                  <option value="Selected">Selected</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <button
                type="button"
                className="action-btn"
                onClick={() => setSelectedCandidateApp(null)}
              >
                Close Candidate Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI MATCHED CANDIDATES DISCOVERY MODAL */}
      {matchingOppModal && (
        <div className="candidate-modal-overlay" onClick={() => setMatchingOppModal(null)}>
          <div className="candidate-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="candidate-header-row">
              <div>
                <h2>🎯 AI Candidate Matching Engine</h2>
                <p>Top candidate profiles across GitBridge matching "{matchingOppModal.title}"</p>
              </div>
              <button className="close-btn" onClick={() => setMatchingOppModal(null)}>✕</button>
            </div>

            {matchedLoading ? (
              <div className="empty-state">Calculating AI skill & repo match vectors...</div>
            ) : matchedCandidates.length === 0 ? (
              <div className="empty-state">No matching students found in the platform yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {matchedCandidates.map((cand) => (
                  <div
                    key={cand.student_id}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      padding: "16px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <div>
                      <h4 style={{ margin: "0 0 4px 0", color: "#fff", fontSize: "15px" }}>{cand.name}</h4>
                      <p style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#94a3b8" }}>
                        {cand.target_role || "Engineering Candidate"} · {cand.email}
                      </p>
                      <div className="skills-tags">
                        {(cand.skills || []).slice(0, 4).map((s) => (
                          <span key={s} className="skill-tag">{s}</span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <span style={{ fontSize: "20px", fontWeight: 800, color: "#38bdf8" }}>
                        {cand.match_analysis?.overall_match}%
                      </span>
                      <span
                        className={`recommendation-pill ${
                          cand.match_analysis?.recommendation === "Strong Candidate"
                            ? "rec-strong"
                            : "rec-good"
                        }`}
                      >
                        {cand.match_analysis?.recommendation}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;
