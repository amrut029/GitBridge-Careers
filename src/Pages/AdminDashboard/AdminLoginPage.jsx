import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLoginPage.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const AdminLoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSuccess(false);

    if (!email || !password) {
      setMessage("Please enter authorized admin credentials.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/api/auth/admin-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || data.message || "Invalid administrative credentials.");
        return;
      }

      // Store admin session across all keys
      localStorage.setItem("admin_token", data.access_token);
      localStorage.setItem("admin_user", JSON.stringify(data.user));
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("gb_admin_token", data.access_token);

      setIsSuccess(true);
      setMessage("Admin identity verified. Launching Enterprise Console...");

      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 700);
    } catch (error) {
      console.error(error);
      setMessage("Backend service is offline. Please ensure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = () => {
    setEmail("admin@gitbridge.com");
    setPassword("Admin@GitBridge2026");
    setMessage("Admin credentials auto-filled. Click 'Authorize & Login'.");
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        {/* PORTAL SWITCHER TABS */}
        <div className="portal-switcher">
          <button 
            type="button" 
            className="portal-tab"
            onClick={() => navigate("/login")}
          >
            🎓 Student / Candidate Portal
          </button>
          <button 
            type="button" 
            className="portal-tab active"
          >
            🛡️ Enterprise Admin Portal
          </button>
        </div>

        <div className="admin-login-card">
          <div className="admin-badge">
            <span className="shield-icon">🛡️</span>
            <span>RESTRICTED ACCESS • ADMIN ONLY</span>
          </div>

          <h2 className="admin-title">GitBridge Control Center</h2>
          <p className="admin-subtitle">
            Secure enterprise management console. Sign in with designated administrative credentials to oversee all candidate records, telemetry, and platform operations.
          </p>

          {message && (
            <div className={`admin-alert ${isSuccess ? "success" : "error"}`}>
              {isSuccess ? "✓ " : "⚠️ "} {message}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="admin-form">
            <div className="form-group">
              <label htmlFor="admin-email">Admin Special Email</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gitbridge.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-password">Master Security Key</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="admin-submit-btn" disabled={loading}>
              {loading ? "Verifying Credentials..." : "Authorize & Enter Console →"}
            </button>
          </form>

          {/* QUICK DEMO CREDENTIAL HELPER */}
          <div className="credentials-hint">
            <div className="hint-header">
              <span>🔑 Default Master Admin:</span>
              <button type="button" className="autofill-btn" onClick={handleAutoFill}>
                Autofill
              </button>
            </div>
            <code>admin@gitbridge.com • Admin@GitBridge2026</code>
          </div>

          <div className="admin-card-footer">
            <button 
              type="button" 
              className="back-home-link"
              onClick={() => navigate("/")}
            >
              ← Return to Public Homepage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
