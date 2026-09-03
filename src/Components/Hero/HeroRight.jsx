import React from "react";
import "./HeroRight.css";

export const HeroRight = () => {
  return (
    <div className="hero-right">

      <div className="dashboard-window">

        {/* Browser Top */}
        <div className="window-top">
          <div className="window-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div className="window-title">
            GitBridge AI
          </div>

          <div className="window-status">
            ●
          </div>
        </div>


        {/* Dashboard Header */}
        <div className="preview-header">
          <div>
            <span>Career Intelligence</span>
            <h3>Your Career Overview</h3>
          </div>

          <div className="profile-mini">
            👨🏻
          </div>
        </div>


        {/* Main Score */}
        <div className="preview-grid">

          <div className="career-score-card">

            <div className="score-header">
              <span>Career Score</span>
              <span className="score-up">↗ +8%</span>
            </div>

            <div className="score-content">

              <div className="score-ring">
                <div>
                  <strong>84</strong>
                  <small>/100</small>
                </div>
              </div>

              <div className="score-info">
                <strong>Great progress</strong>
                <p>Your profile is looking strong.</p>

                <div className="progress-bar">
                  <span></span>
                </div>
              </div>

            </div>

          </div>


          {/* Mini Scores */}
          <div className="score-mini-grid">

            <div className="score-mini github">
              <div className="mini-top">
                <span>GitHub</span>
                <b>⌘</b>
              </div>

              <strong>92</strong>
              <small>/100</small>

              <p>Excellent</p>
            </div>


            <div className="score-mini resume">
              <div className="mini-top">
                <span>Resume</span>
                <b>CV</b>
              </div>

              <strong>88</strong>
              <small>/100</small>

              <p>Strong profile</p>
            </div>


            <div className="score-mini skills">
              <div className="mini-top">
                <span>Skills</span>
                <b>✓</b>
              </div>

              <strong>76</strong>
              <small>/100</small>

              <p>Good match</p>
            </div>

          </div>

        </div>


        {/* Bottom Area */}
        <div className="preview-bottom">

          <div className="activity-card">

            <div className="activity-title">
              <div>
                <span>Profile Activity</span>
                <strong>Contribution Overview</strong>
              </div>

              <b>View →</b>
            </div>

            <div className="activity-chart">

              {Array.from({ length: 42 }).map((_, index) => (
                <span
                  key={index}
                  className={`activity-${index % 4}`}
                ></span>
              ))}

            </div>

          </div>


          <div className="ai-card">

            <div className="ai-label">
              ✦ AI Career Assistant
            </div>

            <h3>Hi there! 👋</h3>

            <p>
              I found <strong>25+ opportunities</strong>
              matching your profile.
            </p>

            <button>
              Explore Opportunities →
            </button>

          </div>

        </div>


        {/* Floating Notification */}
        <div className="floating-notification profile-notification">
          <div className="notification-icon">
            ✓
          </div>

          <div>
            <strong>Profile Strength</strong>
            <span>Excellent</span>
          </div>
        </div>


        <div className="floating-notification job-notification">

          <div className="notification-icon">
            💼
          </div>

          <div>
            <strong>New Opportunities</strong>
            <span>3 matches found</span>
          </div>

        </div>

      </div>

    </div>
  );
};