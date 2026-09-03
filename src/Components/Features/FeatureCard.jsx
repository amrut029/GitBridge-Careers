import { FaArrowRight } from "react-icons/fa";
import "./FeatureCard.css";

export const FeatureCard = ({ feature }) => {
  const Icon = feature.icon;

  return (
    <div className="feature-card">

     <div className="icon-title">
         <div
        className="feature-icon"
        style={{ backgroundColor: feature.color }}
      >
        <Icon />
      </div>

      <h3>{feature.title}</h3>

     </div>
      <p>{feature.description}</p>

      <button className="learn-more-btn">
        {feature.link}
        <FaArrowRight />
      </button>

    </div>
  );
};