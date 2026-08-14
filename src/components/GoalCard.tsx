import './GoalCard.css';

interface GoalCardProps {
  icon: string;
  title: string;
  description: string;
}

export default function GoalCard({ icon, title, description }: GoalCardProps) {
  return (
    <div className="goal-card">
      <div className="goal-card__icon">{icon}</div>
      <h3 className="goal-card__title">{title}</h3>
      <p className="goal-card__desc">{description}</p>
    </div>
  );
}
