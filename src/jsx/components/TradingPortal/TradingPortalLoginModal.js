import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useWallet } from '../../../context/WalletContext';
import { loadingToggleAction, tradingPortalLoadedAction } from '../../../store/actions/AuthActions';
import { login } from '../../../services/AuthService'; // Usar servicio de autenticación existente
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
  const { address } = useWallet();
  const { tradingPortal } = useSelector(state => state.auth);
  
  const [email, setEmail] = useState(tradingPortal?.email || '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
      swal('Error', t('trading_portal.errors.wallet_required', 'Please connect your wallet first'), 'error');
      return;
    }

    setLoading(true);
    dispatch(loadingToggleAction(true));

    try {
      // Login usando el servicio de autenticación existente
      // Este login es para el Trading Portal backend
      const response = await login(email, password);
      
      if (response.data) {
        // Actualizar estado de Trading Portal
        dispatch(tradingPortalLoadedAction({
          fullName: tradingPortal?.fullName || '',
          email: email,
          isVerified: true,
        }));
        
        swal(
          'Success', 
          t('trading_portal.login_success', 'Login successful! You now have full access to the Trading Portal.'),
          'success'
        );
        
        onClose();
      }
    } catch (error) {
      console.error('[TradingPortalLoginModal] Login error:', error);
      swal(
        'Error', 
        error.response?.data?.error?.message || t('trading_portal.errors.login_failed', 'Invalid email or password'),
        'error'
      );
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
                <input
                  type="password"
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
                    padding: '12px 16px',
                    fontSize: '14px'
                  }}
                  placeholder={t('trading_portal.password_placeholder', 'Enter your password')}
                />
                {errors.password && (
                  <small style={{ color: '#ff5c5c', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {errors.password}
                  </small>
                )}
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
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TradingPortalLoginModal;

