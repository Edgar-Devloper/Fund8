import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../../../context/WalletContext';
import { useSelector } from 'react-redux';
import TradingPortalRegistrationModal from './TradingPortalRegistrationModal';
import TradingPortalLoginModal from './TradingPortalLoginModal';

/**
 * WelcomeMessageModal
 * Modal que se muestra cuando el usuario hace login
 * Muestra mensaje para conectar wallet o crear wallet descentralizada
 * Basado en el diseño de la imagen proporcionada
 */
const WelcomeMessageModal = ({ onClose, show }) => {
  const { t } = useTranslation();
  const { address, isConnected } = useWallet();
  const { tradingPortal, auth } = useSelector(state => state.auth);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Cerrar automáticamente si el usuario se loguea
  useEffect(() => {
    const isLoggedIn = !!auth?.idToken || !!localStorage.getItem('jwt_token');
    if (isLoggedIn && show) {
      console.log('[WelcomeMessageModal] Usuario logueado detectado, cerrando modal');
      onClose();
    }
  }, [auth?.idToken, show, onClose]);

  // Determinar qué mostrar
  // Verificar si tiene cuenta desde localStorage como respaldo
  const [hasAccount, setHasAccount] = useState(false);
  
  useEffect(() => {
    if (address) {
      try {
        const savedData = localStorage.getItem(`trading_portal_${address.toLowerCase()}`);
        if (savedData) {
          const portalData = JSON.parse(savedData);
          setHasAccount(portalData.hasPortalAccount || false);
        } else {
          setHasAccount(false);
        }
      } catch (error) {
        setHasAccount(false);
      }
    } else {
      setHasAccount(false);
    }
  }, [address, show]);

  const hasPortalAccount = tradingPortal?.hasPortalAccount || hasAccount;
  
  const showConnectWallet = !isConnected || !address;
  const showRegister = isConnected && address && !hasPortalAccount; // Mostrar Register solo si NO tiene cuenta
  const showLogin = isConnected && address && hasPortalAccount; // Mostrar Login solo si YA tiene cuenta


  if (!show) return null;

  // Formatear dirección de wallet
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return createPortal(
    <div 
      className="modal fade show trading-portal-modal-overlay" 
      style={{ 
        display: 'block', 
        backgroundColor: 'rgba(10, 14, 39, 0.85)', 
        zIndex: 999999, 
        pointerEvents: 'auto',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0 
      }}
      tabIndex="-1"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="modal-dialog modal-dialog-centered" 
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={{ 
          pointerEvents: 'auto', 
          position: 'relative', 
          zIndex: 1000000
        }}
      >
        <div 
          className="modal-content" 
          style={{
            background: '#151a2e',
            border: '1px solid #1e2541',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 1000001,
            maxWidth: '600px',
            width: '90%',
            margin: '0 auto'
          }} 
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {/* Botón de cerrar */}
          <button 
            type="button" 
            className="btn-close btn-close-white" 
            onClick={onClose}
            aria-label="Close"
            style={{ 
              position: 'absolute',
              top: '20px',
              right: '20px',
              opacity: 0.8, 
              filter: 'brightness(0) invert(1)',
              zIndex: 10,
              width: '32px',
              height: '32px',
              fontSize: '24px',
              lineHeight: '1',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
          
          <div className="modal-body" style={{ 
            padding: '48px 40px', 
            background: 'linear-gradient(135deg, #1a1f3a 0%, #151a2e 100%)',
            color: '#ffffff',
            textAlign: 'center',
            borderRadius: '12px'
          }}>
            {/* Título */}
            <h3 style={{ 
              color: '#ffffff', 
              fontWeight: '600', 
              fontSize: '24px',
              marginBottom: '16px'
            }}>
              {t('trading_portal.start_trading_title', 'Start trading on Fund8')}
            </h3>

            {/* Mensaje principal */}
            <p style={{ 
              fontSize: '15px', 
              color: '#a0aec0', 
              lineHeight: '1.6',
              marginBottom: '24px',
              maxWidth: '500px',
              margin: '0 auto 24px auto'
            }}>
              {t('trading_portal.welcome_message', 
                'Start trading on Fund8 by connecting your Web3 wallet and logging in. Alternatively, you can create a decentralised wallet using your email.'
              )}
            </p>

            {/* Contenido dinámico según el estado */}
            {showConnectWallet && (
              <div style={{ 
                marginTop: '20px',
                marginBottom: '20px'
              }}>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#718096',
                  marginBottom: '16px'
                }}>
                  {t('trading_portal.connect_wallet_first', 'Connect your Web3 wallet to continue')}
                </p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  marginTop: '20px',
                  position: 'relative',
                  zIndex: 1
                }}
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Cerrar este modal para que el modal de Thirdweb pueda aparecer
                      onClose();
                      // Usar un delay para asegurar que el modal se cierre completamente
                      setTimeout(() => {
                        // Buscar el botón de Connect Wallet en el navbar
                        // Intentar múltiples selectores para encontrar el botón de Thirdweb
                        const selectors = [
                          '.wallet-connect-container-hyperliquid button',
                          '.wallet-connect-container-hyperliquid [data-button]',
                          '.wallet-connect-container-hyperliquid [role="button"]',
                          'nav .wallet-connect-container-hyperliquid button',
                          'header .wallet-connect-container-hyperliquid button',
                          '[data-button]',
                          '[role="button"]'
                        ];
                        
                        let connectButton = null;
                        for (const selector of selectors) {
                          const buttons = document.querySelectorAll(selector);
                          for (const btn of buttons) {
                            // Verificar que el botón sea visible
                            if (btn.offsetParent !== null) {
                              // Verificar que esté en el navbar/header
                              const isInNav = btn.closest('nav') || btn.closest('.navbar') || btn.closest('header');
                              if (isInNav || selector.includes('wallet-connect')) {
                                connectButton = btn;
                                break;
                              }
                            }
                          }
                          if (connectButton) break;
                        }
                        
                        if (connectButton) {
                          // Hacer clic en el botón
                          connectButton.click();
                        } else {
                          console.warn('[WelcomeMessageModal] No se encontró el botón de Connect Wallet. El usuario puede usar el botón del navbar.');
                        }
                      }, 200);
                    }}
                    style={{
                      padding: '12px 24px',
                      background: '#9333ea',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      width: '100%',
                      maxWidth: '300px',
                      margin: '0 auto',
                      display: 'block'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#7c3aed';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#9333ea';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {t('trading_portal.connect_wallet', 'Connect Wallet')}
                  </button>
                </div>
              </div>
            )}

            {showRegister && (
              <div style={{ 
                marginTop: '20px',
                marginBottom: '20px'
              }}>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#718096',
                  marginBottom: '8px'
                }}>
                  {t('trading_portal.wallet_connected', 'Wallet connected')}: {formatAddress(address)}
                </p>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#a0aec0',
                  marginBottom: '20px'
                }}>
                  {t('trading_portal.create_account_message', 'Create your Trading Portal account to start trading.')}
                </p>
                <button
                  onClick={() => {
                    setShowRegisterModal(true);
                  }}
                  style={{
                    padding: '12px 24px',
                    background: '#00c087',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    width: '100%',
                    maxWidth: '300px',
                    margin: '0 auto',
                    display: 'block'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#00a875';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#00c087';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {t('trading_portal.register', 'Register')}
                </button>
              </div>
            )}

            {showLogin && (
              <div style={{ 
                marginTop: '20px',
                marginBottom: '20px'
              }}>
                <p style={{ 
                  fontSize: '14px', 
                  color: '#718096',
                  marginBottom: '8px'
                }}>
                  {t('trading_portal.wallet_connected', 'Wallet connected')}: {formatAddress(address)}
                </p>
                <p style={{ 
                  fontSize: '15px', 
                  color: '#a0aec0',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  You already have an account.{' '}
                  <span
                    onClick={() => {
                      setShowLoginModal(true);
                    }}
                    style={{
                      color: '#00c087',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#00a875';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#00c087';
                    }}
                  >
                    Login here
                  </span>
                </p>
                <button
                  onClick={() => {
                    setShowRegisterModal(true);
                  }}
                  style={{
                    padding: '12px 24px',
                    background: '#00c087',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    width: '100%',
                    maxWidth: '300px',
                    margin: '0 auto',
                    display: 'block'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#00a875';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#00c087';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {t('trading_portal.register', 'Register')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modales de Register y Login */}
      {showRegisterModal && (
        <TradingPortalRegistrationModal
          show={showRegisterModal}
          onClose={() => {
            setShowRegisterModal(false);
            // Si se completó el registro, el modal principal puede cerrarse o actualizarse
            // El estado se actualizará automáticamente desde Redux
          }}
        />
      )}

      {showLoginModal && (
        <TradingPortalLoginModal
          show={showLoginModal}
          onClose={() => {
            setShowLoginModal(false);
            // Si se completó el login, el modal principal puede cerrarse
            // El estado se actualizará automáticamente desde Redux
          }}
        />
      )}
    </div>,
    document.body
  );
};

export default WelcomeMessageModal;

