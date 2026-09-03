import React from "react";
import { useNavigate } from "react-router-dom";
import "./HeroLeft.css";

export const HeroLeft = () => {
  const navigate = useNavigate();

  const handleHowItWorks = () => {
    const section = document.getElementById("how-it-works");

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="hero-left">

      {/* Badge */}
      <div className="hero-badge">
        <span className="badge-icon">✦</span>
        AI-Powered Career Intelligence
      </div>


      {/* Main Heading */}
      <h1>
        Turn Your Skills
        <br />
        Into Your <span>Career.</span>
      </h1>


      {/* Description */}
      <p className="hero-description">
        GitBridge AI analyzes your GitHub profile, resume, and skills
        to give you a personalized career score, discover matching
        opportunities, and help you become job-ready.
      </p>


      {/* Buttons */}
      <div className="hero-buttons">

        {/* Get Started */}
        <button
          type="button"
          className="primary-btn"
          onClick={() => navigate("/login")}
        >
          <span>Get Started Free</span>
          <span className="button-arrow">→</span>
        </button>


        {/* How It Works */}
        <button
          type="button"
          className="secondary-btn"
          onClick={handleHowItWorks}
        >
          <span className="play-icon">▶</span>
          <span>See How It Works</span>
        </button>

      </div>


      {/* Trust Section */}
      <div className="hero-trust">

        <div className="trust-icons">

          <div className="trust-icon github">
            GH
          </div>

          <div className="trust-icon resume">
            CV
          </div>

          <div className="trust-icon ai">
            AI
          </div>

        </div>


        <div className="trust-content">

          <div className="stars">
            ★★★★★
          </div>

          <strong>
            Built for ambitious developers
          </strong>

          <p>
            Analyze • Improve • Get Hired
          </p>

        </div>

      </div>

    </div>
  );
};