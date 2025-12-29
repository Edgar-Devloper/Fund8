import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useWallet } from '../../../context/WalletContext';
import { loadingToggleAction, tradingPortalLoadedAction } from '../../../store/actions/AuthActions';
import { login, loginNonce, loginVerify } from '../../../services/authApiService';
import { setToken } from '../../../services/jwtAuthService';
import swal from 'sweetalert';
import './TradingPortalModal.css';

/**
 * TradingPortalLoginModal
 * Modal para hacer login en el Trading Portal
 * Usa las credenciales (email/password) creadas durante el registro
 * 
 * Propósito: Autenticarse en el backend del Trading Portal para acceder a:
 * - Comisiones (CV/RV)
 * - Referral links
 * - Estadísticas del portal
 * - Dashboard completo
 * 
 * La wallet Web3 es para transacciones blockchain, el login es para el portal backend
 */
const TradingPortalLoginModal = ({ onClose, show }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { address, signer } = useWallet();
  const { tradingPortal } = useSelector(state => state.auth);
  
  const [email, setEmail] = useState(tradingPortal?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSignatureStep, setShowSignatureStep] = useState(false);
  const [loginSessionId, setLoginSessionId] = useState(null);
  const [messageToSign, setMessageToSign] = useState(null);

  // Función helper para asegurar que swal tenga z-index alto
  const showSwalWithHighZIndex = (swalConfig) => {
    swal(swalConfig);
    // Asegurar que el swal tenga z-index alto para aparecer por encima del modal
    setTimeout(() => {
      const swalContainer = document.querySelector('.swal2-container') || document.querySelector('.swal-overlay');
      if (swalContainer) {
        swalContainer.style.zIndex = '10000000';
      }
      // También buscar el swal-modal
      const swalModal = document.querySelector('.swal-modal') || document.querySelector('.swal2-popup');
      if (swalModal) {
        swalModal.style.zIndex = '10000001';
      }
    }, 100);
  };

  // Cargar email guardado si existe
  useEffect(() => {
    if (show) {
      const rememberedEmail = localStorage.getItem('trading_portal_remembered_email');
      if (rememberedEmail && !email) {
        setEmail(rememberedEmail);
        setRememberMe(true);
      }
    } else {
      // Resetear estado cuando se cierra el modal
      setShowSignatureStep(false);
      setLoginSessionId(null);
      setMessageToSign(null);
      setPassword('');
      setErrors({});
    }
  }, [show]);

  if (!show) return null;

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = t('trading_portal.errors.email_required', 'Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('trading_portal.errors.email_invalid', 'Invalid email format');
    }

    if (!password) {
      newErrors.password = t('trading_portal.errors.password_required', 'Password is required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!address) {
      showSwalWithHighZIndex({
        title: 'Error',
        text: t('trading_portal.errors.wallet_required', 'Please connect your wallet first'),
        icon: 'error',
        button: 'OK'
      });
      return;
    }

    if (!signer) {
      showSwalWithHighZIndex({
        title: 'Error',
        text: t('trading_portal.errors.signer_required', 'Wallet signer not available. Please reconnect your wallet.'),
        icon: 'error',
        button: 'OK'
      });
      return;
    }

    // Si ya estamos en el paso de firma, proceder con la firma
    if (showSignatureStep && loginSessionId && messageToSign) {
      await handleSignature();
      return;
    }

    setLoading(true);
    dispatch(loadingToggleAction(true));

    try {
      // Paso 1: Validar email y password
      const loginResult = await login(email, password);
      
      if (!loginResult.success) {
        throw new Error(loginResult.message || 'Error al validar credenciales');
      }

      // Paso 2: Obtener mensaje para firmar usando el loginSessionId del paso 1
      // Extraer loginSessionId de la respuesta
      const sessionId = loginResult.data?.loginSessionId || loginResult.data?.data?.loginSessionId;
      
      if (!sessionId) {
        throw new Error('No se recibió loginSessionId del servidor. Por favor intenta de nuevo.');
      }
      
      const nonceResult = await loginNonce(sessionId);
      
      if (!nonceResult.success || !nonceResult.data?.message) {
        throw new Error(nonceResult.message || 'Error al obtener mensaje para firmar');
      }

      const msgToSign = nonceResult.data.message;

      // Guardar datos para el paso de firma
      setLoginSessionId(sessionId);
      setMessageToSign(msgToSign);
      setShowSignatureStep(true);
      setLoading(false);
      dispatch(loadingToggleAction(false));
    } catch (error) {
      console.error('[TradingPortalLoginModal] Login error:', error);
      
      // Extraer mensaje de error
      let errorMessage = t('trading_portal.errors.login_failed', 'Invalid email or password');
      
      if (error && typeof error === 'object') {
        if (error.message) {
          if (Array.isArray(error.message)) {
            errorMessage = error.message.join('. ');
          } else if (typeof error.message === 'string') {
            errorMessage = error.message;
          }
        } else if (error.response?.data?.message) {
          const msg = error.response.data.message;
          errorMessage = Array.isArray(msg) ? msg.join('. ') : msg;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Si el error es de wallet mismatch, mostrar mensaje más claro
      if (errorMessage?.toLowerCase().includes('wallet') || 
          errorMessage?.toLowerCase().includes('registered')) {
        showSwalWithHighZIndex({
          title: 'Error - Wallet Incorrecta',
          text: `${errorMessage}\n\nWallet actual conectada: ${address}\n\nPor favor conecta la wallet que usaste cuando creaste tu cuenta.`,
          icon: 'error',
          button: 'OK'
        });
      } else {
        showSwalWithHighZIndex({
          title: 'Error',
          text: errorMessage,
          icon: 'error',
          button: 'OK'
        });
      }
      setLoading(false);
      dispatch(loadingToggleAction(false));
    }
  };

  const handleSignature = async () => {
    if (!signer || !messageToSign || !loginSessionId) {
      return;
    }

    setLoading(true);
    dispatch(loadingToggleAction(true));

    try {
      // Paso 3: Firmar el mensaje con la wallet
      const signature = await signer.signMessage(messageToSign);

      // Paso 4: Verificar firma y obtener JWT usando el loginSessionId
      const verifyResult = await loginVerify(loginSessionId, signature);
      
      if (!verifyResult.success || !verifyResult.token) {
        throw new Error(verifyResult.message || 'Error al verificar firma');
      }

      // Guardar el token JWT
      const jwtToken = verifyResult.token;
      setToken(jwtToken);
      localStorage.setItem('jwt_token', jwtToken);
      localStorage.setItem('jwt_wallet_address', address);

      // Actualizar estado de Trading Portal
      const portalData = {
        hasPortalAccount: true, // IMPORTANTE: Agregar esto para que Redux sepa que tiene cuenta
        fullName: tradingPortal?.fullName || '',
        email: email,
        isVerified: true,
      };
      
      dispatch(tradingPortalLoadedAction(portalData));
      
      // Guardar en localStorage para persistencia
      if (address) {
        localStorage.setItem(`trading_portal_${address.toLowerCase()}`, JSON.stringify(portalData));
      }

      // Guardar email si "Remember me" está activado
      if (rememberMe) {
        localStorage.setItem('trading_portal_remembered_email', email);
      } else {
        localStorage.removeItem('trading_portal_remembered_email');
      }

      // Actualizar estado de auth con el token
      dispatch({
        type: 'LOGIN_CONFIRMED_ACTION',
        payload: {
          idToken: jwtToken,
          email: email,
        }
      });
      
      // Cerrar el modal primero
      onClose();
      
      // Mostrar mensaje de éxito después de cerrar el modal con z-index alto y cerrar automáticamente
      setTimeout(() => {
        showSwalWithHighZIndex({
          title: 'Success',
          text: t('trading_portal.login_success', 'Login successful! You now have full access to the Trading Portal.'),
          icon: 'success',
          button: false, // No mostrar botón
          timer: 3000, // Cerrar automáticamente después de 3 segundos
          timerProgressBar: true // Mostrar barra de progreso
        });
      }, 300); // Pequeño delay para que el modal se cierre primero
    } catch (error) {
      console.error('[TradingPortalLoginModal] Login error:', error);
      
      // Extraer mensaje de error
      let errorMessage = t('trading_portal.errors.login_failed', 'Invalid email or password');
      
      if (error && typeof error === 'object') {
        if (error.message) {
          if (Array.isArray(error.message)) {
            errorMessage = error.message.join('. ');
          } else if (typeof error.message === 'string') {
            errorMessage = error.message;
          }
        } else if (error.response?.data?.message) {
          const msg = error.response.data.message;
          errorMessage = Array.isArray(msg) ? msg.join('. ') : msg;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Si el error es de wallet mismatch, mostrar mensaje más claro
      if (errorMessage?.toLowerCase().includes('wallet') || 
          errorMessage?.toLowerCase().includes('registered')) {
        showSwalWithHighZIndex({
          title: 'Error - Wallet Incorrecta',
          text: `${errorMessage}\n\nWallet actual conectada: ${address}\n\nPor favor conecta la wallet que usaste cuando creaste tu cuenta.`,
          icon: 'error',
          button: 'OK'
        });
      } else {
        showSwalWithHighZIndex({
          title: 'Error',
          text: errorMessage,
          icon: 'error',
          button: 'OK'
        });
      }
    } finally {
      setLoading(false);
      dispatch(loadingToggleAction(false));
    }
  };

  // Renderizar el modal usando portal directamente en el body para evitar problemas de z-index
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
          zIndex: 1000000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100%',
          margin: '0 auto',
          padding: '20px'
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
            maxWidth: '500px',
            margin: '0 auto'
          }} 
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="modal-header" style={{ 
            background: '#151a2e',
            color: '#ffffff',
            borderBottom: '1px solid #1e2541',
            padding: '20px 24px',
            borderRadius: '12px 12px 0 0'
          }}>
            <h5 className="modal-title mb-0" style={{ color: '#ffffff', fontWeight: '600', fontSize: '18px' }}>
              {t('trading_portal.login_title', 'Login to Trading Portal')}
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[TradingPortalLoginModal] Close button clicked');
                if (onClose) {
                  onClose();
                }
              }}
              aria-label="Close"
              style={{ 
                opacity: 1, 
                filter: 'brightness(0) invert(1)',
                cursor: 'pointer',
                zIndex: 1000002,
                position: 'relative',
                width: '32px',
                height: '32px',
                fontSize: '24px',
                lineHeight: '1',
                background: 'transparent',
                border: 'none',
                padding: 0,
                color: '#ffffff'
              }}
            >
              ×
            </button>
          </div>
          
          <div className="modal-body" style={{ 
            padding: '24px', 
            background: '#151a2e',
            color: '#ffffff'
          }}>
            {!showSignatureStep ? (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#a0aec0', 
                    lineHeight: '1.6',
                    marginBottom: '20px'
                  }}>
                    {t('trading_portal.login_description', 
                      'Enter your Trading Portal credentials to access your account, referral links, commissions, and full dashboard features.'
                    )}
                  </p>
                </div>

                <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#ffffff', 
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {t('trading_portal.email', 'Email')} *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  className="form-control"
                  style={{
                    background: '#0a0e27',
                    border: errors.email ? '1px solid #ff5c5c' : '1px solid #1e2541',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '12px 16px',
                    fontSize: '14px'
                  }}
                  placeholder={t('trading_portal.email_placeholder', 'Enter your email')}
                />
                {errors.email && (
                  <small style={{ color: '#ff5c5c', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {errors.email}
                  </small>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  color: '#ffffff', 
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {t('trading_portal.password', 'Password')} *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    className="form-control"
                    style={{
                      background: '#0a0e27',
                      border: errors.password ? '1px solid #ff5c5c' : '1px solid #1e2541',
                      borderRadius: '8px',
                      color: '#ffffff',
                      padding: '12px 40px 12px 16px',
                      fontSize: '14px',
                      width: '100%'
                    }}
                    placeholder={t('trading_portal.password_placeholder', 'Enter your password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#a0aec0',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#a0aec0'}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.password && (
                  <small style={{ color: '#ff5c5c', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {errors.password}
                  </small>
                )}
              </div>

              {/* Remember Me checkbox */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  color: '#a0aec0',
                  fontSize: '14px'
                }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{
                      marginRight: '8px',
                      cursor: 'pointer',
                      width: '16px',
                      height: '16px'
                    }}
                  />
                  <span>{t('trading_portal.remember_me', 'Remember me')}</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  background: loading ? '#1f2640' : '#00c087',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {loading 
                  ? t('trading_portal.logging_in', 'Logging in...') 
                  : t('trading_portal.login', 'Login')
                }
              </button>
            </form>
              </>
            ) : (
              <div>
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(0, 192, 135, 0.1)',
                    border: '2px solid #00c087',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px auto'
                  }}>
                    <i className="fa fa-check-circle" style={{ fontSize: '32px', color: '#00c087' }}></i>
                  </div>
                  <h6 style={{ 
                    color: '#ffffff', 
                    fontSize: '18px', 
                    fontWeight: '600',
                    marginBottom: '12px'
                  }}>
                    {t('trading_portal.credentials_validated', 'Credentials Validated')}
                  </h6>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#a0aec0', 
                    lineHeight: '1.6',
                    marginBottom: '8px'
                  }}>
                    {t('trading_portal.signature_required', 
                      'Please sign the message with your wallet to complete the login process.'
                    )}
                  </p>
                  <p style={{ 
                    fontSize: '12px', 
                    color: '#718096', 
                    marginTop: '16px'
                  }}>
                    {t('trading_portal.wallet_address', 'Wallet')}: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSignatureStep(false);
                      setLoginSessionId(null);
                      setMessageToSign(null);
                    }}
                    disabled={loading}
                    style={{
                      flex: 1,
                      borderRadius: '8px',
                      padding: '12px 20px',
                      background: 'transparent',
                      border: '1px solid #1e2541',
                      color: '#a0aec0',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.borderColor = '#718096';
                        e.currentTarget.style.color = '#ffffff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.currentTarget.style.borderColor = '#1e2541';
                        e.currentTarget.style.color = '#a0aec0';
                      }
                    }}
                  >
                    {t('trading_portal.cancel', 'Cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSignature}
                    disabled={loading}
                    style={{
                      flex: 1,
                      borderRadius: '8px',
                      padding: '12px 20px',
                      background: loading ? '#1f2640' : '#00c087',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {loading 
                      ? t('trading_portal.signing', 'Signing...') 
                      : t('trading_portal.sign_message', 'Sign Message')
                    }
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TradingPortalLoginModal;

