export default function ProgressBar({ percent = 0, label }) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="progress-wrap">
      {label && <div className="progress-label">{label}</div>}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${value}%` }} />
      </div>
      <div className="progress-percent">{value}%</div>
    </div>
  );
}
