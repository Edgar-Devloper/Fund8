import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = ({ variant = 'default' }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right - window.scrollX
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      const target = event.target;
      
      // Check if click is outside both button and dropdown
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(target);
      
      if (isOutsideDropdown && isOutsideButton) {
        setIsOpen(false);
      }
    };

    // Use a small delay to prevent immediate closing when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [isOpen]);

  // SVG Globe Icon
  const GlobeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div 
        ref={dropdownRef}
        className="language-selector-hyperliquid"
        style={{ 
          position: 'relative', 
          zIndex: 10004,
          pointerEvents: 'auto'
        }}
      >
        <button
          ref={buttonRef}
          className="nav-icon-btn"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(prev => !prev);
          }}
          style={{ 
            border: '1px solid var(--hl-dark-border, #1e2541)',
            background: 'transparent',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            color: 'var(--hl-text-secondary, #a0aec0)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none',
            padding: 0,
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 1002
          }}
        >
          <GlobeIcon />
        </button>

        {isOpen && (
          <div
            style={{
              position: 'fixed',
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
              background: 'var(--hl-dark-card, #151a2e)',
              border: '1px solid var(--hl-dark-border, #1e2541)',
              borderRadius: '8px',
              padding: '8px 0',
              minWidth: '160px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              zIndex: 10010,
              display: 'block',
              visibility: 'visible',
              opacity: 1,
              pointerEvents: 'auto'
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '8px 16px',
                  border: 'none',
                  background: i18n.language === lang.code ? 'var(--hl-hover, #1f2640)' : 'transparent',
                  color: i18n.language === lang.code ? 'var(--hl-accent-teal, #00e5cc)' : 'var(--hl-text-secondary, #a0aec0)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '14px',
                  textAlign: 'left',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  if (i18n.language !== lang.code) {
                    e.target.style.background = 'var(--hl-hover, #1f2640)';
                    e.target.style.color = 'var(--hl-text-primary, #ffffff)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (i18n.language !== lang.code) {
                    e.target.style.background = 'transparent';
                    e.target.style.color = 'var(--hl-text-secondary, #a0aec0)';
                  }
                }}
              >
                <span style={{ marginRight: '8px', fontSize: '16px' }}>{lang.flag}</span>
                {lang.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div 
        ref={dropdownRef}
        className="language-selector"
        style={{ position: 'relative', display: 'inline-block' }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{ 
            border: 'none',
            background: 'transparent',
            boxShadow: 'none',
            cursor: 'pointer',
            padding: 0,
            outline: 'none'
          }}
        >
          <span style={{ fontSize: '20px' }}>{currentLanguage.flag}</span>
        </button>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: 'var(--hl-dark-card, #151a2e)',
              border: '1px solid var(--hl-dark-border, #1e2541)',
              borderRadius: '8px',
              padding: '8px 0',
              minWidth: '160px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              zIndex: 1000
            }}
          >
          {languages.map((lang) => (
              <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '8px 16px',
                  border: 'none',
                  background: i18n.language === lang.code ? 'var(--hl-hover, #1f2640)' : 'transparent',
                  color: i18n.language === lang.code ? 'var(--hl-accent-teal, #00e5cc)' : 'var(--hl-text-secondary, #a0aec0)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '14px',
                  textAlign: 'left',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  if (i18n.language !== lang.code) {
                    e.target.style.background = 'var(--hl-hover, #1f2640)';
                    e.target.style.color = 'var(--hl-text-primary, #ffffff)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (i18n.language !== lang.code) {
                    e.target.style.background = 'transparent';
                    e.target.style.color = 'var(--hl-text-secondary, #a0aec0)';
                  }
                }}
            >
              <span style={{ marginRight: '8px' }}>{lang.flag}</span>
              {lang.name}
              </button>
          ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={dropdownRef}
      className="language-selector"
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px',
          border: '1px solid var(--hl-dark-border, #1e2541)',
          background: 'transparent',
          borderRadius: '8px',
          color: 'var(--hl-text-primary, #ffffff)',
          cursor: 'pointer',
          outline: 'none'
        }}
      >
        <span style={{ marginRight: '8px' }}>{currentLanguage.flag}</span>
        {currentLanguage.name}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            background: 'var(--hl-dark-card, #151a2e)',
            border: '1px solid var(--hl-dark-border, #1e2541)',
            borderRadius: '8px',
            padding: '8px 0',
            minWidth: '160px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 1000
          }}
        >
        {languages.map((lang) => (
            <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '8px 16px',
                border: 'none',
                background: i18n.language === lang.code ? 'var(--hl-hover, #1f2640)' : 'transparent',
                color: i18n.language === lang.code ? 'var(--hl-accent-teal, #00e5cc)' : 'var(--hl-text-secondary, #a0aec0)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '14px',
                textAlign: 'left',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (i18n.language !== lang.code) {
                  e.target.style.background = 'var(--hl-hover, #1f2640)';
                  e.target.style.color = 'var(--hl-text-primary, #ffffff)';
                }
              }}
              onMouseLeave={(e) => {
                if (i18n.language !== lang.code) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'var(--hl-text-secondary, #a0aec0)';
                }
              }}
          >
            <span style={{ marginRight: '8px' }}>{lang.flag}</span>
            {lang.name}
            </button>
        ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
