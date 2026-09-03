import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../../assets/Logo.png";
import "./Navbar.css";
import { useState } from "react";

const Navbar = () => {
  const [active, setActive] = useState("home");
  const navigate = useNavigate();
  const location = useLocation();
  const scrollToSection = (id) => {
    if (location.pathname !== "/") {
      navigate("/");

      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({
          behavior: "smooth",
        });
      }, 150);

    } else {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
      });
    }
  };

  const handleOpportunities = () => {
    const isLoggedIn = localStorage.getItem("token");

    if (isLoggedIn) {
      navigate("/opportunities");
    } else {
      navigate("/login", {
        state: {
          from: "/opportunities",
        },
      });
    }
  };

  return (
    <nav className="navbar">
      <div className="logo"><img  className="logoimg "src={Logo} alt="" />GitBridge <span> AI</span></div>

      <ul>
        <li
          className={active === "home" ? "active" : ""}
          onClick={() => {
            setActive("home");
            scrollToSection("hero");
          }}
        >
          Home
        </li>

        <li
          className={active === "features" ? "active" : ""}
          onClick={() => {
            setActive("features");
            scrollToSection("features");
          }}
        >
          Features
        </li>

        <li onClick={handleOpportunities}>Opportunities</li>

        <li
          className={active === "how" ? "active" : ""}
          onClick={() => {
            
            setActive("how");
            scrollToSection("how-it-works");
          }}
        >
          How It Works
        </li>

        <li onClick={handleOpportunities}>DashBoard</li>
      </ul>

      <div className="buttons">
        <button className="login-btn" onClick={() => navigate("/login")}>
          Login
        </button>

        <button className="signup-btn" onClick={() => navigate("/getstarted")}>
          Get Started
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
