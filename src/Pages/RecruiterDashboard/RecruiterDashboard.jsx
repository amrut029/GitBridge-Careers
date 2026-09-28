import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../UserDashboard/DashboardPage.css"; // Reuse dashboard CSS

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    
    // Quick fetch to test
    fetch("http://localhost:8000/api/recruiter/dashboard", {
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
          <div className="brand-logo">⚡</div>
          <h1>Recruiter Panel</h1>
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
            <h2 style={{ color: "white" }}>Opportunities & Applications</h2>
            {data ? (
              <div style={{ color: "#a1a1aa", marginTop: 20 }}>
                <p>Status: {data.status}</p>
                <p>Opportunities Posted: {data.opportunities?.length || 0}</p>
                <p>Applications Received: {data.total_applications || 0}</p>
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

export default RecruiterDashboard;
