import './FeatureCard.css';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="feature-card">
      <div className="feature-card__icon">{icon}</div>
      <div className="feature-card__content">
        <h3 className="feature-card__title">{title}</h3>
        <p className="feature-card__desc">{description}</p>
      </div>
    </div>
  );
}
