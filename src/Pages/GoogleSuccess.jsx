import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

const GoogleSuccess = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const executedRef = useRef(false);

  useEffect(() => {
    if (executedRef.current) return;
    executedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token") || localStorage.getItem("token");

    if (!token) {
      console.warn("No token received from Google callback.");
      navigate("/login", { replace: true });
      return;
    }

    // Immediately persist token
    localStorage.setItem("token", token);
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    localStorage.removeItem("gb_admin_token");

    // Decode role directly from JWT payload safely
    let userRole = "student";
    let userId = null;
    let userEmail = "";

    try {
      const parts = token.split(".");
      if (parts.length >= 2) {
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const parsed = JSON.parse(jsonPayload);
        userRole = parsed.role || "student";
        userId = parsed.sub || null;
        userEmail = parsed.email || "";
      }
    } catch (e) {
      console.warn("Could not decode JWT payload, using fallback student:", e);
    }

    const initialUser = {
      id: userId,
      role: userRole,
      email: userEmail,
      provider: "google"
    };

    // Immediately set logged in state
    login(token, initialUser);

    // Fetch verified backend user profile asynchronously without blocking redirect
    fetch("http://localhost:8000/api/auth/me", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Auth-Token": token,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((freshUser) => {
        if (freshUser) {
          login(token, freshUser);
        }
      })
      .catch((err) => {
        console.warn("Background session sync:", err.message);
      });

    // Navigate immediately to appropriate dashboard without any delayed timer
    if (userRole === "recruiter") {
      navigate("/recruiter", { replace: true });
    } else if (userRole === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, login]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080915",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          border: "3px solid rgba(139, 92, 246, 0.2)",
          borderTopColor: "#8b5cf6",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          marginBottom: "18px",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <h3 style={{ margin: "0 0 6px", fontSize: "19px", fontWeight: 700 }}>
        Connecting to GitBridge...
      </h3>
      <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
        Loading your personalized dashboard...
      </p>
    </div>
  );
};

export default GoogleSuccess;