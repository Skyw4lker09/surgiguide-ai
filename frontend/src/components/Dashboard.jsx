import React from 'react';
import { 
  BookOpen, 
  Cpu, 
  Database, 
  HelpCircle, 
  ArrowRight,
  Sparkles,
  Layers,
  GraduationCap
} from 'lucide-react';

export default function Dashboard({ onCardAction }) {
  const cards = [
    {
      id: 'overview',
      title: 'Project Overview & Objectives',
      desc: 'Understand the main objectives, solved clinical problems, and core clinical motivations behind the surgical grounding framework.',
      icon: BookOpen,
      actionText: 'Generate Overview',
      query: 'Give me a comprehensive project overview and discuss its core objectives.'
    },
    {
      id: 'architecture',
      title: 'Technical Architecture',
      desc: 'Explore the neural network pipeline: dual visual/text encoders, cross-modal token-fusion modules, and regression/segmentation output heads.',
      icon: Cpu,
      actionText: 'View Architecture Flow',
      query: 'Explain the detailed model architecture and show the processing flow.'
    },
    {
      id: 'datasets',
      title: 'Surgical Datasets & Annotations',
      desc: 'Learn about standard surgical benchmarks like Cholec80, EndoVis challenges, Instrument-Verb-Target annotation, and clinical noise factors.',
      icon: Database,
      actionText: 'Explore Datasets',
      query: 'What surgical datasets are commonly used and what are their challenges?'
    },
    {
      id: 'viva',
      title: 'Viva Prep Coach',
      desc: 'Interactive examiner tool with mock viva questions grouped by Basic, Intermediate, and Advanced difficulties to test your defense preparedness.',
      icon: GraduationCap,
      actionText: 'Start Viva Prep',
      query: 'Give me a mock viva question.',
      tab: 'viva'
    }
  ];

  return (
    <div className="page-container">
      {/* Jumbotron Card */}
      <div className="dashboard-card glass" style={{ marginBottom: '32px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Sparkles style={{ color: 'var(--accent-teal)' }} size={18} />
          <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-teal)', letterSpacing: '0.05em' }}>
            SurgiGuide AI Copilot
          </span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '28px', fontWeight: '800', marginBottom: '12px', lineHeight: '1.3' }}>
          Vision-Language Grounding for Surgical Scene Understanding in Robotic-Assisted Procedures
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.7', maxWidth: '800px' }}>
          Welcome to your project assistant dashboard. SurgiGuide AI helps explain clinical methodologies, 
          dissect neural architectures, guide dataset configurations, and prepare you for your final thesis viva and presentations.
        </p>
      </div>

      <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
        Interactive Knowledge Pillars
      </h3>

      <div className="dashboard-grid">
        {cards.map((card) => {
          const IconComponent = card.icon;
          return (
            <div key={card.id} className="dashboard-card glass">
              <div className="card-header-row">
                <h4 className="card-title">{card.title}</h4>
                <IconComponent className="card-icon" />
              </div>
              <p className="card-body">{card.desc}</p>
              <button 
                className="card-action-btn"
                onClick={() => onCardAction(card.query, card.tab || 'chat')}
              >
                <span>{card.actionText}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Project Status Bar */}
      <div className="dashboard-card glass" style={{ borderStyle: 'dashed', borderColor: 'var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Layers style={{ color: 'var(--accent-blue)' }} />
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
              Specialized Core Domains Enabled
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Open-Vocabulary Grounding • Token-Interaction Cross-Attention • Contrastive Manifold Alignment • da Vinci Kinematics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
