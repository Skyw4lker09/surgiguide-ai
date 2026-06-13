import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquareCode, 
  GraduationCap, 
  Presentation, 
  Compass,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'Research Chat', icon: MessageSquareCode },
    { id: 'viva', label: 'Viva Prep Coach', icon: GraduationCap },
    { id: 'presentation', label: 'Slide Deck Helper', icon: Presentation },
    { id: 'future-scope', label: 'Research Future Scope', icon: Compass },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">🔬</span>
        <h1 className="sidebar-title">SurgiGuide AI</h1>
      </div>
      
      <ul className="sidebar-menu">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <li 
              key={item.id}
              className={`menu-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <IconComponent className="menu-item-icon" />
              <span>{item.label}</span>
            </li>
          );
        })}
      </ul>
      
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
          <Sparkles size={12} style={{ color: 'var(--accent-blue)' }} />
          <span>v1.0.0</span>
        </div>
        <span>Surgical Scene Grounding</span>
      </div>
    </div>
  );
}
