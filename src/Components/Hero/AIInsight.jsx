import "./HeroRight.css";
import robot from "../../assets/roboy.png";
import { FaArrowRight } from "react-icons/fa";

const AIInsight = () => {
  return (
    <div className="ai-card">

      <div className="ai-top">

        <div className="ai-content">

          <span className="ai-badge">🤖 AI Career Assistant</span>

          <h4>Hi User 👋</h4>

          <p>
            I analyzed your profile and found <strong>25+</strong>
           opportunities for you.
          </p>

          {/* <ul className="ai-list">
            <li>✔ GitHub Score can improve by 12%</li>
            <li>✔ Resume ATS is 80%</li>
            <li>✔ React & JavaScript are your strongest skills</li>
          </ul> */}

        </div>

        <div className="ai-image">

          <img src={robot} alt="AI Robot" />

        </div>

      </div>

      <button className="ask-ai-btn">

        Ask Our AI Anything

        <FaArrowRight/>

      </button>

    </div>
  );
};

export default AIInsight;