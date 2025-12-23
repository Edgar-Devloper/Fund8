import { jwtApiService } from './jwtApiService';

/**
 * TradingPortalService
 * Servicio para manejar la creación y verificación de cuentas de Trading Portal
 * 
 * Endpoints esperados:
 * - POST /api/trading-portal/create - Crear cuenta de Trading Portal
 * - GET /api/trading-portal/status - Obtener estado de la cuenta
 * - POST /api/trading-portal/verify-otp - Verificar OTP
 */

/**
 * Crea una cuenta de Trading Portal
 * @param {string} fullName - Nombre completo del usuario
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @param {string} walletAddress - Dirección de la wallet conectada
 * @returns {Promise} Respuesta del servidor
 */
export async function createTradingPortalAccount(fullName, email, password, walletAddress) {
  try {
    // TODO: Reemplazar con el endpoint real cuando esté disponible
    const endpoint = '/api/trading-portal/create';
    
    const payload = {
      fullName,
      email,
      password,
      walletAddress,
    };

    const response = await jwtApiService.post(endpoint, payload);
    
    // El backend debería enviar un email con OTP automáticamente
    return {
      success: true,
      data: response.data,
      message: 'Trading Portal account created. Please check your email for OTP verification.',
    };
  } catch (error) {
    console.error('[TradingPortalService] Error creating account:', error);
    throw {
      success: false,
      message: error.response?.data?.message || error.message || 'Error al crear cuenta de Trading Portal',
      error: error.response?.data || error,
    };
  }
}

/**
 * Verifica el OTP enviado por email
 * @param {string} email - Email del usuario
 * @param {string} otp - Código OTP
 * @returns {Promise} Respuesta del servidor
 */
export async function verifyOTP(email, otp) {
  try {
    // TODO: Reemplazar con el endpoint real cuando esté disponible
    const endpoint = '/api/trading-portal/verify-otp';
    
    const payload = {
      email,
      otp,
    };

    const response = await jwtApiService.post(endpoint, payload);
    
    return {
      success: true,
      data: response.data,
      message: 'OTP verified successfully',
    };
  } catch (error) {
    console.error('[TradingPortalService] Error verifying OTP:', error);
    throw {
      success: false,
      message: error.response?.data?.message || error.message || 'Error al verificar OTP',
      error: error.response?.data || error,
    };
  }
}

/**
 * Obtiene el estado de la cuenta de Trading Portal
 * @param {string} walletAddress - Dirección de la wallet
 * @returns {Promise} Estado de la cuenta
 */
export async function getTradingPortalStatus(walletAddress) {
  try {
    // TODO: Reemplazar con el endpoint real cuando esté disponible
    const endpoint = `/api/trading-portal/status?walletAddress=${walletAddress}`;
    
    const response = await jwtApiService.get(endpoint);
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('[TradingPortalService] Error getting status:', error);
    // Si no existe la cuenta, retornar null en lugar de error
    if (error.response?.status === 404) {
      return {
        success: false,
        data: null,
        message: 'No Trading Portal account found',
      };
    }
    throw {
      success: false,
      message: error.response?.data?.message || error.message || 'Error al obtener estado',
      error: error.response?.data || error,
    };
  }
}

/**
 * Reenvía el OTP por email
 * @param {string} email - Email del usuario
 * @returns {Promise} Respuesta del servidor
 */
export async function resendOTP(email) {
  try {
    // TODO: Reemplazar con el endpoint real cuando esté disponible
    const endpoint = '/api/trading-portal/resend-otp';
    
    const payload = {
      email,
    };

    const response = await jwtApiService.post(endpoint, payload);
    
    return {
      success: true,
      data: response.data,
      message: 'OTP resent successfully. Please check your email.',
    };
  } catch (error) {
    console.error('[TradingPortalService] Error resending OTP:', error);
    throw {
      success: false,
      message: error.response?.data?.message || error.message || 'Error al reenviar OTP',
      error: error.response?.data || error,
    };
  }
}

export default {
  createTradingPortalAccount,
  verifyOTP,
  getTradingPortalStatus,
  resendOTP,
};









