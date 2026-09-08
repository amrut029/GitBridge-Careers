import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

const THEMES = [
  { id: "classic", name: "⚡ Classic Dark" },
  { id: "oled", name: "🌌 Midnight OLED" },
  { id: "cyberpunk", name: "🚀 Cyberpunk" },
  { id: "light", name: "☀️ Modern Light" }
];

const STARTUP_PREVIEWS = [
  {
    logo: "⚡",
    company: "Zepto",
    stage: "🦄 Quick-Commerce Unicorn",
    timeline: "⚡ Immediate 48-hr Hiring Sprint",
    role: "Cloud & DevOps Intern",
    stipend: "₹50,000 - ₹65,000 / mo",
    match: "96% Match",
    tags: ["Kubernetes", "Terraform", "Docker", "Linux"]
  },
  {
    logo: "🧠",
    company: "Sarvam AI",
    stage: "🚀 Series A ($41M Funded)",
    timeline: "Hiring for Indic AI Models",
    role: "AI Infrastructure / MLOps",
    stipend: "₹18 - ₹28 LPA",
    match: "92% Match",
    tags: ["Python", "FastAPI", "Kubernetes", "PyTorch"]
  },
  {
    logo: "🟡",
    company: "Blinkit",
    stage: "🚀 Zomato Group",
    timeline: "Active Now • Batch 2025/2026",
    role: "Junior Platform & SRE",
    stipend: "₹14 - ₹20 LPA",
    match: "94% Match",
    tags: ["Docker", "Linux", "Jenkins", "Prometheus"]
  },
  {
    logo: "🍕",
    company: "Slice",
    stage: "🦄 Digital Bank Unicorn",
    timeline: "🎓 2026 Campus & Off-Campus",
    role: "Backend / API Engineer",
    stipend: "₹45,000 / mo",
    match: "88% Match",
    tags: ["Python", "FastAPI", "PostgreSQL", "Git"]
  }
];

const HomePage = () => {
  const navigate = useNavigate();

  // Theme state persisted
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("gb_theme") || "classic";
  });

  // Scroll state & Active Section
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [helpQuery, setHelpQuery] = useState("");
  const [helpNotice, setHelpNotice] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("gb_theme", theme);
  }, [theme]);

  // Scroll Listener for Navbar Animation (70% viewport or scrolled threshold)
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrollThreshold = window.innerHeight * 0.35; // 35% of screen initiates smooth dock
      setScrolled(scrollY > scrollThreshold);

      // Scrollspy active section detection
      const sections = ["home", "features", "how-it-works", "opportunities"];
      for (const sec of sections) {
        const el = document.getElementById(sec);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(sec);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const goLogin = () => {
    navigate("/login");
  };

  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const handleHelpSubmit = (e) => {
    e.preventDefault();
    if (!helpQuery.trim()) return;
    setHelpNotice(`Thank you! Support ticket submitted for: "${helpQuery}". Redirecting to sign in...`);
    setTimeout(() => {
      navigate("/login");
    }, 1200);
  };

  return (
    <div className={`home-page theme-${theme}`} data-theme={theme}>
      {/* ================= GLASSMORPHIC NAVBAR ================= */}
      <header className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
        <div
          className="brand"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <div className="brand-logo">⚡</div>
          <span>
            GitBridge <b>Careers</b>
          </span>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-link-btn ${activeSection === "home" ? "active" : ""}`}
            onClick={() => scrollTo("home")}
          >
            Home
            {activeSection === "home" && <span className="active-indicator-line"></span>}
          </button>

          <button
            className={`nav-link-btn ${activeSection === "features" ? "active" : ""}`}
            onClick={() => scrollTo("features")}
          >
            Features
            {activeSection === "features" && <span className="active-indicator-line"></span>}
          </button>

          <button
            className={`nav-link-btn ${activeSection === "how-it-works" ? "active" : ""}`}
            onClick={() => scrollTo("how-it-works")}
          >
            How It Works
            {activeSection === "how-it-works" && <span className="active-indicator-line"></span>}
          </button>

          <button
            className={`nav-link-btn ${activeSection === "opportunities" ? "active" : ""}`}
            onClick={() => scrollTo("opportunities")}
          >
            Opportunities
            {activeSection === "opportunities" && <span className="active-indicator-line"></span>}
          </button>
        </nav>

        <div className="nav-actions">
          {/* THEME SELECTOR PILL */}
          <div className="nav-theme-pill" title="Switch visual theme">
            <span className="theme-icon">🎨</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="nav-theme-select"
            >
              {THEMES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <button className="login-btn" onClick={goLogin}>
            Sign In
          </button>
          <button className="nav-start-btn" onClick={goLogin}>
            Get Started →
          </button>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <main id="home">
        <section className="hero">
          <div className="hero-content">
            <div className="hero-badge">✦ AI-Powered Career Intelligence</div>

            <h1>
              Turn Your
              <span> GitHub Profile </span>
              Into Your
              <span> Career Advantage.</span>
            </h1>

            <p className="hero-description">
              GitBridge analyzes your real GitHub repositories (public & private), ATS resume, and coding velocity to give you authentic developer scoring, Hinglish roasts, and high-match startup opportunities.
            </p>

            <div className="hero-buttons">
              <button className="primary-btn" onClick={goLogin}>
                Get Started Free <span>→</span>
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
                <strong>Built for ambitious software engineers</strong>
                <small>Analyze Repos • Detect Gaps • Get Hired</small>
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
                <span>GitBridge Career Intelligence</span>
                <div></div>
              </div>

              <div className="dashboard-body">
                <div className="dashboard-heading">
                  <div>
                    <small>CAREER & SPECIALIZATION</small>
                    <h3>DevOps & Cloud Infrastructure</h3>
                  </div>
                  <span className="live-badge">● Live Sync</span>
                </div>

                <div className="dashboard-grid">
                  {/* Career Score */}
                  <div className="career-score-card">
                    <p>ML Developer Score</p>
                    <div className="score-ring">
                      <div>
                        <strong>84</strong>
                        <small>/100</small>
                      </div>
                    </div>
                    <span className="good">↗ Top 10% Percentile</span>
                  </div>

                  {/* Right Cards */}
                  <div className="score-list">
                    <div className="dash-card github">
                      <div>
                        <small>GitHub Quality</small>
                        <strong>
                          92<span>/100</span>
                        </strong>
                        <em>20 Repos (Docker, K8s, HCL)</em>
                      </div>
                      <div className="dash-icon">⚡</div>
                    </div>

                    <div className="dash-card resume">
                      <div>
                        <small>ATS Match</small>
                        <strong>
                          88<span>/100</span>
                        </strong>
                        <em>Parsed Keyword Matrix</em>
                      </div>
                      <div className="dash-icon">📄</div>
                    </div>

                    <div className="dash-card skills">
                      <div>
                        <small>Active Streak</small>
                        <strong>
                          7 Days<span> Active</span>
                        </strong>
                        <em>Level 3 Engineer</em>
                      </div>
                      <div className="dash-icon">🔥</div>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="dashboard-bottom">
                  <div className="ai-widget">
                    <div className="ai-small">✦ Startup Matches</div>
                    <strong>Zepto & Blinkit are hiring!</strong>
                    <p>
                      We matched <b>12 high-growth startup roles</b> with your stack.
                    </p>
                    <button onClick={goLogin}>View Matches →</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Badges */}
            <div className="floating-notification notification-one">
              <span>✓</span>
              <div>
                <strong>Private Repos Synced 🔒</strong>
                <small>Full IaC & Docker history evaluated</small>
              </div>
            </div>

            <div className="floating-notification notification-two">
              <span>💼</span>
              <div>
                <strong>Zepto Cloud Intern</strong>
                <small>96% Match • ₹65k/month</small>
              </div>
            </div>
          </div>
        </section>

        {/* ================= STATS SECTION ================= */}
        <section className="stats-section">
          <div>
            <strong>10K+</strong>
            <span>Repositories Analyzed</span>
          </div>
          <div>
            <strong>500+</strong>
            <span>Startups & Companies</span>
          </div>
          <div>
            <strong>94%</strong>
            <span>ATS Parsing Accuracy</span>
          </div>
          <div>
            <strong>4.9/5</strong>
            <span>Developer Satisfaction</span>
          </div>
        </section>

        {/* ================= FEATURES SECTION ================= */}
        <section className="features-section" id="features">
          <div className="section-heading">
            <span>POWERFUL CAREER FEATURES</span>
            <h2>
              Everything you need to
              <br />
              <b>accelerate your engineering career.</b>
            </h2>
            <p>
              GitBridge brings your real GitHub repositories, ATS resume, and live startup opportunities together.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card featured">
              <div className="feature-icon purple">◉</div>
              <h3>Real GitHub Repository Analysis</h3>
              <p>
                Deeply scans repo names, commit velocity, languages (HCL, Python, Docker, JS), and includes private projects with 1-click token sync.
              </p>
              <span className="feature-link">Analyze your GitHub →</span>
            </div>

            <div className="feature-card">
              <div className="feature-icon blue">📄</div>
              <h3>Deep ATS Resume Engine</h3>
              <p>
                Extracts skills categorized into Frontend, Backend, Database, Cloud/DevOps, and provides section completeness checks.
              </p>
              <span className="feature-link">Score your resume →</span>
            </div>

            <div className="feature-card">
              <div className="feature-icon orange">🔥</div>
              <h3>Desi Hinglish AI Roast</h3>
              <p>
                A witty, humorous, and savage developer roast in authentic Hinglish based on your actual commits, stars, and private projects.
              </p>
              <span className="feature-link">Get roasted →</span>
            </div>

            <div className="feature-card">
              <div className="feature-icon green">💼</div>
              <h3>Startup & Unicorn Opportunities</h3>
              <p>
                Discover roles at high-growth Indian & global startups with real-time match scores and active hiring timelines.
              </p>
              <span className="feature-link">Explore opportunities →</span>
            </div>
          </div>
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section className="how-section" id="how-it-works">
          <div className="section-heading">
            <span>STEP-BY-STEP WORKFLOW</span>
            <h2>
              From repository commit to
              <b> career milestone.</b>
            </h2>
            <p>Four streamlined steps to understand where you stand and where to apply.</p>
          </div>

          <div className="steps">
            <div className="step">
              <div className="step-number">01</div>
              <div>
                <h3>Connect GitHub</h3>
                <p>Sync public and private repositories using username or personal access token.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">02</div>
              <div>
                <h3>Upload ATS Resume</h3>
                <p>Upload PDF/DOCX resume to calculate recruiter keyword compatibility.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">03</div>
              <div>
                <h3>AI Profile & Specialization</h3>
                <p>Our classifier identifies your true role (DevOps, FullStack, Backend, AI/ML).</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">04</div>
              <div>
                <h3>Apply to Matching Roles</h3>
                <p>Apply directly to startups hiring your exact stack with 85%+ match scores.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= OPPORTUNITIES PREVIEW (STARTUPS & TIMELINES) ================= */}
        <section className="opportunity-section" id="opportunities">
          <div className="opportunity-content">
            <span className="section-label">STARTUPS & UNICORN HIRING</span>
            <h2>
              High-growth startups.
              <br />
              <b>Real-time hiring timelines.</b>
            </h2>
            <p>
              GitBridge analyzes your actual GitHub stack and matches you with startups actively hiring right now.
            </p>

            <div className="check-list">
              <span>✓ Startup & Unicorn hiring sprint timelines</span>
              <span>✓ Real GitHub stack matching (Kubernetes, React, Python)</span>
              <span>✓ Direct 1-click application portals</span>
              <span>✓ Interactive developer career roadmaps</span>
            </div>

            <button className="primary-btn" onClick={goLogin}>
              Find My Opportunities →
            </button>
          </div>

          <div className="jobs-preview">
            {STARTUP_PREVIEWS.map((job, idx) => (
              <div className="job-card" key={idx}>
                <div className="company-logo">{job.logo}</div>
                <div className="job-info">
                  <div className="job-company-row">
                    <strong>{job.company}</strong>
                    <span className="job-stage-pill">{job.stage}</span>
                  </div>
                  <h4 className="job-role-title">{job.role}</h4>
                  <small className="job-timeline-text">{job.timeline}</small>

                  <div className="job-tags">
                    {job.tags.map((t, i) => (
                      <small key={i}>{t}</small>
                    ))}
                  </div>
                </div>
                <strong className="match">{job.match}</strong>
              </div>
            ))}
          </div>
        </section>

        {/* ================= CTA SECTION ================= */}
        <section className="cta-section" id="cta">
          <div className="cta-glow"></div>
          <span>READY TO TAKE THE NEXT STEP?</span>
          <h2>
            Your next engineering opportunity
            <br />
            starts with your code.
          </h2>
          <p>Analyze your GitHub. Optimize your ATS score. Land interviews at top tech startups.</p>
          <button className="cta-btn" onClick={goLogin}>
            Start Your Career Intelligence Free →
          </button>
        </section>

        {/* ================= FOOTER WITH HELP CENTER ================= */}
        <footer className="footer">
          <div className="footer-top-row">
            <div className="footer-brand">
              <div className="brand">
                <div className="brand-logo">⚡</div>
                <span>
                  GitBridge <b>Careers</b>
                </span>
              </div>
              <p>Career intelligence for ambitious software engineers and tech startups.</p>
            </div>

            {/* HELP CENTER SEARCH INPUT IN FOOTER */}
            <div className="footer-help-box">
              <strong>Need Help or Have Questions?</strong>
              <p>Ask anything about GitHub analysis, private repos, or ATS resumes.</p>
              <form onSubmit={handleHelpSubmit} className="help-search-form">
                <input
                  type="text"
                  placeholder="Help Center • Ask questions or search guides..."
                  value={helpQuery}
                  onChange={(e) => setHelpQuery(e.target.value)}
                  className="help-input"
                />
                <button type="submit" className="help-submit-btn">
                  Ask Support →
                </button>
              </form>
              {helpNotice && <small className="help-notice-text">{helpNotice}</small>}
            </div>
          </div>

          <div className="footer-links">
            <div>
              <strong>Product</strong>
              <span onClick={() => scrollTo("features")}>Features</span>
              <span onClick={() => scrollTo("opportunities")}>Opportunities</span>
              <span onClick={() => scrollTo("how-it-works")}>How It Works</span>
              <span onClick={goLogin}>Theme Switcher</span>
            </div>

            <div>
              <strong>Specializations</strong>
              <span>DevOps & Cloud</span>
              <span>Full-Stack Web</span>
              <span>Backend & Systems</span>
              <span>AI / ML Engineering</span>
            </div>

            <div>
              <strong>Resources</strong>
              <span onClick={goLogin}>Help Center</span>
              <span onClick={goLogin}>Private Repos Guide</span>
              <span onClick={goLogin}>ATS Resume Checklist</span>
              <span onClick={goLogin}>Hinglish Roast</span>
            </div>

            <div>
              <strong>Connect</strong>
              <a href="https://github.com/amrut029/GitBridge-Careers" target="_blank" rel="noreferrer">
                GitHub Repository ↗
              </a>
              <span>LinkedIn</span>
              <span>Discord Community</span>
            </div>
          </div>
        </footer>

        <div className="copyright">
          © 2026 GitBridge Careers. Built with ⚡ for developers worldwide.
        </div>
      </main>
    </div>
  );
};

export default HomePage;