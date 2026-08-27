import { useState, useRef, useEffect, useCallback } from 'react';
import { streamChat } from '../lib/groqService';
import './ChatButton.css';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'assistant';
}

const INITIAL_MESSAGE: Message = {
  id: 0,
  text: "Hey! 👋 I'm FitGenie, your personal fitness companion. Ask me anything about workouts, nutrition, recovery, and your fitness journey.",
  sender: 'assistant',
};

export default function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      text,
      sender: 'user',
    };

    const assistantId = Date.now() + 1;
    const assistantMessage: Message = {
      id: assistantId,
      text: '',
      sender: 'assistant',
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInputValue('');
    setIsLoading(true);

    const chatHistory = [...messages, userMessage].map((m) => ({
      role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
      content: m.text,
    }));

    try {
      for await (const chunk of streamChat(chatHistory)) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, text: m.text + chunk } : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, text: 'Sorry, something went wrong. Please try again.' }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages]);

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
        title="FitGenie"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? '✕' : '💬'}
        <span className="chat-button__tooltip">
          {isOpen ? 'Close FitGenie' : 'Ask FitGenie'}
        </span>
      </button>

      {isOpen && (
        <div className="chat-panel">
          <div className="chat-panel__header">
            <div className="chat-panel__header-info">
              <span className="chat-panel__avatar">🤖</span>
              <div>
                <h3 className="chat-panel__title">FitGenie</h3>
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
              disabled={!inputValue.trim() || isLoading}
              title="Send"
            >
              {isLoading ? '...' : '➤'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
