import React, { useRef, useEffect, useState } from 'react';
import { Send, ArrowRight, Sparkles } from 'lucide-react';

// Custom Markdown-to-HTML parser to render bold, headers, lists, code, and tables
function renderMarkdown(text) {
  if (!text) return '';
  
  // Escape HTML characters to prevent XSS issues while permitting simple rendering
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Format Headings
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Format Bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Format Code Blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');

  // Format Bullet Lists
  // Replace lines starting with * or - with list items
  let lines = html.split('\n');
  let inList = false;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (line.startsWith('* ') || line.startsWith('- ')) {
      let content = line.substring(2);
      if (!inList) {
        lines[i] = '<ul><li>' + content + '</li>';
        inList = true;
      } else {
        lines[i] = '<li>' + content + '</li>';
      }
    } else {
      if (inList) {
        lines[i] = '</ul>' + lines[i];
        inList = false;
      }
    }
  }
  if (inList) {
    lines[lines.length - 1] = lines[lines.length - 1] + '</ul>';
  }
  html = lines.join('\n');

  // Format paragraph breaks
  html = html.replace(/\n\n/g, '<p></p>');

  return html;
}

export default function ChatInterface({ 
  messages, 
  onSendMessage, 
  isLoading, 
  suggestions, 
  placeholderText 
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  useEffect(() => {
    // Scroll to bottom when messages or suggestions update
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, suggestions]);

  return (
    <div className="chat-container">
      {/* Messages Feed */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flex: 1, 
            color: 'var(--text-secondary)',
            textAlign: 'center',
            padding: '32px'
          }}>
            <span style={{ fontSize: '40px', marginBottom: '16px' }}>🤖</span>
            <h3 style={{ fontFamily: 'var(--font-title)', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Ask SurgiGuide AI anything
            </h3>
            <p style={{ maxWidth: '400px', fontSize: '14px', lineHeight: '1.6' }}>
              Ask about dataset annotations, spatial cross-attention matrices, or trigger viva preparation and slide layouts.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message-bubble ${msg.role === 'user' ? 'user' : 'assistant'}`}
            >
              <div className="avatar">
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div 
                className="message-content"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
              />
            </div>
          ))
        )}

        {/* Loading Pulse */}
        {isLoading && (
          <div className="message-bubble assistant">
            <div className="avatar">🤖</div>
            <div className="message-content">
              <div className="typing-loader">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {!isLoading && suggestions && suggestions.length > 0 && (
        <div className="suggestions-container">
          <div className="suggestions-title">
            Suggested Follow-ups
          </div>
          <div className="suggestions-list">
            {suggestions.map((suggestion, i) => (
              <div 
                key={i} 
                className="suggestion-chip"
                onClick={() => onSendMessage(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="chat-input-bar">
        <div className="chat-input-container glass">
          <input 
            type="text"
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholderText || "Enter your message here..."}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="chat-send-btn"
            disabled={isLoading || !input.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
