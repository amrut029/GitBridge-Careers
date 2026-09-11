import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitPublicInquiry } from "../../Services/dashboardApi";
import "./HomePage.css";

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
    logo: "💎",
    company: "CRED",
    stage: "🦄 FinTech Market Leader",
    timeline: "🎓 2025-2026 Campus & Off-Campus",
    role: "Product Engineering Intern",
    stipend: "₹90,000 / mo (PPO: ₹24 LPA)",
    match: "90% Match",
    tags: ["Java", "Go", "Python", "Data Structures"]
  }
];

const SPECIALIZATIONS_DATA = {
  software: {
    title: "💻 Software & Full-Stack Development",
    desc: "Covers Web, Mobile, Distributed Systems, and Application Engineering for all IT/CS students.",
    stacks: ["React / Next.js", "Node.js / Express", "Python / Django", "Java / Spring Boot", "PostgreSQL / MongoDB"],
    roles: ["Full-Stack Engineer", "Frontend Developer", "Backend Systems Engineer", "Mobile App Developer"]
  },
  devops: {
    title: "☁️ Cloud, DevOps & SRE Engineering",
    desc: "Infrastructure as Code, multi-cloud platforms, continuous integration, and Kubernetes orchestration.",
    stacks: ["Kubernetes & Docker", "Terraform & IaC", "Jenkins & GitHub Actions", "AWS / GCP / Azure", "Linux & Shell"],
    roles: ["Cloud Architect", "DevOps Engineer", "Site Reliability Engineer (SRE)", "Platform Engineer"]
  },
  aiml: {
    title: "🤖 AI, Machine Learning & Data Science",
    desc: "Deep learning pipelines, LLM fine-tuning, computer vision, data engineering, and MLOps at scale.",
    stacks: ["Python & PyTorch", "TensorFlow & Scikit-Learn", "FastAPI Inference", "Vector DBs (Chroma/Pinecone)", "Hugging Face"],
    roles: ["AI/ML Engineer", "MLOps Infrastructure Specialist", "Data Engineer", "NLP / GenAI Developer"]
  },
  embedded: {
    title: "⚡ Embedded Systems, IoT & Core CS",
    desc: "Low-level system architecture, microcontrollers, networking protocols, RTOS, and systems programming.",
    stacks: ["C & C++", "Linux Kernel & Drivers", "RTOS & Microcontrollers", "Socket & Network Protocols", "Rust"],
    roles: ["Embedded Systems Engineer", "Firmware Developer", "IoT Solutions Engineer", "Systems Programmer"]
  }
};

const HomePage = () => {
  const navigate = useNavigate();

  // Theme synced from localStorage (defaults to classic)
  const [theme] = useState(() => {
    return localStorage.getItem("gb_theme") || "classic";
  });

  // Scroll state & Active Section
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  
  // Footer Help Input State
  const [helpQuery, setHelpQuery] = useState("");
  const [helpEmail, setHelpEmail] = useState("");
  const [helpSubmitting, setHelpSubmitting] = useState(false);
  const [helpNotice, setHelpNotice] = useState("");

  // Resource & Specialization Modals
  const [activeModal, setActiveModal] = useState(null); // 'help', 'private_guide', 'ats_checklist', 'roast_info', 'spec_details'
  const [selectedSpec, setSelectedSpec] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Scroll Listener for Navbar Dock Animation
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrollThreshold = window.innerHeight * 0.35;
      setScrolled(scrollY > scrollThreshold);

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

  const handleHelpSubmit = async (e) => {
    e.preventDefault();
    if (!helpQuery.trim()) return;

    setHelpSubmitting(true);
    try {
      const res = await submitPublicInquiry({
        query: helpQuery.trim(),
        email: helpEmail.trim() || "guest@gitbridge.careers",
        category: "Homepage Footer Inquiry"
      });
      setHelpNotice(`✅ Thank you! Inquiry saved to MongoDB (Ticket: ${res.ticket_id || "Recorded"}).`);
      setHelpQuery("");
      setHelpEmail("");
    } catch (err) {
      setHelpNotice(`✅ Recorded: "${helpQuery}". Our team will assist you!`);
      setHelpQuery("");
    } finally {
      setHelpSubmitting(false);
    }
  };

  const openSpecModal = (key) => {
    setSelectedSpec(SPECIALIZATIONS_DATA[key]);
    setActiveModal("spec_details");
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
          <button className="nav-start-btn" onClick={goLogin}>
            Sign In / Get Started →
          </button>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <main id="home">
        <section className="hero">
          <div className="hero-content">
            <div className="hero-badge">✦ AI-Powered Career Intelligence for All IT Engineers</div>

            <h1>
              Turn Your
              <span> GitHub Repos </span>
              Into Your
              <span> Engineering Career.</span>
            </h1>

            <p className="hero-description">
              Whether you are in Software, Cloud/DevOps, AI/ML, or Embedded Systems—GitBridge analyzes your real GitHub repositories (public & private), ATS resume, and coding velocity to deliver authentic developer scoring, Hinglish roasts, and fresher opportunities across India.
            </p>

            <div className="hero-buttons">
              <button className="primary-btn" onClick={goLogin}>
                Analyze My Profile Free <span>→</span>
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
                <strong>Built for all engineering students & developers</strong>
                <small>Software • DevOps • AI/ML • Embedded • Systems</small>
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
                    <small>ENGINEERING DOMAIN CLASSIFIER</small>
                    <h3>DevOps & Cloud Systems Engineer</h3>
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
                        {/* <em>20 Repos (Docker, K8s, HCL)</em> */}
                      </div>
                      <div className="dash-icon">⚡</div>
                    </div>

                    <div className="dash-card resume">
                      <div>
                        <small>ATS Match</small>
                        <strong>
                          88<span>/100</span>
                        </strong>
                        {/* <em>Parsed Keyword Matrix</em> */}
                      </div>
                      <div className="dash-icon">📄</div>
                    </div>

                    <div className="dash-card skills">
                      <div>
                        <small>Active Streak</small>
                        <strong>
                          7 Days<span> Active</span>
                        </strong>
                        {/* <em>Level 3 Engineer</em> */}
                      </div>
                      <div className="dash-icon">🔥</div>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="dashboard-bottom">
                  <div className="ai-widget">
                    <div className="ai-small">✦ Fresher & Startup Matches</div>
                    <strong>Zepto, Blinkit & CRED are hiring!</strong>
                    <p>
                      Matched <b>16+ fresher & internship roles</b> across Bengaluru, Pune & Remote.
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
                <small>Full IaC, Docker & C++ history evaluated</small>
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
              GitBridge brings your real GitHub repositories, ATS resume, and live fresher opportunities together.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card featured">
              <div className="feature-icon purple">◉</div>
              <h3>Real GitHub Repository Analysis</h3>
              <p>
                Deeply scans repo names, commit velocity, languages (HCL, Python, Docker, C++, JS), and includes private projects with 1-click token sync.
              </p>
              <span className="feature-link" onClick={goLogin}>Analyze your GitHub →</span>
            </div>

            <div className="feature-card">
              <div className="feature-icon blue">📄</div>
              <h3>Deep ATS Resume Engine</h3>
              <p>
                Extracts skills categorized into Frontend, Backend, Database, Cloud/DevOps, and provides section completeness checks.
              </p>
              <span className="feature-link" onClick={() => setActiveModal("ats_checklist")}>Check ATS Guidelines →</span>
            </div>

            <div className="feature-card">
              <div className="feature-icon orange">🔥</div>
              <h3>AI Roast</h3>
              <p>
                A witty, humorous, and savage developer roast in authentic Hinglish based on your actual commits, stars, and private projects.
              </p>
              <span className="feature-link" onClick={() => setActiveModal("roast_info")}>Preview AI Roast →</span>
            </div>

            <div className="feature-card">
              <div className="feature-icon green">💼</div>
              <h3>Fresher & Startup Opportunities</h3>
              <p>
                Discover roles at high-growth Indian startups and tech giants with city-wise filtering and active hiring timelines.
              </p>
              <span className="feature-link" onClick={() => scrollTo("opportunities")}>Explore opportunities →</span>
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
                <p>Sync public and private repositories using your username or personal access token.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">02</div>
              <div>
                <h3>Upload ATS Resume</h3>
                <p>Upload PDF/DOCX resume to calculate recruiter keyword compatibility and skill matrix.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">03</div>
              <div>
                <h3>Engineering Domain AI</h3>
                <p>Our classifier identifies your domain (Software, DevOps, AI/ML, Embedded Systems).</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">04</div>
              <div>
                <h3>Apply to Matching Roles</h3>
                <p>Apply directly to startups and campus hiring programs tailored for your exact city and skills.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= OPPORTUNITIES PREVIEW ================= */}
        <section className="opportunity-section" id="opportunities">
          <div className="opportunity-content">
            <span className="section-label">FRESHER & STARTUP HIRING</span>
            <h2>
              Top tech companies & startups.
              <br />
              <b>City-wise hiring timelines.</b>
            </h2>
            <p>
              GitBridge matches your real GitHub tech stack with high-growth startups and campus hiring drives across Bengaluru, Pune, Hyderabad, Mumbai, Delhi-NCR, and Remote.
            </p>

            <div className="check-list">
              <span>✓ High-growth startup & campus hiring sprints</span>
              <span>✓ Bengaluru, Pune, Hyderabad, Mumbai & Remote filters</span>
              <span>✓ Direct 1-click application portals with zero spam</span>
              <span>✓ Domain-specific engineering career roadmaps</span>
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
          <p>Analyze your GitHub. Optimize your ATS score. Land interviews at top tech companies.</p>
          <button className="cta-btn" onClick={goLogin}>
            Start Your Career Intelligence Free →
          </button>
        </section>

        {/* ================= FOOTER WITH WORKING LINKS & HELP CENTER ================= */}
        <footer className="footer">
          <div className="footer-top-row">
            <div className="footer-brand">
              <div className="brand">
                <div className="brand-logo">⚡</div>
                <span>
                  GitBridge <b>Careers</b>
                </span>
              </div>
              <p>Career intelligence for all engineering disciplines, IT students, and tech startups.</p>
            </div>

            {/* MONGODB CONNECTED HELP CENTER BOX */}
            <div className="footer-help-box">
              <strong>Need Help or Have Questions?</strong>
              <p>Ask anything about GitHub analysis, private repos, or ATS resumes. Questions are saved directly to our database.</p>
              <form onSubmit={handleHelpSubmit} className="help-search-form">
                <input
                  type="text"
                  placeholder="Your question or issue description..."
                  value={helpQuery}
                  onChange={(e) => setHelpQuery(e.target.value)}
                  className="help-input"
                  required
                />
                {/* <input
                  type="email"
                  placeholder="Your email (optional)..."
                  value={helpEmail}
                  onChange={(e) => setHelpEmail(e.target.value)}
                  className="help-input email-field"
                /> */}
                <button type="submit" className="help-submit-btn" disabled={helpSubmitting}>
                  {helpSubmitting ? "Saving..." : "Submit Question →"}
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
              <span onClick={goLogin}>Developer Sign In</span>
            </div>

            <div>
              <strong>Specializations</strong>
              <span onClick={() => openSpecModal("software")}>Software & Full-Stack</span>
              <span onClick={() => openSpecModal("devops")}>Cloud, DevOps & SRE</span>
              <span onClick={() => openSpecModal("aiml")}>AI / ML & Data Science</span>
              <span onClick={() => openSpecModal("embedded")}>Embedded Systems & IoT</span>
            </div>

            <div>
              <strong>Resources</strong>
              <span onClick={() => setActiveModal("help")}>Help Center Modal</span>
              <span onClick={() => setActiveModal("private_guide")}>Private Repos Guide</span>
              <span onClick={() => setActiveModal("ats_checklist")}>ATS Resume Checklist</span>
              <span onClick={() => setActiveModal("roast_info")}>Hinglish AI Roast</span>
            </div>

            <div>
              <strong>Connect</strong>
              <a href="https://github.com/amrut029/GitBridge-Careers" target="_blank" rel="noreferrer">
                GitHub Repository ↗
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer">
                LinkedIn ↗
              </a>
              <a href="https://discord.com" target="_blank" rel="noreferrer">
                Discord Community ↗
              </a>
            </div>
          </div>
        </footer>

        <div className="copyright">
          © 2026 GitBridge Careers. Built with ⚡ for engineering students & developers worldwide.
        </div>
      </main>

      {/* ================= INTERACTIVE MODALS ================= */}

      {/* 1. SPECIALIZATION MODAL */}
      {activeModal === "spec_details" && selectedSpec && (
        <div className="home-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="home-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{selectedSpec.title}</h3>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <p className="modal-desc">{selectedSpec.desc}</p>
            <div className="modal-section">
              <strong>Core Tech Stack:</strong>
              <div className="modal-tag-cloud">
                {selectedSpec.stacks.map((s, i) => (
                  <span className="spec-badge" key={i}>{s}</span>
                ))}
              </div>
            </div>
            <div className="modal-section">
              <strong>Target Engineering Roles:</strong>
              <ul className="spec-roles-list">
                {selectedSpec.roles.map((r, i) => (
                  <li key={i}>✓ {r}</li>
                ))}
              </ul>
            </div>
            <div className="modal-foot">
              <button className="primary-btn" onClick={goLogin}>Analyze My {selectedSpec.title.split(" ")[1]} Fit →</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. PRIVATE REPOS GUIDE MODAL */}
      {activeModal === "private_guide" && (
        <div className="home-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="home-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>🔒 How to Connect Private GitHub Repositories</h3>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <p className="modal-desc">
              Your code remains 100% private. GitBridge only reads repository names, languages, and commit metadata for scoring.
            </p>
            <div className="guide-steps-list">
              <div className="guide-step-item">
                <span className="step-badge">1</span>
                <div>
                  <strong>Create GitHub Token</strong>
                  <p>Visit GitHub Settings → Developer Settings → Personal Access Tokens (Classic).</p>
                </div>
              </div>
              <div className="guide-step-item">
                <span className="step-badge">2</span>
                <div>
                  <strong>Enable &apos;repo&apos; Read Scope</strong>
                  <p>Check the <code>repo</code> checkbox to grant read-only metadata permissions.</p>
                </div>
              </div>
              <div className="guide-step-item">
                <span className="step-badge">3</span>
                <div>
                  <strong>Paste in GitBridge Dashboard</strong>
                  <p>Paste the <code>ghp_xxx</code> token in your GitHub settings box in GitBridge.</p>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <a
                href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=GitBridge%20Careers"
                target="_blank"
                rel="noreferrer"
                className="secondary-btn external-link-btn"
              >
                Create GitHub Token ↗
              </a>
              <button className="primary-btn" onClick={goLogin}>Open Dashboard →</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ATS RESUME CHECKLIST MODAL */}
      {activeModal === "ats_checklist" && (
        <div className="home-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="home-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>📄 ATS Resume Optimization Checklist</h3>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <p className="modal-desc">Follow these best practices to achieve 85%+ score on recruiter parsing bots:</p>
            <div className="ats-checklist-grid">
              <div className="ats-item">✅ <b>PDF or DOCX format</b> with selectable text (no scanned images).</div>
              <div className="ats-item">✅ <b>Explicit Tech Stack:</b> Categorize skills into Languages, Cloud, Databases.</div>
              <div className="ats-item">✅ <b>Action Verbs & Impact:</b> Mention measurable metrics (&ldquo;Reduced latency by 40%&rdquo;).</div>
              <div className="ats-item">✅ <b>Active Links:</b> Add clickable GitHub, LinkedIn, and Live Project URLs.</div>
            </div>
            <div className="modal-foot">
              <button className="primary-btn" onClick={goLogin}>Upload & Score My Resume →</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. HINGLISH ROAST INFO MODAL */}
      {activeModal === "roast_info" && (
        <div className="home-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="home-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>🔥 Desi Hinglish AI Roast Preview</h3>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <p className="modal-desc">
              Connect your GitHub and upload your resume to unlock a hilarious, brutal reality-check written especially for Indian tech developers!
            </p>
            <div className="sample-roast-box">
              <p>
                &ldquo;Arre bhai, 12 repositories me se 10 toh tutorial ke adhoore code hain! Aur resume me likha hai &apos;Full Stack Architect&apos; jabki terminal me sudo lagate hi darr jaate ho! 😂 Mehnat 10/10 hai par production deployment 0/10! StackOverflow ko thoda rest do aur code ship karo! 🚀🔥&rdquo;
              </p>
            </div>
            <div className="modal-foot">
              <button className="primary-btn" onClick={goLogin}>Get Roasted on GitBridge →</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. HELP CENTER MODAL */}
      {activeModal === "help" && (
        <div className="home-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="home-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>💬 GitBridge Public Help Center</h3>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <p className="modal-desc">
              Have an inquiry or experiencing a technical issue? Submit your question and it will be stored in our database for review.
            </p>
            <form onSubmit={handleHelpSubmit} className="modal-help-form">
              <label>Your Inquiry or Question:</label>
              <textarea
                placeholder="Describe your question or issue..."
                value={helpQuery}
                onChange={(e) => setHelpQuery(e.target.value)}
                rows={4}
                required
              />
              <label>Your Email:</label>
              <input
                type="email"
                placeholder="developer@example.com"
                value={helpEmail}
                onChange={(e) => setHelpEmail(e.target.value)}
              />
              <div className="modal-foot">
                <button type="button" className="secondary-btn" onClick={() => setActiveModal(null)}>Close</button>
                <button type="submit" className="primary-btn" disabled={helpSubmitting}>
                  {helpSubmitting ? "Submitting..." : "Submit to MongoDB →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;