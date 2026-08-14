import './ProgressCard.css';

interface ProgressCardProps {
  label: string;
  value: string;
  progress: number;
  subtext?: string;
}

export default function ProgressCard({ label, value, progress, subtext }: ProgressCardProps) {
  return (
    <div className="progress-card">
      <div className="progress-card__header">
        <span className="progress-card__label">{label}</span>
        <span className="progress-card__value">{value}</span>
      </div>
      <div className="progress-card__bar">
        <div
          className="progress-card__fill"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {subtext && <p className="progress-card__subtext">{subtext}</p>}
    </div>
  );
}
