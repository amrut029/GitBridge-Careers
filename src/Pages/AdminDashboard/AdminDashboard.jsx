import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../UserDashboard/DashboardPage.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    
    fetch("http://localhost:8000/api/admin/dashboard", {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(setData)
    .catch(console.error);
  }, [navigate]);

  return (
    <div className="dashboard classic">
      <nav className="dashboard-nav">
        <div className="brand" onClick={() => navigate("/")}>
          <div className="brand-logo">🛡️</div>
          <h1>Admin Portal</h1>
        </div>
        <button className="primary-btn" onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }}>Logout</button>
      </nav>
      
      <main className="dashboard-main">
        <div className="tab-container">
          <section className="panel">
            <h2 style={{ color: "white" }}>Platform Statistics</h2>
            {data ? (
              <div style={{ color: "#a1a1aa", marginTop: 20 }}>
                <p>Total Students: {data.stats?.total_students}</p>
                <p>Total Recruiters: {data.stats?.total_recruiters}</p>
                <p>Pending Recruiters: {data.stats?.pending_recruiters}</p>
                <p>Total Opportunities: {data.stats?.total_opportunities}</p>
                <p>Total Applications: {data.stats?.total_applications}</p>
              </div>
            ) : (
              <p style={{ color: "#a1a1aa" }}>Loading...</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
