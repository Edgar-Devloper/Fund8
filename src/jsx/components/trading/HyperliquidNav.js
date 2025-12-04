import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ConnectWalletButton from '../Web3/ConnectWalletButton';
import LanguageSelector from '../LanguageSelector';
import SettingsModal from '../Settings/SettingsModal';
import BalanceDisplay from './BalanceDisplay';
import fund8Logo from '../../../images/brand/fund8-logo-black-bg.png';
import './HyperliquidNav.css';

const HyperliquidNav = () => {
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll to show/hide nav
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show nav when at top or scrolling up
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        // Scrolling down and past threshold
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Update body class when nav visibility changes
  useEffect(() => {
    if (isVisible) {
      document.body.classList.remove('nav-hidden');
    } else {
      document.body.classList.add('nav-hidden');
    }
    
    return () => {
      document.body.classList.remove('nav-hidden');
    };
  }, [isVisible]);

  // Navigation items - Trade active, others show as coming soon
  const navItems = [
    { path: '/', label: 'Trade', icon: null, enabled: true },
    { path: '#', label: 'Portfolio', icon: null, enabled: false, comingSoon: true },
    { path: '#', label: 'Vaults', icon: null, enabled: false, comingSoon: true },
    { path: '#', label: 'Staking', icon: null, enabled: false, comingSoon: true },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/trading';
    return location.pathname === path;
  };

  return (
    <nav className={`hyperliquid-nav ${isVisible ? 'nav-visible' : 'nav-hidden'}`}>
      <div className="hyperliquid-nav-container">
        {/* Logo/Brand */}
        <Link to="/" className="hyperliquid-nav-brand">
          <img 
            src={fund8Logo} 
            alt="Fund8" 
            className="fund8-logo"
            style={{
              height: '40px',
              width: 'auto',
              objectFit: 'contain'
            }}
          />
        </Link>

        {/* Navigation Links - Removed */}

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
            <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-menu-header">
                <img 
                  src={fund8Logo} 
                  alt="Fund8" 
                  className="fund8-logo"
                  style={{ height: '32px', width: 'auto' }}
                />
                <button 
                  className="mobile-menu-close"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  ×
                </button>
              </div>
              <div className="mobile-menu-links">
                {/* Navigation links removed */}
              </div>
            </div>
          </div>
        )}

        {/* Right Actions */}
        <div className="hyperliquid-nav-actions">
          <BalanceDisplay />
          
          <ConnectWalletButton />
          
          <LanguageSelector variant="icon" />
          
          {/* Settings button hidden */}
          {false && (
            <button 
              className="nav-icon-btn" 
              title="Settings"
              onClick={() => setShowSettings(true)}
            >
              ⚙️
            </button>
          )}
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

