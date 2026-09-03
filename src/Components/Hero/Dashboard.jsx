import React from "react";
import "./Dashboard.css";

export const Dashboard = () => {
  return (
    <div className="dashboard-content">

      {/* Career Score */}
      <div className="hero-score-card">
        <p>Career Score</p>

        <div className="score-circle">
          <strong>84</strong>
          <span>/100</span>
        </div>

        <div className="score-progress">
          ↗ Good Progress
        </div>
      </div>


      {/* Score Cards */}
      <div className="hero-mini-cards">

        <div className="hero-mini-card github">
          <p>GitHub Score</p>
          <h3>
            92 <span>/100</span>
          </h3>
          <small>+12 Improved</small>
        </div>

        <div className="hero-mini-card resume">
          <p>Resume Score</p>
          <h3>
            88 <span>/100</span>
          </h3>
          <small>Excellent</small>
        </div>

        <div className="hero-mini-card skills">
          <p>Skill Match</p>
          <h3>
            72 <span>/100</span>
          </h3>
          <small>Good Match</small>
        </div>

      </div>


      {/* Contribution */}
      <div className="contribution-card">

        <div className="contribution-header">
          <strong>Contribution Activity</strong>
          <span>View Profile →</span>
        </div>

        <div className="contribution-grid">
          {Array.from({ length: 35 }).map((_, index) => (
            <span
              key={index}
              className={`block level-${index % 4}`}
            ></span>
          ))}
        </div>

      </div>


      {/* AI Assistant */}
      <div className="ai-card">

        <span className="ai-badge">
          🤖 AI Career Assistant
        </span>

        <h2>Hi User 👋</h2>

        <p>
          I analyzed your profile and found
          <strong> 25+ opportunities</strong> for you.
        </p>

        <button>
          Ask AI Anything →
        </button>

      </div>


      {/* Floating Notifications */}

      <div className="floating-card github-floating">
        <span>●</span>

        <div>
          <strong>Profile Strength</strong>
          <small>Excellent</small>
        </div>
      </div>


      <div className="floating-card internship-floating">
        <span>💼</span>

        <div>
          <strong>Internship</strong>
          <small>3 New Matches</small>
        </div>
      </div>

    </div>
  );
};