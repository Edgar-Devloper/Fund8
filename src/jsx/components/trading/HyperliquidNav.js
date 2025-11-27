import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ConnectWalletButton from '../Web3/ConnectWalletButton';
import LanguageSelector from '../LanguageSelector';
import SettingsModal from '../Settings/SettingsModal';
import './HyperliquidNav.css';

const HyperliquidNav = () => {
  const location = useLocation();
  const [showSettings, setShowSettings] = React.useState(false); // eslint-disable-line

  const navItems = [
    { path: '/', label: 'Trade', icon: null, enabled: true },
    { path: '#', label: 'Vaults', icon: null, enabled: false, comingSoon: true },
    { path: '#', label: 'Portfolio', icon: null, enabled: false, comingSoon: true },
    { path: '#', label: 'Staking', icon: null, enabled: false, comingSoon: true },
    { path: '#', label: 'Referrals', icon: null, enabled: false, comingSoon: true },
    { path: '#', label: 'Leaderboard', icon: null, enabled: false, comingSoon: true },
    { path: '#', label: 'More', icon: '▾', enabled: false, isDropdown: true, comingSoon: true },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/trading';
    return location.pathname === path;
  };

  return (
    <nav className="hyperliquid-nav">
      <div className="hyperliquid-nav-container">
        {/* Logo/Brand */}
        <div className="hyperliquid-nav-brand">
          <span className="brand-icon">F8</span>
          <span className="brand-text">Fund8</span>
        </div>

        {/* Navigation Links */}
        <div className="hyperliquid-nav-links">
          {navItems.map((item) => (
            <div key={item.label} className="nav-link-wrapper">
              {item.enabled ? (
                <Link
                  to={item.path}
                  className={`nav-link-item ${isActive(item.path) ? 'active' : ''}`}
                >
                  <span className="nav-label">{item.label}</span>
                  {item.icon && <span className="nav-icon">{item.icon}</span>}
                </Link>
              ) : (
                <div className={`nav-link-item disabled ${item.comingSoon ? 'has-tooltip' : ''}`}>
                  <span className="nav-label">{item.label}</span>
                  {item.icon && <span className="nav-icon">{item.icon}</span>}
                  
                  {item.comingSoon && (
                    <div className="coming-soon-tooltip">
                      <div className="tooltip-content">
                        <div className="tooltip-title">Coming Soon</div>
                        <div className="tooltip-description">
                          This feature will be available soon
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Actions */}
        <div className="hyperliquid-nav-actions">
          <ConnectWalletButton />
          
          <LanguageSelector variant="icon" />
          
          <button 
            className="nav-icon-btn" 
            title="Settings"
            onClick={() => setShowSettings(true)}
          >
            ⚙️
          </button>
        </div>
      </div>
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </nav>
  );
};

export default HyperliquidNav;

