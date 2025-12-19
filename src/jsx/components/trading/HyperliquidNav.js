import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import ConnectWalletButton from '../Web3/ConnectWalletButton';
import LanguageSelector from '../LanguageSelector';
import SettingsModal from '../Settings/SettingsModal';
import BalanceDisplay from './BalanceDisplay';
import { useWallet } from '../../../context/WalletContext';
import fund8Logo from '../../../images/brand/fund8-logo-black-bg.png';
import './HyperliquidNav.css';

// Componente para los botones Register/Login (definido antes de HyperliquidNav)
const TradingPortalButtons = () => {
  const { t } = useTranslation();
  const { isConnected, address } = useWallet();
  const { tradingPortal, auth } = useSelector(state => state.auth);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Verificar si tiene cuenta de Trading Portal pero no está logueado
  const hasPortalAccount = tradingPortal?.hasPortalAccount || false;
  const isLoggedIn = !!auth?.idToken; // Verificar si está logueado en el portal
  const isVerified = tradingPortal?.isVerified || false;

  // Mostrar Register si tiene wallet pero no tiene cuenta
  const showRegister = isConnected && address && !hasPortalAccount;

  // Mostrar Login si tiene cuenta pero no está logueado o verificado
  const showLogin = isConnected && address && hasPortalAccount && (!isLoggedIn || !isVerified);

  // Debug: Log para verificar estado
  console.log('[TradingPortalButtons] Estado:', {
    isConnected,
    address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'none',
    hasPortalAccount,
    isLoggedIn,
    isVerified,
    showRegister,
    showLogin
  });

  // No mostrar nada si no hay wallet conectada o si ya está todo completo
  if (!isConnected || !address) {
    return null;
  }

  // Si ya tiene cuenta y está logueado y verificado, no mostrar botones
  if (hasPortalAccount && isLoggedIn && isVerified) {
    return null;
  }

  return (
    <>
      {showRegister && (
        <button
          className="register-btn"
          onClick={() => {
            console.log('[TradingPortalButtons] Register button clicked');
            setShowRegisterModal(true);
          }}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: '1px solid #00c087',
            borderRadius: '8px',
            color: '#00c087',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            marginRight: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 192, 135, 0.1)';
            e.currentTarget.style.borderColor = '#00c087';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = '#00c087';
          }}
        >
          {t('trading_portal.register', 'Register')}
        </button>
      )}

      {showLogin && (
        <button
          className="login-btn"
          onClick={() => {
            console.log('[TradingPortalButtons] Login button clicked');
            setShowLoginModal(true);
          }}
          style={{
            padding: '8px 16px',
            background: '#00c087',
            border: 'none',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#00b079';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#00c087';
          }}
        >
          {t('trading_portal.login', 'Login')}
        </button>
      )}
      
      {/* Modales - Renderizar siempre para que estén en el DOM */}
      <TradingPortalRegistrationModalWrapper 
        show={showRegisterModal} 
        onClose={() => {
          setShowRegisterModal(false);
          console.log('[TradingPortalButtons] Register modal closed');
        }} 
      />
      
      <TradingPortalLoginModalWrapper 
        show={showLoginModal} 
        onClose={() => {
          setShowLoginModal(false);
          console.log('[TradingPortalButtons] Login modal closed');
        }} 
      />
    </>
  );
};

// Wrapper para el modal de registro (para evitar importación circular)
const TradingPortalRegistrationModalWrapper = ({ show, onClose }) => {
  const TradingPortalRegistrationModal = React.lazy(() => 
    import('../TradingPortal/TradingPortalRegistrationModal')
  );
  
  if (!show) {
    return null;
  }
  
  return (
    <React.Suspense fallback={null}>
      <TradingPortalRegistrationModal show={show} onClose={onClose} forceShow={show} />
    </React.Suspense>
  );
};

// Wrapper para el modal de login
const TradingPortalLoginModalWrapper = ({ show, onClose }) => {
  const TradingPortalLoginModal = React.lazy(() => 
    import('../TradingPortal/TradingPortalLoginModal')
  );
  
  if (!show) {
    return null;
  }
  
  return (
    <React.Suspense fallback={null}>
      <TradingPortalLoginModal show={show} onClose={onClose} />
    </React.Suspense>
  );
};

const HyperliquidNav = () => {
  const location = useLocation();
  const { t } = useTranslation();
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

  // Menu items para el topbar integrado
  const menuItems = [
    { id: 'trade', label: t('topbar.trade', 'Trade'), path: '/trading', enabled: true },
    { id: 'portfolio', label: t('topbar.portfolio', 'Portfolio'), path: '#', enabled: false },
    { id: 'staking', label: t('topbar.staking', 'Staking'), path: '#', enabled: false },
    { id: 'referrals', label: t('topbar.referrals', 'Referrals'), path: '#', enabled: false },
    { id: 'rewards', label: t('topbar.rewards', 'Rewards'), path: '#', enabled: false },
    { id: 'leaderboard', label: t('topbar.leaderboard', 'Leaderboard'), path: '#', enabled: false },
  ];
  
  // Submenu items para "More"
  const moreSubmenuItems = [
    { id: 'docs', label: t('topbar.docs', 'Docs'), path: '#' },
    { id: 'stats', label: t('topbar.stats', 'Stats'), path: '#' },
    { id: 'offers', label: t('topbar.offers', 'Offers'), path: '#' },
    { id: 'announcements', label: t('topbar.announcements', 'Announcements'), path: '#' },
  ];

  const isActive = (path) => {
    if (path === '/trading') {
      return location.pathname === '/' || location.pathname === '/trading';
    }
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

        {/* Navigation Menu - Integrado al lado del logo */}
        <nav className="hyperliquid-nav-menu">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return item.enabled ? (
              <Link
                key={item.id}
                to={item.path}
                className={`hyperliquid-nav-menu-item ${active ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ) : (
              <TooltipMenuItem
                key={item.id}
                label={item.label}
                tooltip={t('topbar.coming_soon', 'Próximamente')}
              />
            );
          })}
          <MoreMenuSubmenu items={moreSubmenuItems} />
        </nav>

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
          
          {/* Register/Login Buttons - Trading Portal */}
          <TradingPortalButtons />
          
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

// Componente para elementos del menú con tooltip
const TooltipMenuItem = ({ label, tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const itemRef = useRef(null);

  const handleMouseEnter = () => {
    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.bottom + 10,
        left: rect.left + (rect.width / 2)
      });
      setShowTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <>
      <span
        ref={itemRef}
        className="hyperliquid-nav-menu-item disabled"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {label}
      </span>
      {showTooltip && (
        <div
          className="hyperliquid-nav-tooltip"
          style={{
            position: 'fixed',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translateX(-50%)',
            padding: '8px 14px',
            background: 'rgba(0, 0, 0, 0.95)',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            borderRadius: '6px',
            zIndex: 10000,
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
          }}
        >
          {tooltip}
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              border: '6px solid transparent',
              borderBottomColor: 'rgba(0, 0, 0, 0.95)'
            }}
          />
        </div>
      )}
    </>
  );
};

// Componente para el submenú "More"
const MoreMenuSubmenu = ({ items }) => {
  const { t } = useTranslation();
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const itemRef = useRef(null);
  const submenuRef = useRef(null);

  const handleMouseEnter = () => {
    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.bottom + 10,
        left: rect.left + (rect.width / 2)
      });
    }
    setShowSubmenu(true);
  };

  const handleMouseLeave = () => {
    setShowSubmenu(false);
  };

  return (
    <div
      ref={itemRef}
      className="hyperliquid-nav-menu-item more-menu-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="hyperliquid-nav-menu-item disabled">
        {t('topbar.more', 'More')}
      </span>
      {showSubmenu && (
        <div
          ref={submenuRef}
          className="more-submenu"
          style={{
            position: 'fixed',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translateX(-50%)',
            background: 'rgba(21, 26, 46, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '8px 0',
            minWidth: '160px',
            zIndex: 10001,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {items.map((subItem) => (
            <Link
              key={subItem.id}
              to={subItem.path}
              className="more-submenu-item"
              style={{
                display: 'block',
                padding: '10px 20px',
                color: '#ffffff',
                textDecoration: 'none',
                fontSize: '14px',
                transition: 'background-color 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {subItem.label}
            </Link>
          ))}
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              border: '6px solid transparent',
              borderBottomColor: 'rgba(21, 26, 46, 0.98)'
            }}
          />
        </div>
      )}
    </div>
  );
};


export default HyperliquidNav;

