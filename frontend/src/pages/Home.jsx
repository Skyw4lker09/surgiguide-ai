import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import ChatInterface from '../components/ChatInterface';
import { AlertCircle, Terminal, HelpCircle, BookOpen, Presentation, Compass, Play } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  
  // Separate message history for each tab
  const [messages, setMessages] = useState({
    chat: [],
    viva: [],
    presentation: [],
    'future-scope': []
  });

  // Separate suggestions for each tab
  const [suggestions, setSuggestions] = useState({
    chat: ['Explain the project overview', 'What datasets are used?', 'Show me the model architecture'],
    viva: [],
    presentation: [],
    'future-scope': []
  });

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/`);
        if (response.ok) {
          setBackendOnline(true);
        } else {
          setBackendOnline(false);
        }
      } catch (error) {
        setBackendOnline(false);
      }
    };
    checkHealth();
    // Check every 10 seconds
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCardAction = (query, targetTab) => {
    setActiveTab(targetTab);
    handleSendMessage(query, targetTab);
  };

  const handleSendMessage = async (text, overrideTab = null) => {
    const currentTab = overrideTab || activeTab;
    if (!text.trim() || isLoading) return;

    // 1. Add user message to history
    const userMsg = { role: 'user', content: text };
    setMessages(prev => ({
      ...prev,
      [currentTab]: [...prev[currentTab], userMsg]
    }));

    setIsLoading(true);
    setApiKeyMissing(false);

    try {
      // Get conversation history for this specific tab to maintain context
      const chatHistory = messages[currentTab].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Call FastAPI
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: chatHistory,
          tab: currentTab
        })
      });

      if (response.status === 503) {
        // API Key missing
        setApiKeyMissing(true);
        throw new Error("Gemini API Key is missing on the server.");
      }

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // 2. Add assistant response to history
      const botMsg = { role: 'assistant', content: data.response };
      setMessages(prev => ({
        ...prev,
        [currentTab]: [...prev[currentTab], botMsg]
      }));

      // 3. Update suggestions
      setSuggestions(prev => ({
        ...prev,
        [currentTab]: data.suggestions || []
      }));

    } catch (err) {
      console.error(err);
      const errorMsg = { 
        role: 'assistant', 
        content: `⚠️ **Error**: Could not connect to the backend server or the Gemini API.\n\n${
          apiKeyMissing 
          ? "The `GEMINI_API_KEY` environment variable is not configured. Please add your key to `backend/.env` and restart the backend server." 
          : "Please ensure the FastAPI backend is running on `http://localhost:8000` and has a valid API key."
        }` 
      };
      setMessages(prev => ({
        ...prev,
        [currentTab]: [...prev[currentTab], errorMsg]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to trigger topic initializations directly
  const triggerTopicInit = async (endpoint, tabName) => {
    setIsLoading(true);
    setApiKeyMissing(false);
    
    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ history: [] })
      });

      if (response.status === 503) {
        setApiKeyMissing(true);
        throw new Error("API Key missing.");
      }

      if (!response.ok) throw new Error("Error fetching data");

      const data = await response.json();
      const botMsg = { role: 'assistant', content: data.response };
      
      setMessages(prev => ({
        ...prev,
        [tabName]: [botMsg]
      }));
      setSuggestions(prev => ({
        ...prev,
        [tabName]: data.suggestions || []
      }));
    } catch (err) {
      console.error(err);
      const errorMsg = { 
        role: 'assistant', 
        content: `⚠️ **Error**: Failed to initialize tab.\n\n${
          apiKeyMissing 
          ? "The `GEMINI_API_KEY` is missing. Configure it in `backend/.env`." 
          : "Ensure FastAPI backend is running on port 8000."
        }` 
      };
      setMessages(prev => ({
        ...prev,
        [tabName]: [errorMsg]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const getHeaderTitle = () => {
    switch(activeTab) {
      case 'dashboard': return 'Project Overview Dashboard';
      case 'chat': return 'Advanced Research Chat Assistant';
      case 'viva': return 'Interactive Viva Prep Coach';
      case 'presentation': return 'Slide Deck Structuring Helper';
      case 'future-scope': return 'Research Future Scope & Enhancements';
      default: return 'SurgiGuide AI';
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content Area */}
      <div className="content-area">
        <header className="header">
          <h2 className="header-title">{getHeaderTitle()}</h2>
          <div className="header-status">
            <div className={`status-dot ${backendOnline ? 'online' : 'offline'}`}></div>
            <span>Backend: {backendOnline ? 'Online' : 'Offline'}</span>
          </div>
        </header>

        {apiKeyMissing && (
          <div style={{ padding: '24px 32px 0 32px' }}>
            <div className="api-warning-banner">
              <AlertCircle className="warning-icon" />
              <div className="warning-content">
                <h4>Gemini API Key Missing</h4>
                <p>
                  SurgiGuide AI cannot process queries because the <code>GEMINI_API_KEY</code> is not configured.
                  Please update your <code>backend/.env</code> file with a valid Gemini key and restart the FastAPI server.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab rendering */}
        {activeTab === 'dashboard' && (
          <Dashboard onCardAction={handleCardAction} />
        )}

        {activeTab === 'chat' && (
          <ChatInterface 
            messages={messages.chat}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            suggestions={suggestions.chat}
            placeholderText="Ask about Vision-Language Grounding, cross-modal attention, or datasets..."
          />
        )}

        {activeTab === 'viva' && (
          messages.viva.length === 0 ? (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <div className="viva-start-panel glass">
                <HelpCircle size={40} style={{ color: 'var(--accent-coral)', marginBottom: '16px' }} />
                <h3 className="viva-title">Start Mock Viva Session</h3>
                <p className="viva-desc">
                  Simulate a real project examination. The examiner AI will ask you a question, evaluate your answer, point out key requirements, and score you.
                </p>
                <div className="viva-options">
                  <button 
                    className="btn-primary blue"
                    onClick={() => triggerTopicInit('viva', 'viva')}
                    disabled={isLoading}
                  >
                    <Play size={14} />
                    <span>Begin Viva Examination</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <ChatInterface 
              messages={messages.viva}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              suggestions={suggestions.viva}
              placeholderText="Explain your answer to the examiner..."
            />
          )
        )}

        {activeTab === 'presentation' && (
          messages.presentation.length === 0 ? (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <div className="viva-start-panel glass">
                <Presentation size={40} style={{ color: 'var(--accent-blue)', marginBottom: '16px' }} />
                <h3 className="viva-title">Generate Slide Deck Outline</h3>
                <p className="viva-desc">
                  Request a structured slide outline including Title, Problems, Architecture, Results, and Speaker Notes for your final project review.
                </p>
                <button 
                  className="btn-primary blue"
                  onClick={() => triggerTopicInit('presentation', 'presentation')}
                  disabled={isLoading}
                >
                  <span>Build Slide Deck Outline</span>
                </button>
              </div>
            </div>
          ) : (
            <ChatInterface 
              messages={messages.presentation}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              suggestions={suggestions.presentation}
              placeholderText="Ask to refine specific slides, adjust layouts, or write speaker scripts..."
            />
          )
        )}

        {activeTab === 'future-scope' && (
          messages['future-scope'].length === 0 ? (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <div className="viva-start-panel glass">
                <Compass size={40} style={{ color: 'var(--accent-teal)', marginBottom: '16px' }} />
                <h3 className="viva-title">Research Future Scope</h3>
                <p className="viva-desc">
                  Load detailed research proposals for thesis extensions, covering Vision-Language-Action, real-time edge processing, and sensory force integration.
                </p>
                <button 
                  className="btn-primary blue"
                  onClick={() => triggerTopicInit('future-scope', 'future-scope')}
                  disabled={isLoading}
                >
                  <span>Generate Future Scope</span>
                </button>
              </div>
            </div>
          ) : (
            <ChatInterface 
              messages={messages['future-scope']}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              suggestions={suggestions['future-scope']}
              placeholderText="Ask about specific research extensions, federated learning, or haptic signals..."
            />
          )
        )}
      </div>
    </div>
  );
}
