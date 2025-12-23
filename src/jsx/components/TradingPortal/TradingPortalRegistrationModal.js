import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../../../context/WalletContext';
import { useDispatch, useSelector } from 'react-redux';
import { tradingPortalCreatedAction, tradingPortalVerifiedAction, loadingToggleAction } from '../../../store/actions/AuthActions';
// OTP deshabilitado temporalmente
// import { verifyOTP, resendOTP } from '../../../services/TradingPortalService';
import { register } from '../../../services/authApiService';
import swal from 'sweetalert';
import './TradingPortalModal.css';

/**
 * TradingPortalRegistrationModal
 * Modal para crear cuenta de Trading Portal
 * Se muestra cuando el usuario tiene wallet/NFT conectado pero no tiene cuenta de Trading Portal
 */
const TradingPortalRegistrationModal = ({ onClose, show, forceShow = false, onRegistrationSuccess }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { address, isConnected } = useWallet();
  const { tradingPortal } = useSelector(state => state.auth);
  // OTP deshabilitado temporalmente
  // const [step, setStep] = useState('register'); // 'register' o 'verify'
  const [step] = useState('register'); // Solo registro por ahora
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Validation
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [otpResent, setOtpResent] = useState(false);

  // Determinar si el modal debe mostrarse
  const shouldShow = show || forceShow;

  // Función helper para asegurar que swal tenga z-index alto
  const showSwalWithHighZIndex = (swalConfig) => {
    swal(swalConfig);
    // Asegurar que el swal tenga z-index alto para aparecer por encima del modal
    setTimeout(() => {
      const swalContainer = document.querySelector('.swal2-container');
      if (swalContainer) {
        swalContainer.style.zIndex = '10000000';
      }
    }, 100);
  };

  // Cargar email guardado si existe
  useEffect(() => {
    if (shouldShow) {
      const rememberedEmail = localStorage.getItem('trading_portal_remembered_email');
      if (rememberedEmail && !email) {
        setEmail(rememberedEmail);
        setRememberMe(true);
      }
    }
  }, [shouldShow]);

  const validateForm = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = t('trading_portal.errors.full_name_required', 'Full Name is required');
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = t('trading_portal.errors.full_name_min', 'Full Name must be at least 2 characters');
    }

    if (!email.trim()) {
      newErrors.email = t('trading_portal.errors.email_required', 'Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('trading_portal.errors.email_invalid', 'Invalid email format');
    }

    if (!password) {
      newErrors.password = t('trading_portal.errors.password_required', 'Password is required');
    } else if (password.length < 8) {
      newErrors.password = t('trading_portal.errors.password_min', 'Password must be at least 8 characters');
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('trading_portal.errors.password_mismatch', 'Passwords do not match');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
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

    setLoading(true);
    dispatch(loadingToggleAction(true));

    // Log para debug
    console.log('[TradingPortalRegistrationModal] Datos del formulario:', {
      fullName,
      email,
      passwordLength: password?.length,
      password: password ? '*'.repeat(password.length) : 'undefined',
      address
    });

    try {
      const result = await register(fullName, email, password, address);
      
      if (result.success) {
        const portalData = {
          fullName,
          email,
          // OTP deshabilitado temporalmente
          // isVerified: false,
        };
        
        dispatch(tradingPortalCreatedAction(portalData));
        
        // Guardar en localStorage para persistencia
        if (address) {
          localStorage.setItem(`trading_portal_${address.toLowerCase()}`, JSON.stringify({
            hasPortalAccount: true,
            ...portalData,
          }));
        }
        
        // Guardar email si "Remember me" está activado
        if (rememberMe) {
          localStorage.setItem('trading_portal_remembered_email', email);
        } else {
          localStorage.removeItem('trading_portal_remembered_email');
        }
        
        // Cerrar el modal primero
        handleClose();
        
        // Llamar al callback de éxito si existe (para cerrar el modal principal)
        if (onRegistrationSuccess) {
          setTimeout(() => {
            onRegistrationSuccess();
          }, 100);
        }
        
        // Mostrar mensaje de éxito después de cerrar el modal con un pequeño delay y cerrar automáticamente
        setTimeout(() => {
          swal({
            title: 'Success',
            text: t('trading_portal.registration_success_no_otp', 'Trading Portal account created successfully! You can now login.'),
            icon: 'success',
            button: false, // No mostrar botón
            timer: 3000, // Cerrar automáticamente después de 3 segundos
            timerProgressBar: true // Mostrar barra de progreso
          });
          
          // Asegurar que el swal tenga z-index alto
          setTimeout(() => {
            const swalContainer = document.querySelector('.swal2-container');
            if (swalContainer) {
              swalContainer.style.zIndex = '10000000';
            }
          }, 100);
        }, 300); // Pequeño delay para que el modal se cierre completamente
        
        // OTP deshabilitado temporalmente - comentado
        // setStep('verify');
      } else {
        throw new Error(result.message || 'Error creating account');
      }
    } catch (error) {
      console.error('[TradingPortalRegistrationModal] Registration error:', error);
      
      // Extraer el mensaje de error correctamente
      // El servicio authApiService lanza un objeto { success: false, message: ..., error: ..., status: ... }
      let errorMessage = t('trading_portal.errors.registration_failed', 'Failed to create Trading Portal account');
      
      // Manejar error 409 (Conflict) - Usuario ya existe
      if (error?.status === 409 || error?.error?.status === 409) {
        errorMessage = t('trading_portal.errors.account_exists', 
          'An account with this email or wallet already exists. Please try logging in instead.');
      } else if (error && typeof error === 'object') {
        // Si el error viene del servicio authApiService
        if (error.message) {
          // Si el mensaje es un array, convertirlo a string
          if (Array.isArray(error.message)) {
            errorMessage = error.message.join('. ');
          } else if (typeof error.message === 'string') {
            errorMessage = error.message;
          }
        } else if (error.error?.message) {
          errorMessage = Array.isArray(error.error.message) 
            ? error.error.message.join('. ') 
            : error.error.message;
        } else if (error.response?.data?.message) {
          const msg = error.response.data.message;
          errorMessage = Array.isArray(msg) ? msg.join('. ') : msg;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Asegurarse de que errorMessage sea siempre un string
      if (typeof errorMessage !== 'string') {
        errorMessage = String(errorMessage);
      }
      
      showSwalWithHighZIndex({
        title: error?.status === 409 ? t('trading_portal.errors.account_exists_title', 'Account Already Exists') : 'Error',
        text: errorMessage,
        icon: 'error',
        button: 'OK'
      });
    } finally {
      setLoading(false);
      dispatch(loadingToggleAction(false));
    }
  };

  // OTP deshabilitado temporalmente
  /*
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      showSwalWithHighZIndex({
        title: 'Error',
        text: t('trading_portal.errors.otp_required', 'OTP is required'),
        icon: 'error',
        button: 'OK'
      });
      return;
    }

    setLoading(true);
    dispatch(loadingToggleAction(true));

    try {
      const result = await verifyOTP(email, otp);
      
      if (result.success) {
        dispatch(tradingPortalVerifiedAction());
        
        showSwalWithHighZIndex({
          title: 'Success',
          text: t('trading_portal.verification_success', 'OTP verified successfully! Your Trading Portal account is now active.'),
          icon: 'success',
          button: 'OK'
        });
        
        onClose();
      } else {
        throw new Error(result.message || 'Error verifying OTP');
      }
    } catch (error) {
      console.error('[TradingPortalRegistrationModal] OTP verification error:', error);
      showSwalWithHighZIndex({
        title: 'Error',
        text: error.message || t('trading_portal.errors.otp_invalid', 'Invalid OTP. Please try again.'),
        icon: 'error',
        button: 'OK'
      });
    } finally {
      setLoading(false);
      dispatch(loadingToggleAction(false));
    }
  };

  const handleResendOTP = async () => {
    try {
      await resendOTP(email);
      setOtpResent(true);
      showSwalWithHighZIndex({
        title: 'Success',
        text: t('trading_portal.otp_resent', 'OTP resent successfully. Please check your email.'),
        icon: 'success',
        button: 'OK'
      });
      setTimeout(() => setOtpResent(false), 5000);
    } catch (error) {
      showSwalWithHighZIndex({
        title: 'Error',
        text: error.message || t('trading_portal.errors.resend_failed', 'Failed to resend OTP'),
        icon: 'error',
        button: 'OK'
      });
    }
  };
  */

  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // OTP deshabilitado temporalmente
    // setStep('register');
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setErrors({});
    // Llamar a onClose para actualizar el estado en el componente padre
    if (onClose) {
      onClose();
    }
  };

  // No mostrar si no se debe mostrar
  if (!shouldShow) {
    return null;
  }

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
          handleClose();
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
              {t('trading_portal.create_account_title', 'Create Trading Portal Account')}
              {/* OTP deshabilitado temporalmente */}
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[TradingPortalRegistrationModal] Close button clicked');
                handleClose(e);
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
            {/* OTP deshabilitado temporalmente - solo mostrar formulario de registro */}
            {step === 'register' && (
              <form onSubmit={handleRegister}>
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#a0aec0', 
                    lineHeight: '1.6',
                    marginBottom: '20px'
                  }}>
                    {t('trading_portal.registration_description', 
                      'To access the full trading terminal and dashboard, please create your Trading Portal account by providing the following information:'
                    )}
                  </p>
                </div>

                {/* Campo Wallet (read-only) */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    color: '#ffffff', 
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {t('trading_portal.wallet', 'Wallet')}
                  </label>
                  <input
                    type="text"
                    value={address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                    readOnly
                    disabled
                    className="form-control"
                    style={{
                      background: '#1a1f3a',
                      border: '1px solid #2d3561',
                      borderRadius: '8px',
                      color: '#a78bfa',
                      padding: '12px 16px',
                      fontSize: '14px',
                      cursor: 'not-allowed',
                      opacity: 0.8
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    color: '#ffffff', 
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {t('trading_portal.full_name', 'Full Name')} *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors({ ...errors, fullName: '' });
                    }}
                    className="form-control"
                    style={{
                      background: '#0a0e27',
                      border: errors.fullName ? '1px solid #ff5c5c' : '1px solid #1e2541',
                      borderRadius: '8px',
                      color: '#ffffff',
                      padding: '12px 16px',
                      fontSize: '14px'
                    }}
                    placeholder={t('trading_portal.full_name_placeholder', 'Enter your full name')}
                  />
                  {errors.fullName && (
                    <small style={{ color: '#ff5c5c', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {errors.fullName}
                    </small>
                  )}
                </div>

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

                <div style={{ marginBottom: '16px' }}>
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

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    color: '#ffffff', 
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {t('trading_portal.confirm_password', 'Confirm Password')} *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                      }}
                      className="form-control"
                      style={{
                        background: '#0a0e27',
                        border: errors.confirmPassword ? '1px solid #ff5c5c' : '1px solid #1e2541',
                        borderRadius: '8px',
                        color: '#ffffff',
                        padding: '12px 40px 12px 16px',
                        fontSize: '14px',
                        width: '100%'
                      }}
                      placeholder={t('trading_portal.confirm_password_placeholder', 'Confirm your password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <small style={{ color: '#ff5c5c', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {errors.confirmPassword}
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
                    ? t('trading_portal.creating', 'Creating...') 
                    : t('trading_portal.create_account', 'Create Account')
                  }
                </button>
              </form>
            )}
            
            {/* OTP deshabilitado temporalmente - comentado
            {step === 'verify' && (
              <form onSubmit={handleVerifyOTP}>
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#a0aec0', 
                    lineHeight: '1.6',
                    marginBottom: '20px'
                  }}>
                    {t('trading_portal.otp_description', 
                      'We have sent an OTP to your email. Please enter the code to verify your account.'
                    )}
                  </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    color: '#ffffff', 
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {t('trading_portal.otp', 'OTP Code')} *
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="form-control"
                    style={{
                      background: '#0a0e27',
                      border: '1px solid #1e2541',
                      borderRadius: '8px',
                      color: '#ffffff',
                      padding: '12px 16px',
                      fontSize: '18px',
                      letterSpacing: '4px',
                      textAlign: 'center',
                      fontWeight: '600'
                    }}
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>

                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={otpResent}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: otpResent ? '#718096' : '#00c087',
                      fontSize: '13px',
                      textDecoration: 'underline',
                      cursor: otpResent ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {otpResent 
                      ? t('trading_portal.otp_resent_wait', 'OTP sent. Please wait...')
                      : t('trading_portal.resend_otp', 'Resend OTP')
                    }
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || !otp.trim()}
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    background: (loading || !otp.trim()) ? '#1f2640' : '#00c087',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: (loading || !otp.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (loading || !otp.trim()) ? 0.6 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {loading 
                    ? t('trading_portal.verifying', 'Verifying...') 
                    : t('trading_portal.verify', 'Verify OTP')
                  }
                </button>
              </form>
            )}
            */}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TradingPortalRegistrationModal;

