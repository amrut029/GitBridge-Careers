import "./HeroRight.css";

const ScoreCard = ({ title, score, total, icon: Icon, color }) => {
  return (
    <div className="score-card">

      <div className="score-card-content">

        <div>

          <p className="score-title">{title}</p>

          <h2 className="score-number">
            {score}
            <span>/{total}</span>
          </h2>

        </div>

        <div
          className="score-icon"
          style={{ background: `${color}20` }}
        >
          <Icon style={{ color }} />
        </div>

      </div>

    </div>
  );
};

export default ScoreCard;