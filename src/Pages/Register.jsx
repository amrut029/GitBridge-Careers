import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: name,
            email: email,
            password: password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Registration failed");
        setLoading(false);
        return;
      }

      setMessage("Registration successful! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      console.error(error);
      setMessage("Backend server is not running!");
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">

      <div className="auth-card">

        <h1>GitBridge Careers</h1>

        <p className="subtitle">
          Create your account
        </p>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        <form onSubmit={handleRegister}>

          <div className="input-group">
            <label>Name</label>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

        </form>

        <p className="bottom-text">
          Already have an account?{" "}
          <Link to="/login">
            Login
          </Link>
        </p>

      </div>

    </div>
  );
}

export default Register;