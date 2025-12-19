/**
 * authApiService
 * Servicio para manejar los endpoints de autenticación del backend
 * 
 * Endpoints implementados:
 * - POST /api/auth/register - Registro de usuario con email, password y wallet
 * - POST /api/auth/login - Primer paso de login: validar email y password
 * - POST /api/auth/login/nonce - Solicitar mensaje de login para firmar con la wallet
 * - POST /api/auth/login/verify - Verificar firma del mensaje y devolver JWT
 * - POST /api/auth/verify-wallet - Verificar que la wallet conectada coincide con la asociada al usuario logueado
 */

import { jwtApiService } from './jwtApiService';

/**
 * Registra un nuevo usuario con email, password y wallet
 * @param {string} name - Nombre completo del usuario
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @param {string} walletAddress - Dirección de la wallet conectada
 * @returns {Promise} Respuesta del servidor
 */
export async function register(name, email, password, walletAddress) {
  try {
    const endpoint = '/auth/register';
    
    const payload = {
      name,
      email,
      password,
      walletAddress,
    };

    console.log('[AuthApiService] Registrando usuario:', { 
      email, 
      walletAddress,
      nameLength: name?.length,
      emailLength: email?.length,
      passwordLength: password?.length
    });
    console.log('[AuthApiService] Payload completo:', payload);
    
    const response = await jwtApiService.post(endpoint, payload);
    
    console.log('[AuthApiService] Registro exitoso:', response);
    
    return {
      success: true,
      data: response,
      message: 'Usuario registrado exitosamente. Por favor verifica tu email con el código OTP.',
    };
  } catch (error) {
    console.error('[AuthApiService] Error en registro:', error);
    console.error('[AuthApiService] Error response data:', error.response?.data);
    console.error('[AuthApiService] Error response status:', error.response?.status);
    
    // Extraer mensaje de error del backend
    let errorMessage = error.response?.data?.message || 
                      error.response?.data?.error || 
                      error.message || 
                      'Error al registrar usuario';
    
    // Si el mensaje es un array, convertirlo a string
    if (Array.isArray(errorMessage)) {
      errorMessage = errorMessage.join('. ');
    } else if (typeof errorMessage === 'object' && errorMessage !== null) {
      // Si es un objeto, intentar extraer el mensaje
      errorMessage = errorMessage.message || JSON.stringify(errorMessage);
    }
    
    throw {
      success: false,
      message: errorMessage,
      error: error.response?.data || error,
      status: error.response?.status,
    };
  }
}

/**
 * Primer paso de login: validar email y password
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @returns {Promise} Respuesta del servidor
 */
export async function login(email, password) {
  try {
    const endpoint = '/auth/login';
    
    const payload = {
      email,
      password,
    };

    console.log('[AuthApiService] Iniciando login:', { email });
    
    const response = await jwtApiService.post(endpoint, payload);
    
    console.log('[AuthApiService] Login exitoso:', response);
    
    return {
      success: true,
      data: response,
      message: 'Credenciales válidas. Por favor firma el mensaje con tu wallet.',
    };
  } catch (error) {
    console.error('[AuthApiService] Error en login:', error);
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Error al iniciar sesión';
    
    throw {
      success: false,
      message: errorMessage,
      error: error.response?.data || error,
      status: error.response?.status,
    };
  }
}

/**
 * Solicita un mensaje de login para firmar con la wallet
 * @param {string} loginSessionId - ID de sesión obtenido del primer paso de login
 * @returns {Promise} Mensaje para firmar
 */
export async function loginNonce(loginSessionId) {
  try {
    const endpoint = '/auth/login/nonce';
    
    const payload = {
      loginSessionId,
    };

    console.log('[AuthApiService] Solicitando nonce para login:', { loginSessionId });
    console.log('[AuthApiService] Payload completo:', payload);
    
    const response = await jwtApiService.post(endpoint, payload);
    
    console.log('[AuthApiService] Nonce recibido:', response);
    
    return {
      success: true,
      data: response,
      message: response.message || 'Mensaje generado para firmar',
    };
  } catch (error) {
    console.error('[AuthApiService] Error obteniendo nonce de login:', error);
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Error al obtener mensaje para firmar';
    
    throw {
      success: false,
      message: errorMessage,
      error: error.response?.data || error,
      status: error.response?.status,
    };
  }
}

/**
 * Verifica la firma del mensaje y devuelve JWT
 * @param {string} loginSessionId - ID de sesión obtenido del primer paso de login
 * @param {string} signature - Firma del mensaje
 * @returns {Promise} Token JWT
 */
export async function loginVerify(loginSessionId, signature) {
  try {
    const endpoint = '/auth/login/verify';
    
    const payload = {
      loginSessionId,
      signature,
    };

    console.log('[AuthApiService] Verificando firma de login:', { loginSessionId });
    
    const response = await jwtApiService.post(endpoint, payload);
    
    console.log('[AuthApiService] Verificación exitosa, token recibido');
    
    return {
      success: true,
      data: response,
      token: response.accessToken || response.token,
      message: 'Login exitoso',
    };
  } catch (error) {
    console.error('[AuthApiService] Error verificando firma de login:', error);
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Error al verificar firma';
    
    throw {
      success: false,
      message: errorMessage,
      error: error.response?.data || error,
      status: error.response?.status,
    };
  }
}

/**
 * Verifica que la wallet conectada coincide con la asociada al usuario logueado
 * @param {string} walletAddress - Dirección de la wallet a verificar
 * @returns {Promise} Resultado de la verificación
 */
export async function verifyWallet(walletAddress) {
  try {
    const endpoint = '/auth/verify-wallet';
    
    const payload = {
      walletAddress,
    };

    console.log('[AuthApiService] Verificando wallet:', { walletAddress });
    
    const response = await jwtApiService.post(endpoint, payload);
    
    console.log('[AuthApiService] Verificación de wallet exitosa:', response);
    
    return {
      success: true,
      data: response,
      message: 'Wallet verificada correctamente',
    };
  } catch (error) {
    console.error('[AuthApiService] Error verificando wallet:', error);
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Error al verificar wallet';
    
    throw {
      success: false,
      message: errorMessage,
      error: error.response?.data || error,
      status: error.response?.status,
    };
  }
}

export default {
  register,
  login,
  loginNonce,
  loginVerify,
  verifyWallet,
};

