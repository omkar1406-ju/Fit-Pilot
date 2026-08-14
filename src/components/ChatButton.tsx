import './ChatButton.css';

export default function ChatButton() {
  return (
    <button className="chat-button" title="Fitness Assistant">
      💬
      <span className="chat-button__tooltip">Ask Fitness Assistant</span>
    </button>
  );
}
