import { useState, useRef, useEffect } from 'react';
import './ChatButton.css';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'assistant';
}

const INITIAL_MESSAGE: Message = {
  id: 0,
  text: "Hey! 👋 I'm your Fitness Assistant. Ask me anything about your workouts, nutrition, recovery, or fitness journey.",
  sender: 'assistant',
};

export default function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;

    const userMessage: Message = {
      id: Date.now(),
      text,
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    setTimeout(() => {
      const reply: Message = {
        id: Date.now() + 1,
        text: 'AI connection coming next...',
        sender: 'assistant',
      };
      setMessages((prev) => [...prev, reply]);
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button
        className="chat-button"
        title="Fitness Assistant"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? '✕' : '💬'}
        <span className="chat-button__tooltip">
          {isOpen ? 'Close Assistant' : 'Ask Fitness Assistant'}
        </span>
      </button>

      {isOpen && (
        <div className="chat-panel">
          <div className="chat-panel__header">
            <div className="chat-panel__header-info">
              <span className="chat-panel__avatar">🤖</span>
              <div>
                <h3 className="chat-panel__title">Fitness Assistant</h3>
                <p className="chat-panel__subtitle">Your personal fitness companion</p>
              </div>
            </div>
            <button
              className="chat-panel__close"
              onClick={() => setIsOpen(false)}
              title="Close"
            >
              ✕
            </button>
          </div>

          <div className="chat-panel__messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-msg chat-msg--${msg.sender}`}
              >
                {msg.sender === 'assistant' && (
                  <span className="chat-msg__avatar">🤖</span>
                )}
                <div className="chat-msg__bubble">{msg.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-panel__input-area">
            <input
              ref={inputRef}
              className="chat-panel__input"
              type="text"
              placeholder="Ask about workouts, nutrition..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="chat-panel__send"
              onClick={handleSend}
              disabled={!inputValue.trim()}
              title="Send"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
