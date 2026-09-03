import "./FloatingNotification.css";

export const FloatingNotification = ({ icon, title, message, className }) => {
  return (
    <div className={`floating-card ${className}`}>
      <div className="floating-icon">
        {icon}
      </div>

      <div className="floating-content">
        <h4>{title}</h4>
        <p>{message}</p>
      </div>
    </div>
  );
};
