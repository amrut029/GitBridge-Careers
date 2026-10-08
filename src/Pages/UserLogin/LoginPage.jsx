import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import "./LoginPage.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const LoginPage = () => {
  const navigate = useNavigate();
  const { user: currentAuthUser, token: currentToken, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      navigate(`/google-success?token=${encodeURIComponent(token)}`, { replace: true });
      return;
    }

    const err = params.get("error");
    if (err) {
      if (err === "csrf_state_mismatch") {
        setMessage("Google login verification expired. Please try again.");
      } else if (err === "google_cancelled") {
        setMessage("Google login was cancelled.");
      } else {
        setMessage("Google sign-in could not be completed. Please try again.");
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email || !password) {
      setMessage("Please enter your registered email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const detail = data.detail;
        const msg = typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((d) => d.msg || JSON.stringify(d)).join(", ")
            : data.message || "Invalid credentials. Please try again.";
        setMessage(msg);
        return;
      }

      const authToken = data.access_token || data.token;
      const userRole = data.user?.role || "student";

      if (authToken) {
        if (userRole === "admin") {
          localStorage.setItem("gb_admin_token", authToken);
          localStorage.setItem("admin_token", authToken);
          localStorage.setItem("admin_user", JSON.stringify(data.user));
        }
        login(authToken, data.user);
      }

      setMessage("Welcome back! Redirecting to your dashboard...");

      setTimeout(() => {
        if (userRole === "admin") {
          navigate("/admin");
        } else if (userRole === "recruiter") {
          navigate("/recruiter");
        } else {
          navigate("/dashboard");
        }
      }, 350);
    } catch (error) {
      console.error(error);
      setMessage("Backend server is not reachable. Please ensure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };

  return (
    <div className="login-page">
      {/* LEFT BRAND SECTION */}
      <div className="login-left">
        <div className="brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <div className="brand-logo">⚡</div>
          <h1>GitBridge Careers</h1>
        </div>

        <div className="left-content">
          <div className="badge">CAREER PLATFORM</div>

          <h2>
            Build your future.
            <br />
            <span>One commit at a time.</span>
          </h2>

          <p>
            Connect your skills, projects and GitHub profile to discover better internships, job opportunities, and personalized engineering roadmaps.
          </p>

          <div className="features">
            <div className="feature">
              <div className="feature-icon">✓</div>
              <div>
                <h4>Real GitHub Analytics</h4>
                <p>Private & public repo evaluation with ML scoring.</p>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">✓</div>
              <div>
                <h4>ATS Resume Intelligence</h4>
                <p>Extract skills, detect gaps & optimize ATS match.</p>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">✓</div>
              <div>
                <h4>Verified Tech Opportunities</h4>
                <p>Matching roles from high-growth startups & scale-ups.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="copyright">© 2026 GitBridge Careers • Built for Developers</div>
      </div>

      {/* RIGHT SIGN IN SECTION */}
      <div className="login-right">
        <div className="login-box">
          <div className="login-header">
            <h2>Welcome back</h2>
            <p>Sign in to access your GitBridge dashboard.</p>
          </div>

          {currentAuthUser && (
            <div style={{
              background: "rgba(56, 189, 248, 0.1)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              borderRadius: "8px",
              padding: "10px 14px",
              marginBottom: "16px",
              fontSize: "12px",
              color: "#e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px"
            }}>
              <div>
                <span style={{ color: "#94a3b8", display: "block", fontSize: "11px" }}>Current Session:</span>
                <strong style={{ color: "#38bdf8" }}>{currentAuthUser.email}</strong> ({currentAuthUser.role})
              </div>
              <button
                type="button"
                style={{
                  background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
                  color: "#0f172a",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: "6px",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontSize: "11px",
                  whiteSpace: "nowrap"
                }}
                onClick={() => {
                  if (currentAuthUser.role === "admin") navigate("/admin");
                  else if (currentAuthUser.role === "recruiter") navigate("/recruiter");
                  else navigate("/dashboard");
                }}
              >
                Go to Dashboard →
              </button>
            </div>
          )}

          {/* GOOGLE SIGN IN */}
          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleLogin}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M21.35 11.1H12v2.98h5.34c-.23 1.28-.94 2.36-2 3.08v2.51h3.23c1.89-1.74 2.78-4.3 2.78-7.31 0-.73-.06-1.43-.18-2.1z"
              />
              <path
                fill="#34A853"
                d="M12 21c2.7 0 4.96-.9 6.61-2.44l-3.23-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0012 21z"
              />
              <path
                fill="#FBBC05"
                d="M6.41 12.89A5.99 5.99 0 016.1 11c0-.66.11-1.3.31-1.89V6.52H3.07A10 10 0 002 11c0 1.61.39 3.13 1.07 4.48l3.34-2.59z"
              />
              <path
                fill="#EA4335"
                d="M12 4.99c1.47 0 2.79.51 3.83 1.51l2.87-2.87C16.95 2 14.7 1 12 1a10 10 0 00-8.93 5.52l3.34 2.59C7.2 6.75 9.4 4.99 12 4.99z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* DIVIDER */}
          <div className="divider">
            <span></span>
            <p>OR SIGN IN WITH EMAIL</p>
            <span></span>
          </div>

          {/* LOGIN FORM */}
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <div className="password-label">
                <label>Password</label>
                <button
                  type="button"
                  className="forgot-password"
                  onClick={() => alert("Password reset link will be sent to your email.")}
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {message && (
              <div className={`message ${message.includes("Welcome") ? "success" : "error"}`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          {/* FOOTER */}
          <div className="signup-text">
            <p>Don't have an account?</p>
            <button type="button" onClick={() => navigate("/signup")}>Create account</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;