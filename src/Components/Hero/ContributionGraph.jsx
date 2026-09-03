import { useState } from "react";
import "./HeroRight.css";

const ContributionGraph = () => {
  const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];

  // Fixed data (90 cells)
  const contributions = Array.from({ length: 90 }, (_, index) => ({
    id: index,
    level: Math.floor(Math.random() * 5),
    count: Math.floor(Math.random() * 18),
    date: `July ${((index % 30) + 1)}, 2026`,
  }));

  const [tooltip, setTooltip] = useState(null);

  return (
    <div className="graph-card">
      <div className="graph-header">
        <h3>Contribution Graph</h3>
        <a href="/">View Profile →</a>
      </div>

      <div className="graph-months">
        {months.map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>

      <div className="graph-grid">
        {contributions.map((item) => (
          <div
            key={item.id}
            className={`graph-box level-${item.level}`}
            onMouseEnter={(e) =>
              setTooltip({
                x: e.clientX,
                y: e.clientY,
                count: item.count,
                date: item.date,
              })
            }
            onMouseMove={(e) =>
              setTooltip((prev) => ({
                ...prev,
                x: e.clientX,
                y: e.clientY,
              }))
            }
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </div>

      {tooltip && (
        <div
          className="graph-tooltip"
          style={{
            left: tooltip.x + 15,
            top: tooltip.y - 55,
          }}
        >
          <strong>{tooltip.count} Contributions</strong>

          <span>{tooltip.date}</span>
        </div>
      )}
    </div>
  );
};

export default ContributionGraph;