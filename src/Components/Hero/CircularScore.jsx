import "./HeroRight.css";

const CircularScore = ({ score, title, status }) => {
  const radius = 75;
  const stroke = 12;

  const normalizedRadius = radius - stroke / 2;

  const circumference = normalizedRadius * 2 * Math.PI;

  const progress = circumference - (score / 100) * circumference;

  return (
    <div className="career-score-card">

      <h3>{title}</h3>

      <div className="progress-circle">

        <svg
          width="190"
          height="190"
          className="circle-svg"
        >
          <defs>
            <linearGradient
              id="scoreGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#D8B4FE" />
              <stop offset="100%" stopColor="#4F46E5" />
            </linearGradient>
          </defs>

          {/* Background */}

          <circle
            className="circle-bg"
            stroke="#ECECEC"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx="95"
            cy="95"
          />

          {/* Progress */}

          <circle
            className="circle-progress"
            stroke="url(#scoreGradient)"
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            r={normalizedRadius}
            cx="95"
            cy="95"
          />

        </svg>

        <div className="circle-content">

          <h1>{score}</h1>

          <span>/100</span>

        </div>

      </div>

      <p className="progress-status">

        📈 {status}

      </p>

    </div>
  );
};

export default CircularScore;