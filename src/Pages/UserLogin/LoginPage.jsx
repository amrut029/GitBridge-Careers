import { useEffect, useState } from "react";
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

  // ==============================
  // NORMAL LOGIN
  // ==============================

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");

    if (!email || !password) {
      setMessage("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:8000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || data.message || "Login failed");
        return;
      }

      console.log("Login Success:", data);

      // Token save
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
      } else if (data.token) {
        localStorage.setItem("token", data.token);
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      setMessage("Login successful!");

      // Dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 600);

    } catch (error) {
      console.error(error);
      setMessage("Server connection failed. Please ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // GOOGLE LOGIN
  // ==============================

  const handleGoogleLogin = () => {
    window.location.href =
      "http://localhost:8000/api/auth/google";
  };

  return (
    <div className="login-page">

      {/* LEFT SIDE */}
      <div className="login-left">

        <div className="brand">

          <div className="brand-logo">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 2C6.48 2 2 6.58 2 12.23C2 16.75 4.87 20.58 8.84 21.93C9.34 22.03 9.52 21.71 9.52 21.43V19.61C6.73 20.23 6.14 18.4 6.14 18.4C5.68 17.18 5.02 16.85 5.02 16.85C4.11 16.21 5.09 16.22 5.09 16.22C6.1 16.29 6.63 17.29 6.63 17.29C7.53 18.88 8.99 18.42 9.56 18.14C9.65 17.47 9.91 17.01 10.19 16.75C7.96 16.49 5.62 15.6 5.62 11.65C5.62 10.52 6.01 9.6 6.65 8.88C6.55 8.62 6.2 7.57 6.75 6.15C6.75 6.15 7.59 5.88 9.5 7.2C10.29 6.98 11.15 6.87 12 6.87C12.85 6.87 13.71 6.98 14.5 7.2C16.41 5.88 17.25 6.15 17.25 6.15C17.8 7.57 17.45 8.62 17.35 8.88C17.99 9.6 18.38 10.52 18.38 11.65C18.38 15.61 16.03 16.48 13.79 16.74C14.14 17.05 14.45 17.66 14.45 18.59V21.43C14.45 21.71 14.63 22.04 15.14 21.93C19.11 20.58 22 16.75 22 12.23C22 6.58 17.52 2 12 2Z"
                fill="currentColor"
              />
            </svg>
          </div>

          <h1>GitBridge Careers</h1>

        </div>

        <div className="left-content">

          <div className="badge">
            CAREER PLATFORM
          </div>

          <h2>
            Build your future.
            <br />
            <span>One commit at a time.</span>
          </h2>

          <p>
            Connect your skills, projects and GitHub profile
            to discover better career opportunities.
          </p>

          <div className="features">

            <div className="feature">

              <div className="feature-icon">✓</div>

              <div>
                <h4>Build Your Profile</h4>
                <p>
                  Showcase your skills and projects.
                </p>
              </div>

            </div>

            <div className="feature">

              <div className="feature-icon">✓</div>

              <div>
                <h4>Discover Opportunities</h4>
                <p>
                  Find jobs that match your skills.
                </p>
              </div>

            </div>

            <div className="feature">

              <div className="feature-icon">✓</div>

              <div>
                <h4>Connect With Companies</h4>
                <p>
                  Get discovered by great companies.
                </p>
              </div>

            </div>

          </div>

        </div>

        <div className="copyright">
          © 2026 GitBridge Careers
        </div>

      </div>


      {/* RIGHT SIDE */}
      <div className="login-right">

        <div className="login-box">

          <div className="login-header">

            <h2>Welcome back</h2>

            <p>
              Enter your details to continue your journey.
            </p>

          </div>


          {/* GOOGLE LOGIN */}

          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleLogin}
          >

            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
            >

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

            <p>OR CONTINUE WITH</p>

            <span></span>

          </div>


          {/* LOGIN FORM */}

          <form onSubmit={handleLogin}>

            <div className="input-group">

              <label>Email Address</label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

            </div>


            <div className="input-group">

              <div className="password-label">

                <label>Password</label>

                <button
                  type="button"
                  className="forgot-password"
                >
                  Forgot password?
                </button>

              </div>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />

            </div>


            {message && (

              <div className="message">
                {message}
              </div>

            )}


            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >

              {loading
                ? "Signing in..."
                : "Sign In"
              }

            </button>

          </form>


          <div className="signup-text">

            <p>
              Don't have an account?
            </p>

            <button
              onClick={() => navigate("/signup")}
            >
              Create account
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default LoginPage;