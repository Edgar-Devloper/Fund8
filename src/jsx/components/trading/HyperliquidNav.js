import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { LOGOUT_ACTION } from '../../../store/actions/AuthActions';
import { setToken } from '../../../services/jwtAuthService';
import ConnectWalletButton from '../Web3/ConnectWalletButton';
import LanguageSelector from '../LanguageSelector';
import SettingsModal from '../Settings/SettingsModal';
import SupportButton from '../Support/SupportButton';
import { useWallet } from '../../../context/WalletContext';
import { useUserBalance } from '../../../hooks/useUserBalance';
import { useNFT } from '../../../context/NFTContext';
import fund8Logo from '../../../images/brand/fund8-logo-black-bg.png';
import './HyperliquidNav.css';

// Componente para los botones Register/Login/Logout (definido antes de HyperliquidNav)
const TradingPortalButtons = () => {
  const { t } = useTranslation();
  const { isConnected, address } = useWallet();
  const dispatch = useDispatch();
  const { tradingPortal, auth } = useSelector(state => state.auth);
  const { userState, loading: balanceLoading } = useUserBalance();
  const { selectedNFT } = useNFT();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Estado para mostrar dropdown de detalles del usuario
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const userDetailsRef = useRef(null);
  const emailButtonRef = useRef(null);

  // Verificar si tiene cuenta de Trading Portal pero no está logueado
  const hasPortalAccount = tradingPortal?.hasPortalAccount || false;
  
  // Estado para forzar re-render cuando cambie el token
  const [tokenCheck, setTokenCheck] = useState(0);
  
  // Verificar si está logueado: buscar token JWT en localStorage o en Redux
  const jwtToken = localStorage.getItem('jwt_token');
  const isLoggedIn = !!jwtToken || !!auth?.idToken;
  const isVerified = tradingPortal?.isVerified || false;
  
  // Escuchar cambios en localStorage para detectar cuando se guarda el token después del registro
  useEffect(() => {
    const checkToken = () => {
      const currentToken = localStorage.getItem('jwt_token');
      if (currentToken !== jwtToken) {
        setTokenCheck(prev => prev + 1);
      }
    };
    
    // Verificar cada segundo si hay un nuevo token (solo por un tiempo limitado)
    const interval = setInterval(checkToken, 1000);
    
    // Limpiar después de 10 segundos
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 10000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [jwtToken]);
  
  // Obtener email del usuario logueado desde múltiples fuentes
  // Solo obtener email si está logueado
  const getEmailFromLocalStorage = () => {
    // Si no está logueado, no devolver email
    if (!isLoggedIn) {
      return null;
    }
    
    // Intentar obtener del JWT token primero (más confiable)
    const jwtToken = localStorage.getItem('jwt_token');
    if (jwtToken) {
      try {
        const payload = JSON.parse(atob(jwtToken.split('.')[1]));
        if (payload.email) {
          return payload.email;
        }
      } catch (e) {
        console.error('Error parsing JWT token:', e);
      }
    }
    
    // Intentar obtener del trading portal en localStorage usando la dirección de wallet
    const walletAddress = address?.toLowerCase();
    if (walletAddress) {
      const tradingPortalKey = `trading_portal_${walletAddress}`;
      const tradingPortalData = localStorage.getItem(tradingPortalKey);
      if (tradingPortalData) {
        try {
          const parsed = JSON.parse(tradingPortalData);
          if (parsed.email) {
            return parsed.email;
          }
        } catch (e) {
          console.error('Error parsing trading portal data:', e);
        }
      }
    }
    
    // Intentar obtener de otras fuentes
    const rememberedEmail = localStorage.getItem('trading_portal_remembered_email');
    if (rememberedEmail) {
      return rememberedEmail;
    }
    
    return null;
  };
  
  const userEmail = isLoggedIn ? (tradingPortal?.email || auth?.email || getEmailFromLocalStorage() || null) : null;

  // Mostrar Register si tiene wallet pero no tiene cuenta
  const showRegister = isConnected && address && !hasPortalAccount;

  // Mostrar Login siempre si está conectado y NO está logueado (independientemente de si tiene cuenta)
  const showLogin = isConnected && address && !isLoggedIn;

  // Mostrar Logout si está logueado (esto tiene prioridad sobre Login)
  const showLogout = isConnected && address && isLoggedIn;
  
  // Mostrar email solo si está logueado (no mostrar después del logout)
  const shouldShowEmail = userEmail && (isConnected && address) && isLoggedIn;

  // Formatear dirección de wallet
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Obtener balance USDC
  const usdcBalance = userState?.withdrawable 
    ? parseFloat(userState.withdrawable) 
    : userState?.crossMarginSummary?.accountValue 
      ? parseFloat(userState.crossMarginSummary.accountValue) 
      : 0;

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDetailsRef.current && 
        !userDetailsRef.current.contains(event.target) &&
        emailButtonRef.current &&
        !emailButtonRef.current.contains(event.target)
      ) {
        setShowUserDetails(false);
      }
    };

    if (showUserDetails) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDetails]);

  // Calcular posición del dropdown
  useEffect(() => {
    if (showUserDetails && emailButtonRef.current) {
      const rect = emailButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [showUserDetails]);

  // Función para hacer logout
  const handleLogout = () => {
    // Limpiar JWT token
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('jwt_wallet_address');
    
    // Limpiar email guardado
    localStorage.removeItem('trading_portal_remembered_email');
    
    // Limpiar datos del trading portal para esta wallet
    if (address) {
      const walletAddress = address.toLowerCase();
      const tradingPortalKey = `trading_portal_${walletAddress}`;
      const tradingPortalData = localStorage.getItem(tradingPortalKey);
      if (tradingPortalData) {
        try {
          const parsed = JSON.parse(tradingPortalData);
          // Mantener hasPortalAccount pero limpiar email e isVerified
          const cleanedData = {
            ...parsed,
            email: null,
            isVerified: false
          };
          localStorage.setItem(tradingPortalKey, JSON.stringify(cleanedData));
        } catch (e) {
          // Si hay error, eliminar completamente
          localStorage.removeItem(tradingPortalKey);
        }
      }
    }
    
    // Limpiar token del servicio
    setToken(null);
    
    // Limpiar solo el estado de auth (NO limpiar hasPortalAccount)
    dispatch({
      type: LOGOUT_ACTION
    });
    
    // Cerrar dropdown si está abierto
    setShowUserDetails(false);
    
    // Forzar re-render para actualizar la UI
    setTokenCheck(prev => prev + 1);
  };


  // No mostrar nada si no hay wallet conectada
  if (!isConnected || !address) {
    return null;
  }


  return (
    <>
      {/* Mostrar email y logout si está logueado */}
      {(shouldShowEmail || showLogout) && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          marginRight: '8px',
          position: 'relative'
        }}>
          {/* Mostrar email si está disponible - clickeable */}
          {userEmail && (
            <div style={{ position: 'relative' }}>
              <button
                ref={emailButtonRef}
                onClick={() => setShowUserDetails(!showUserDetails)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#a0aec0',
                  fontSize: '14px',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  maxWidth: '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#a0aec0';
                  e.currentTarget.style.background = 'transparent';
                }}
                title={userEmail}
              >
                <span>{userEmail}</span>
                <i className="fa fa-chevron-down" style={{ fontSize: '10px', marginLeft: '4px' }}></i>
              </button>

              {/* Dropdown con detalles del usuario */}
              {showUserDetails && (
                <div
                  ref={userDetailsRef}
                  style={{
                    position: 'fixed',
                    top: `${dropdownPosition.top}px`,
                    right: `${dropdownPosition.right}px`,
                    background: 'rgba(21, 26, 46, 0.98)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '16px',
                    minWidth: '320px',
                    zIndex: 10010,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <h6 style={{
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    {t('user_info.user_details', 'Detalles del Usuario')}
                  </h6>

                  {/* Balance USDC */}
                  <div style={{
                    background: 'rgba(0, 192, 135, 0.1)',
                    border: '1px solid rgba(0, 192, 135, 0.2)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <span style={{ color: '#a0aec0', fontSize: '12px', fontWeight: '500' }}>
                        {t('user_info.balance_usdc', 'Balance USDC')}:
                      </span>
                      <span style={{ 
                        color: '#00c087', 
                        fontSize: '16px', 
                        fontWeight: '600'
                      }}>
                        {balanceLoading ? (
                          <span style={{ color: '#718096', fontSize: '14px' }}>...</span>
                        ) : (
                          formatCurrency(usdcBalance)
                        )}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#718096',
                      marginTop: '4px'
                    }}>
                      {t('user_info.on_bnb', 'en BNB')}
                    </div>
                  </div>

                  {/* Email */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    marginBottom: '8px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa fa-envelope" style={{ color: '#a0aec0', fontSize: '12px' }}></i>
                      <span style={{ color: '#a0aec0', fontSize: '13px' }}>
                        {t('user_info.email', 'Email')}:
                      </span>
                    </div>
                    <span style={{ 
                      color: '#ffffff', 
                      fontSize: '13px', 
                      fontWeight: '500',
                      maxWidth: '180px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }} title={userEmail}>
                      {userEmail}
                    </span>
                  </div>

                  {/* Wallet Address */}
                  {address && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      marginBottom: '8px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa fa-wallet" style={{ color: '#a0aec0', fontSize: '12px' }}></i>
                        <span style={{ color: '#a0aec0', fontSize: '13px' }}>
                          {t('user_info.wallet', 'Wallet')}:
                        </span>
                      </div>
                      <span style={{ 
                        color: '#00c087', 
                        fontSize: '13px', 
                        fontWeight: '500',
                        fontFamily: 'monospace'
                      }} title={address}>
                        {formatAddress(address)}
                      </span>
                    </div>
                  )}

                  {/* NFT ID / Username */}
                  {selectedNFT && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      marginBottom: '8px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa fa-image" style={{ color: '#a0aec0', fontSize: '12px' }}></i>
                        <span style={{ color: '#a0aec0', fontSize: '13px' }}>
                          {t('user_info.nft_id', 'NFT ID')}:
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ 
                          color: '#00c087', 
                          fontSize: '13px', 
                          fontWeight: '500',
                          fontFamily: 'monospace'
                        }}>
                          #{selectedNFT.tokenId}
                        </span>
                        {selectedNFT.name && (
                          <span style={{
                            fontSize: '11px',
                            color: '#718096'
                          }}>
                            ({selectedNFT.name})
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Estado de verificación */}
                  {isVerified && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 0',
                      marginTop: '8px',
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <i className="fa fa-check-circle" style={{ color: '#00c087', fontSize: '14px' }}></i>
                      <span style={{ color: '#00c087', fontSize: '12px', fontWeight: '500' }}>
                        {t('user_info.verified', 'Cuenta Verificada')}
                      </span>
                    </div>
                  )}

                  {/* Separador para opciones de navegación */}
                  <div style={{
                    marginTop: '16px',
                    marginBottom: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                  }} />

                  {/* Opciones de navegación */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    {/* Fund8 Website */}
                    <a
                      href="https://fund8.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowUserDetails(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textDecoration: 'none',
                        width: '100%'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      <i className="fa fa-globe" style={{ color: '#a0aec0', fontSize: '14px', width: '20px' }}></i>
                      <span>{t('account_switch.fund8_website', 'Fund8 Website')}</span>
                    </a>

                    {/* Affiliate Partner (DeFily) */}
                    <a
                      href="https://app.defily.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowUserDetails(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textDecoration: 'none',
                        width: '100%'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      <i className="fa fa-handshake" style={{ color: '#a0aec0', fontSize: '14px', width: '20px' }}></i>
                      <span>{t('account_switch.affiliate_partner', 'Affiliate Partner')}</span>
                    </a>

                    {/* Prop Dashboard */}
                    <a
                      href="https://dashboard.fund8.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowUserDetails(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textDecoration: 'none',
                        width: '100%'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      <i className="fa fa-tachometer-alt" style={{ color: '#a0aec0', fontSize: '14px', width: '20px' }}></i>
                      <span>{t('account_switch.prop_dashboard', 'Prop Dashboard')}</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Botón de logout */}
          {showLogout && (
            <button
              className="auth-btn auth-btn-logout"
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              <i className="bi bi-box-arrow-right"></i>
              <span>{t('trading_portal.logout', 'Logout')}</span>
            </button>
          )}
        </div>
      )}

      {/* Register - solo si no tiene cuenta */}
      {showRegister && !showLogout && (
        <button
          className="register-btn"
          onClick={() => {
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

      {/* Login - solo si tiene cuenta pero NO está logueado */}
      {showLogin && !showLogout && (
        <button
          className="auth-btn auth-btn-login"
          onClick={() => {
            setShowLoginModal(true);
          }}
        >
          <i className="bi bi-box-arrow-in-right"></i>
          <span>{t('trading_portal.login', 'Login')}</span>
        </button>
      )}
      
      {/* Modales - Renderizar siempre para que estén en el DOM */}
      <TradingPortalRegistrationModalWrapper 
        show={showRegisterModal} 
        onClose={() => {
          setShowRegisterModal(false);
        }} 
      />
      
      <TradingPortalLoginModalWrapper 
        show={showLoginModal} 
        onClose={() => {
          setShowLoginModal(false);
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
  const { auth } = useSelector(state => state.auth);
  
  // Verificar si el usuario está logueado
  const isLoggedIn = !!auth?.idToken || !!localStorage.getItem('jwt_token');
  

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
    { id: 'back_to_defily', label: t('topbar.back_to_defily', 'Back to DeFily'), path: 'https://app.defily.ai', isExternal: true },
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
          <ConnectWalletButton />
          
          <LanguageSelector variant="icon" />
          
          {/* Botón de Soporte */}
          <SupportButton />
          
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
          {items.map((subItem) => {
            // Si es un link externo, usar <a> en lugar de <Link>
            if (subItem.isExternal) {
              return (
                <a
                  key={subItem.id}
                  href={subItem.path}
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
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = subItem.path;
                  }}
                >
                  {subItem.label}
                </a>
              );
            }
            
            // Links internos usan <Link>
            return (
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
            );
          })}
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

