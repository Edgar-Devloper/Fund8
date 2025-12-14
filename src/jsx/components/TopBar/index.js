import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'react-router-dom';
import './TopBar.css';

/**
 * Barra superior con menú estilo trader
 * Los elementos mostrarán "Próximamente" al hacer hover
 */
const TopBar = () => {
  const { t } = useTranslation();
  const location = useLocation();

  // Elementos del menú - estilo trader
  const menuItems = [
    { id: 'trade', label: t('topbar.trade', 'Trade'), path: '/trading', enabled: true },
    { id: 'portfolio', label: t('topbar.portfolio', 'Portfolio'), path: '#', enabled: false },
    { id: 'markets', label: t('topbar.markets', 'Markets'), path: '#', enabled: false },
    { id: 'analytics', label: t('topbar.analytics', 'Analytics'), path: '#', enabled: false },
    { id: 'history', label: t('topbar.history', 'History'), path: '#', enabled: false },
    { id: 'funding', label: t('topbar.funding', 'Funding'), path: '#', enabled: false },
  ];

  const isActive = (path) => {
    if (path === '/trading') {
      return location.pathname === '/' || location.pathname === '/trading';
    }
    return location.pathname === path;
  };

  return (
    <div className="top-bar">
      <div className="top-bar-container">
        <nav className="top-bar-nav">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            const content = item.enabled ? (
              <Link
                to={item.path}
                className={`top-bar-nav-item ${active ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ) : (
              <TooltipItem
                label={item.label}
                tooltip={t('topbar.coming_soon', 'Próximamente')}
              />
            );

            return (
              <div key={item.id} className="top-bar-nav-wrapper">
                {content}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

// Componente para elementos con tooltip
const TooltipItem = ({ label, tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const itemRef = useRef(null);

  const handleMouseEnter = () => {
    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - 40,
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
        className="top-bar-nav-item disabled"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {label}
      </span>
      {showTooltip && (
        <div
          className="top-bar-tooltip"
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
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              border: '6px solid transparent',
              borderTopColor: 'rgba(0, 0, 0, 0.95)'
            }}
          />
        </div>
      )}
    </>
  );
};

export default TopBar;

