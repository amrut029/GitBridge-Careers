import React from "react";
import { Routes, Route } from "react-router-dom";

import HomePage from "./Pages/HomePage/HomePage";
import LoginPage from "./Pages/UserLogin/LoginPage";
import SignupPage from "./Pages/UserSignupPage/SignupPage";
import DashboardPage from "./Pages/UserDashboard/DashboardPage";

import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/login" element={<LoginPage />} />

      <Route path="/signup" element={<SignupPage />} />

      <Route path="/dashboard" element={<DashboardPage />} />

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