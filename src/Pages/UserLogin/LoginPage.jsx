import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
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
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email || !password) {
      setMessage("Please enter your registered email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:8000/api/auth/login", {
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
        setMessage(data.detail || data.message || "Invalid credentials. Please try again.");
        return;
      }

      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
      } else if (data.token) {
        localStorage.setItem("token", data.token);
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      setMessage("Welcome back! Redirecting to your dashboard...");

      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (error) {
      console.error(error);
      setMessage("Backend server is not reachable. Please ensure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/api/auth/google";
  };

  return (
    <div className="login-page">
      {/* LEFT BRAND SECTION */}
      <div className="login-left">
        <div className="brand" onClick={() => navigate("/")}>
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
            <p>Sign in to access your developer career dashboard.</p>
          </div>

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
                placeholder="developer@example.com"
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
        </div>
      </div>
    </div>
  );
};

export default LoginPage;