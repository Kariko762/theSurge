import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api/client';
import EventEditor from './EventEditor';
import ConfigEditor from './ConfigEditor';
import MissionEditor from './MissionEditor';
import UserManagement from './UserManagement';
import APIDocumentation from './APIDocumentation';
import EventSystemGuide from './EventSystemGuide';
import TelemetryDashboard from './TelemetryDashboard';
import EventSystemTest from '../EventSystemTest';
import { EventsIcon, MissionsIcon, ConfigIcon, UsersIcon, APIIcon, LogoutIcon, LoadingIcon, InfoIcon, WarningIcon, TestIcon } from './HoloIcons';
import '../../styles/AdminGlass.css';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('guide');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Listen for modal state changes
  useEffect(() => {
    const checkModal = () => {
      setIsModalOpen(document.body.classList.contains('modal-open'));
    };
    
    // Check initially
    checkModal();
    
    // Set up mutation observer to watch for class changes
    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Verify session on mount
    const verifySession = async () => {
      if (!api.auth.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        const response = await api.auth.session();
        setUser(response.user);
      } catch (error) {
        console.error('Session verification failed:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } finally {
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="admin-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <LoadingIcon size={60} />
          <div className="loading-text" style={{ marginTop: '1.5rem' }}>VERIFYING SESSION...</div>
        </div>
      </div>
    );
  }

  const allTabs = [
    { id: 'guide', label: 'System Guide', Icon: InfoIcon, minRole: 'viewer' },
    { id: 'telemetry', label: 'Telemetry', Icon: WarningIcon, minRole: 'viewer' },
    { id: 'test', label: 'Event Test', Icon: TestIcon, minRole: 'viewer' },
    { id: 'events', label: 'Events', Icon: EventsIcon, minRole: 'editor' },
    { id: 'missions', label: 'Missions', Icon: MissionsIcon, minRole: 'editor' },
    { id: 'config', label: 'Config', Icon: ConfigIcon, minRole: 'editor' },
    { id: 'users', label: 'Users', Icon: UsersIcon, minRole: 'admin' },
    { id: 'api', label: 'API Docs', Icon: APIIcon, minRole: 'viewer' }
  ];

  // Filter tabs based on user role
  const visibleTabs = allTabs.filter(tab => {
    if (!user) return false;
    return api.auth.hasRole(tab.minRole);
  });

  return (
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: isModalOpen ? '0.75rem 2rem' : undefined,
        minHeight: isModalOpen ? 'auto' : undefined,
        transition: 'all 0.3s ease'
      }}>
        <div>
          <h1 className="admin-title" style={{
            fontSize: isModalOpen ? '1.2rem' : undefined,
            marginBottom: isModalOpen ? '0' : undefined,
            transition: 'all 0.3s ease'
          }}>
            THE SURGE
          </h1>
          {!isModalOpen && (
            <p className="admin-subtitle">Event Engine Configuration System</p>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 20 }}>
          <div className="user-badge">
            <strong>{user?.username}</strong>
            <span className="user-role">{user?.role}</span>
          </div>
          
          <button onClick={handleLogout} className="btn-neon btn-neon-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LogoutIcon size={18} />
            LOGOUT
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="tab-container">
        {visibleTabs.map(tab => {
          const Icon = tab.Icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            >
              <Icon size={22} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Content Area */}
      <main style={{
        flex: 1,
        padding: '2rem',
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative',
        zIndex: 1,
        minHeight: 0
      }}>
        {activeTab === 'guide' && <EventSystemGuide />}
        {activeTab === 'telemetry' && <TelemetryDashboard />}
        {activeTab === 'test' && <EventSystemTest />}
        {activeTab === 'events' && <EventEditor />}
        {activeTab === 'missions' && <MissionEditor />}
        {activeTab === 'config' && <ConfigEditor />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'api' && <APIDocumentation />}
      </main>
    </div>
  );
}
