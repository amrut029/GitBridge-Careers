import React from "react";
import { Routes, Route } from "react-router-dom";

import HomePage from "./Pages/HomePage/HomePage";
import LoginPage from "./Pages/UserLogin/LoginPage";
import SignupPage from "./Pages/UserSignupPage/SignupPage";
import DashboardPage from "./Pages/UserDashboard/DashboardPage";
import RecruiterDashboard from "./Pages/RecruiterDashboard/RecruiterDashboard";
import AdminDashboard from "./Pages/AdminDashboard/AdminDashboard";
import AdminLoginPage from "./Pages/AdminDashboard/AdminLoginPage";
import GoogleSuccess from "./Pages/GoogleSuccess";
import ProtectedRoute from "./Components/ProtectedRoute";

import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/getstarted" element={<LoginPage />} />

      <Route path="/signup" element={<SignupPage />} />

      <Route path="/google-success" element={<GoogleSuccess />} />

      {/* Dedicated Admin Login Route */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/recruiter"
        element={
          <ProtectedRoute allowedRoles={["recruiter"]}>
            <RecruiterDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "24px",
            }}
          >
            Page Not Found
          </div>
        }
      />
    </Routes>
  );
}

export default App;