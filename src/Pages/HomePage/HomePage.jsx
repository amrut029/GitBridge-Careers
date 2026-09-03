import React from "react";
import "./HomePage.css";

const HomePage = () => {

  const goLogin = () => {
    window.location.href = "/login";
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth"
    });
  };

  return (
    <div className="home-page">

      {/* ================= NAVBAR ================= */}
      <header className="navbar">

        <div
          className="brand"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth"
            })
          }
        >
          <div className="brand-logo">◆</div>

          <span>
            GitBridge <b>AI</b>
          </span>
        </div>

        <nav className="nav-links">
          <button onClick={() => scrollTo("home")}>
            Home
          </button>

          <button onClick={() => scrollTo("features")}>
            Features
          </button>

          <button onClick={() => scrollTo("how-it-works")}>
            How It Works
          </button>

          <button onClick={() => scrollTo("opportunities")}>
            Opportunities
          </button>
        </nav>

        <div className="nav-actions">
          <button
            className="nav-start-btn"
            onClick={goLogin}
          >
            Get Started
          </button>
        </div>

      </header>


      {/* ================= HERO ================= */}
      <main id="home">

        <section className="hero">

          <div className="hero-content">

            <div className="hero-badge">
              ✦ Career Intelligence Platform
            </div>

            <h1>
              Turn Your
              <span> GitHub Profile </span>
              Into Your
              <span> Career Advantage.</span>
            </h1>

            <p className="hero-description">
              GitBridge analyzes your GitHub profile, resume and skills
              to help you discover better internships, jobs and personalized
              career opportunities.
            </p>

            <div className="hero-buttons">

              <button
                className="primary-btn"
                onClick={goLogin}
              >
                Get Started Free
                <span>→</span>
              </button>

              <button
                className="secondary-btn"
                onClick={() => scrollTo("how-it-works")}
              >
                ▶ See How It Works
              </button>

            </div>


            <div className="hero-trust">

              <div className="avatars">
                <span>👨🏻</span>
                <span>👩🏻</span>
                <span>👨🏽</span>
                <span>👩🏽</span>
              </div>

              <div>
                <strong>
                  Built for ambitious developers
                </strong>

                <small>
                  Analyze • Improve • Get Hired
                </small>
              </div>

            </div>

          </div>


          {/* ================= RIGHT DASHBOARD MOCKUP ================= */}

          <div className="hero-visual">

            <div className="glow"></div>

            <div className="dashboard-window">

              <div className="window-top">

                <div className="window-dots">
                  <i></i>
                  <i></i>
                  <i></i>
                </div>

                <span>
                  GitBridge Dashboard
                </span>

                <div></div>

              </div>


              <div className="dashboard-body">

                <div className="dashboard-heading">

                  <div>
                    <small>
                      YOUR CAREER OVERVIEW
                    </small>

                    <h3>
                      Profile Analysis
                    </h3>
                  </div>

                  <span className="live-badge">
                    ● Live
                  </span>

                </div>


                <div className="dashboard-grid">

                  {/* Career Score */}

                  <div className="career-score-card">

                    <p>
                      Career Score
                    </p>

                    <div className="score-ring">

                      <div>
                        <strong>
                          84
                        </strong>

                        <small>
                          /100
                        </small>
                      </div>

                    </div>

                    <span className="good">
                      ↗ Good Progress
                    </span>

                  </div>


                  {/* Right Cards */}

                  <div className="score-list">

                    <div className="dash-card github">

                      <div>
                        <small>
                          GitHub Score
                        </small>

                        <strong>
                          92<span>/100</span>
                        </strong>

                        <em>
                          +12 Improved
                        </em>
                      </div>

                      <div className="dash-icon">
                        GH
                      </div>

                    </div>


                    <div className="dash-card resume">

                      <div>
                        <small>
                          Resume Score
                        </small>

                        <strong>
                          88<span>/100</span>
                        </strong>

                        <em>
                          Excellent
                        </em>
                      </div>

                      <div className="dash-icon">
                        CV
                      </div>

                    </div>


                    <div className="dash-card skills">

                      <div>
                        <small>
                          Skill Match
                        </small>

                        <strong>
                          72<span>/100</span>
                        </strong>

                        <em>
                          Good Match
                        </em>
                      </div>

                      <div className="dash-icon">
                        ✓
                      </div>

                    </div>

                  </div>

                </div>


                {/* ================= BOTTOM DASHBOARD ================= */}

                <div className="dashboard-bottom">

                  <div className="mini-chart">

                    <div className="mini-title">
                      <span>
                        Profile Strength
                      </span>

                      <strong>
                        Excellent
                      </strong>
                    </div>

                    <div className="bars">
                      <i></i>
                      <i></i>
                      <i></i>
                      <i></i>
                      <i></i>
                      <i></i>
                      <i></i>
                      <i></i>
                      <i></i>
                      <i></i>
                    </div>

                  </div>


                  <div className="ai-widget">

                    <div className="ai-small">
                      ✦ Insights
                    </div>

                    <strong>
                      Hi there 👋
                    </strong>

                    <p>
                      We found <b>25+ opportunities</b>
                      matching your profile.
                    </p>

                    <button>
                      View Matches →
                    </button>

                  </div>

                </div>

              </div>

            </div>


            {/* Floating Notifications */}

            <div className="floating-notification notification-one">

              <span>
                ✓
              </span>

              <div>
                <strong>
                  Profile Strength
                </strong>

                <small>
                  Excellent
                </small>
              </div>

            </div>


            <div className="floating-notification notification-two">

              <span>
                💼
              </span>

              <div>
                <strong>
                  Internship
                </strong>

                <small>
                  3 New Matches
                </small>
              </div>

            </div>

          </div>

        </section>


        {/* ================= STATS ================= */}

        <section className="stats-section">

          <div>
            <strong>
              10K+
            </strong>

            <span>
              Profiles Analyzed
            </span>
          </div>

          <div>
            <strong>
              2.5K+
            </strong>

            <span>
              Opportunities Found
            </span>
          </div>

          <div>
            <strong>
              94%
            </strong>

            <span>
              Profile Accuracy
            </span>
          </div>

          <div>
            <strong>
              4.9/5
            </strong>

            <span>
              User Rating
            </span>
          </div>

        </section>


        {/* ================= FEATURES ================= */}

        <section
          className="features-section"
          id="features"
        >

          <div className="section-heading">

            <span>
              POWERFUL FEATURES
            </span>

            <h2>
              Everything you need to
              <br />
              <b>build your career.</b>
            </h2>

            <p>
              GitBridge brings your GitHub, resume and career goals
              together in one intelligent platform.
            </p>

          </div>


          <div className="features-grid">

            <div className="feature-card featured">

              <div className="feature-icon purple">
                ◉
              </div>

              <h3>
                GitHub Profile Analysis
              </h3>

              <p>
                Analyze repositories, contributions, coding activity,
                technologies and project quality to calculate your
                GitHub career score.
              </p>

              <span className="feature-link">
                Analyze your profile →
              </span>

            </div>


            <div className="feature-card">

              <div className="feature-icon blue">
                CV
              </div>

              <h3>
                Resume Review
              </h3>

              <p>
                Upload your resume and get useful feedback on
                skills, experience, projects and ATS readiness.
              </p>

              <span className="feature-link">
                Improve your resume →
              </span>

            </div>


            <div className="feature-card">

              <div className="feature-icon green">
                ✓
              </div>

              <h3>
                Skill Gap Detection
              </h3>

              <p>
                Discover which technical skills you are missing and
                get a personalized roadmap to become job-ready.
              </p>

              <span className="feature-link">
                Find skill gaps →
              </span>

            </div>


            <div className="feature-card">

              <div className="feature-icon orange">
                💼
              </div>

              <h3>
                Smart Opportunities
              </h3>

              <p>
                Find internships and jobs based on your actual skills,
                GitHub projects and resume.
              </p>

              <span className="feature-link">
                Explore opportunities →
              </span>

            </div>

          </div>

        </section>


        {/* ================= HOW IT WORKS ================= */}

        <section
          className="how-section"
          id="how-it-works"
        >

          <div className="section-heading">

            <span>
              HOW IT WORKS
            </span>

            <h2>
              From profile to
              <b> career opportunities.</b>
            </h2>

            <p>
              Four simple steps to understand where you stand
              and where you should go next.
            </p>

          </div>


          <div className="steps">

            <div className="step">

              <div className="step-number">
                01
              </div>

              <div>
                <h3>
                  Connect GitHub
                </h3>

                <p>
                  Connect your GitHub profile and analyze
                  your coding activity and projects.
                </p>
              </div>

            </div>


            <div className="step">

              <div className="step-number">
                02
              </div>

              <div>
                <h3>
                  Upload Resume
                </h3>

                <p>
                  Upload your resume and extract your
                  skills, experience and career profile.
                </p>
              </div>

            </div>


            <div className="step">

              <div className="step-number">
                03
              </div>

              <div>
                <h3>
                  Get Profile Analysis
                </h3>

                <p>
                  Receive your Career Score, skill gaps and
                  personalized improvement suggestions.
                </p>
              </div>

            </div>


            <div className="step">

              <div className="step-number">
                04
              </div>

              <div>
                <h3>
                  Discover Opportunities
                </h3>

                <p>
                  Find internships and jobs that match your
                  actual profile and career goals.
                </p>
              </div>

            </div>

          </div>

        </section>


        {/* ================= OPPORTUNITIES ================= */}

        <section
          className="opportunity-section"
          id="opportunities"
        >

          <div className="opportunity-content">

            <span className="section-label">
              SMART OPPORTUNITY MATCHING
            </span>

            <h2>
              Stop applying everywhere.
              <br />
              <b>Start applying smarter.</b>
            </h2>

            <p>
              GitBridge compares your profile against opportunities
              and helps you understand which roles are actually
              worth applying for.
            </p>


            <div className="check-list">

              <span>
                ✓ Personalized job recommendations
              </span>

              <span>
                ✓ Skill-based matching
              </span>

              <span>
                ✓ Internship recommendations
              </span>

              <span>
                ✓ Career roadmap suggestions
              </span>

            </div>


            <button
              className="primary-btn"
              onClick={goLogin}
            >
              Find My Opportunities →
            </button>

          </div>


          <div className="jobs-preview">

            <div className="job-card">

              <div className="company-logo">
                G
              </div>

              <div className="job-info">

                <strong>
                  Frontend Developer Intern
                </strong>

                <span>
                  Technology Company
                </span>

                <div className="job-tags">
                  <small>React</small>
                  <small>JavaScript</small>
                  <small>Git</small>
                </div>

              </div>

              <strong className="match">
                94% Match
              </strong>

            </div>


            <div className="job-card">

              <div className="company-logo blue-logo">
                AI
              </div>

              <div className="job-info">

                <strong>
                  AI/ML Developer
                </strong>

                <span>
                  AI Startup
                </span>

                <div className="job-tags">
                  <small>Python</small>
                  <small>ML</small>
                  <small>TensorFlow</small>
                </div>

              </div>

              <strong className="match">
                89% Match
              </strong>

            </div>


            <div className="job-card">

              <div className="company-logo green-logo">
                D
              </div>

              <div className="job-info">

                <strong>
                  Full Stack Developer
                </strong>

                <span>
                  Software Company
                </span>

                <div className="job-tags">
                  <small>React</small>
                  <small>Node.js</small>
                  <small>MongoDB</small>
                </div>

              </div>

              <strong className="match">
                86% Match
              </strong>

            </div>

          </div>

        </section>


        {/* ================= CTA ================= */}

        <section
          className="cta-section"
          id="cta"
        >

          <div className="cta-glow"></div>

          <span>
            READY TO LEVEL UP?
          </span>

          <h2>
            Your next opportunity
            <br />
            starts with your profile.
          </h2>

          <p>
            Analyze your GitHub. Improve your resume.
            Discover your next career opportunity.
          </p>

          <button
            className="cta-btn"
            onClick={goLogin}
          >
            Start Your Career Analysis →
          </button>

        </section>


        {/* ================= FOOTER ================= */}

        <footer className="footer">

          <div className="footer-brand">

            <div className="brand">

              <div className="brand-logo">
                ◆
              </div>

              <span>
                GitBridge <b>AI</b>
              </span>

            </div>

            <p>
              Career intelligence for the next generation
              of developers.
            </p>

          </div>


          <div className="footer-links">

            <div>
              <strong>
                Product
              </strong>

              <span>
                Features
              </span>

              <span>
                Opportunities
              </span>

              <span>
                How It Works
              </span>
            </div>


            <div>
              <strong>
                Company
              </strong>

              <span>
                About
              </span>

              <span>
                Contact
              </span>

              <span>
                Privacy
              </span>
            </div>


            <div>
              <strong>
                Connect
              </strong>

              <span>
                GitHub
              </span>

              <span>
                LinkedIn
              </span>

              <span>
                Instagram
              </span>
            </div>

          </div>

        </footer>


        <div className="copyright">
          © 2026 GitBridge AI. Built for developers.
        </div>

      </main>

    </div>
  );
};

export default HomePage;