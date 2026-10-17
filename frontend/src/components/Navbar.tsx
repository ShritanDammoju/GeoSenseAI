import type { TabType, BackendHealth } from '../types/dashboard';
import { API_BASE_URL } from '../config/api';
import { 
  Flame, 
  Activity, 
  TrendingUp, 
  Sparkles, 
  Cpu, 
  Map as MapIcon, 
  ShieldCheck, 
  BookOpen, 
  RefreshCw,
  Server
} from 'lucide-react';

interface NavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  backendHealth: BackendHealth | null;
  backendLoading: boolean;
  onRefreshHealth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  backendHealth,
  backendLoading,
  onRefreshHealth,
}) => {
  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Dashboard', icon: <Activity size={16} /> },
    { id: 'trends', label: 'Historical Trends', icon: <TrendingUp size={16} /> },
    { id: 'forecast', label: 'Next-Day Forecast', icon: <Sparkles size={16} /> },
    { id: 'models', label: 'Model Lab', icon: <Cpu size={16} /> },
    { id: 'map', label: 'Hotspot Map', icon: <MapIcon size={16} /> },
    { id: 'quality', label: 'Data Quality', icon: <ShieldCheck size={16} /> },
    { id: 'methodology', label: 'Methodology', icon: <BookOpen size={16} /> },
  ];

  return (
    <header className="navbar-container">
      <div className="navbar-top">
        <div 
          className="brand-group" 
          onClick={() => onTabChange('overview')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onTabChange('overview');
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="GeoSense AI Dashboard Home"
        >
          <div className="brand-logo-badge">
            <Flame className="brand-flame-icon" size={20} />
          </div>
          <div>
            <div className="brand-title-row">
              <span className="brand-title">GeoSense AI</span>
              <span className="hackathon-tag">Hackathon Demo</span>
            </div>
            <p className="brand-tagline">Environmental Hotspot Activity Forecast</p>
          </div>
        </div>

        {/* Backend live connection status pill */}
        <div className="backend-status-pill">
          <Server size={14} className="server-icon" />
          <span className="backend-label">FastAPI Backend:</span>
          {backendLoading ? (
            <span className="status-badge checking">
              <span className="dot dot-pulse"></span>
              Checking...
            </span>
          ) : backendHealth ? (
            <span className="status-badge online" title={`Backend is online at ${API_BASE_URL} and serving /health`}>
              <span className="dot dot-green"></span>
              Online {backendHealth.firms_map_key_configured ? '(NASA Live)' : '(Active)'}
            </span>
          ) : (
            <span className="status-badge offline" title={`Backend offline at ${API_BASE_URL}`}>
              <span className="dot dot-red"></span>
              Offline
            </span>
          )}

          <button
            className="refresh-health-btn"
            onClick={onRefreshHealth}
            disabled={backendLoading}
            title={`Check connection to ${API_BASE_URL}/health`}
            aria-label="Check backend connection health"
          >
            <RefreshCw size={12} className={backendLoading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="navbar-nav" aria-label="Main Navigation">
        <div className="nav-tabs-wrapper" role="tablist">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${item.id}`}
                className={`nav-tab-button ${isActive ? 'active' : ''}`}
                onClick={() => onTabChange(item.id)}
              >
                <span className="tab-icon">{item.icon}</span>
                <span className="tab-label">{item.label}</span>
                {isActive && <div className="active-tab-bar" />}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
