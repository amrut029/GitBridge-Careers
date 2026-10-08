import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, token, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#080915",
          color: "#ffffff",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid rgba(139, 92, 246, 0.2)",
            borderTopColor: "#8b5cf6",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            marginBottom: "16px",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#a1a1aa", fontSize: "14px", margin: 0 }}>
          Authenticating secure session...
        </p>
      </div>
    );
  }

  const activeToken =
    token ||
    localStorage.getItem("token") ||
    localStorage.getItem("admin_token") ||
    localStorage.getItem("gb_admin_token");
  let activeUser = user;
  if (!activeUser) {
    try {
      const s = localStorage.getItem("user") || localStorage.getItem("admin_user");
      if (s) activeUser = JSON.parse(s);
    } catch (e) {
      // ignore
    }
  }

  // Not logged in
  if (!activeToken) {
    if (allowedRoles.includes("admin")) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const activeRole = activeUser?.role || role || "student";

  // Check role authorization if specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(activeRole)) {
    if (activeRole === "recruiter") {
      return <Navigate to="/recruiter" replace />;
    } else if (activeRole === "admin") {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;