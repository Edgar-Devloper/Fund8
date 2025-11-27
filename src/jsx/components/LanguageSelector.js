import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from 'react-bootstrap';

const LanguageSelector = ({ variant = 'default' }) => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    // El idioma se guardará automáticamente en localStorage por la configuración
  };

  // Estilo icon (para Hyperliquid nav)
  if (variant === 'icon') {
    return (
      <Dropdown className="language-selector-hyperliquid">
        <Dropdown.Toggle 
          as="button"
          className="nav-icon-btn"
          id="language-dropdown-icon"
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
            fontSize: '18px'
          }}
        >
          🌐
        </Dropdown.Toggle>

        <Dropdown.Menu 
          align="end"
          style={{
            background: 'var(--hl-dark-card, #151a2e)',
            border: '1px solid var(--hl-dark-border, #1e2541)',
            borderRadius: '8px',
            padding: '8px 0',
            marginTop: '8px',
            minWidth: '160px'
          }}
        >
          {languages.map((lang) => (
            <Dropdown.Item
              key={lang.code}
              active={i18n.language === lang.code}
              onClick={() => changeLanguage(lang.code)}
              style={{
                color: i18n.language === lang.code ? 'var(--hl-accent-teal, #00e5cc)' : 'var(--hl-text-secondary, #a0aec0)',
                padding: '8px 16px',
                background: i18n.language === lang.code ? 'var(--hl-hover, #1f2640)' : 'transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ marginRight: '8px' }}>{lang.flag}</span>
              {lang.name}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  // Estilo compacto (para header)
  if (variant === 'compact') {
    return (
      <Dropdown className="language-selector">
        <Dropdown.Toggle 
          variant="link" 
          id="language-dropdown"
          className="p-0 text-decoration-none"
          style={{ 
            border: 'none',
            background: 'transparent',
            boxShadow: 'none'
          }}
        >
          <span style={{ fontSize: '20px' }}>{currentLanguage.flag}</span>
        </Dropdown.Toggle>

        <Dropdown.Menu align="end">
          {languages.map((lang) => (
            <Dropdown.Item
              key={lang.code}
              active={i18n.language === lang.code}
              onClick={() => changeLanguage(lang.code)}
            >
              <span style={{ marginRight: '8px' }}>{lang.flag}</span>
              {lang.name}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  // Estilo por defecto (para settings)
  return (
    <Dropdown className="language-selector">
      <Dropdown.Toggle variant="outline-primary" id="language-dropdown">
        <span style={{ marginRight: '8px' }}>{currentLanguage.flag}</span>
        {currentLanguage.name}
      </Dropdown.Toggle>

      <Dropdown.Menu>
        {languages.map((lang) => (
          <Dropdown.Item
            key={lang.code}
            active={i18n.language === lang.code}
            onClick={() => changeLanguage(lang.code)}
          >
            <span style={{ marginRight: '8px' }}>{lang.flag}</span>
            {lang.name}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default LanguageSelector;

