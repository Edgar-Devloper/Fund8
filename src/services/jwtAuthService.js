import axios from 'axios';

// Función para normalizar la URL base (asegurar que termine en /api)
const normalizeBaseUrl = (url) => {
  if (!url) return url;
  
  // Remover espacios y barras finales
  let normalized = url.trim().replace(/\/+$/, '');
  
  // Si no termina en /api, agregarlo
  if (!normalized.endsWith('/api')) {
    normalized = normalized + '/api';
  }
  
  return normalized;
};

// URL base del backend (ajusta según tu configuración)
const getBackendUrl = () => {
  // Usar REACT_APP_API_BASE_URL si está configurado
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  if (apiBaseUrl) {
    const normalized = normalizeBaseUrl(apiBaseUrl);
    console.log('[Auth Service] Usando REACT_APP_API_BASE_URL:', {
      original: apiBaseUrl,
      normalized: normalized
    });
    return normalized;
  }
  
  // Fallback a otras variables por compatibilidad
  if (process.env.REACT_APP_BACKEND_API_URL) {
    const normalized = normalizeBaseUrl(process.env.REACT_APP_BACKEND_API_URL);
    console.log('[Auth Service] Usando REACT_APP_BACKEND_API_URL:', {
      original: process.env.REACT_APP_BACKEND_API_URL,
      normalized: normalized
    });
    return normalized;
  }
  
  // Por defecto, asume que el backend está en el mismo dominio
  const defaultUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  const normalized = normalizeBaseUrl(defaultUrl);
  console.warn('[Auth Service] No se encontró REACT_APP_API_BASE_URL, usando:', {
    original: defaultUrl,
    normalized: normalized
  });
  return normalized;
};

// Cliente axios para el backend
const backendApi = axios.create({
  baseURL: getBackendUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Log para verificar la configuración
console.log('[Auth Service] Cliente API configurado con baseURL:', getBackendUrl());

// Token JWT (se establece dinámicamente)
let jwtToken = null;

// Función para establecer el token
export const setToken = (token) => {
  jwtToken = token;
  
  if (token) {
    backendApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete backendApi.defaults.headers.common['Authorization'];
  }
};

// Interceptor para agregar el token automáticamente
backendApi.interceptors.request.use(
  (config) => {
    // Si hay un token, agregarlo al header
    if (jwtToken) {
      config.headers.Authorization = `Bearer ${jwtToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
backendApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Si recibimos un 401 (Unauthorized), el token puede haber expirado
    if (error.response?.status === 401) {
      // Limpiar el token
      setToken(null);
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('jwt_wallet_address');
      
      // Disparar evento personalizado para que AuthContext lo maneje
      window.dispatchEvent(new CustomEvent('token-expired'));
    }
    
    return Promise.reject(error);
  }
);

// Servicio de autenticación JWT
export const authService = {
  // Establecer token
  setToken,

  // Obtener nonce del backend
  getNonce: async (walletAddress) => {
    try {
      // El endpoint siempre es /auth/nonce
      // El baseURL ya está configurado correctamente en backendApi
      const endpoint = '/auth/nonce';
      
      const response = await backendApi.post(endpoint, {
        walletAddress
      });
      
      console.log('[Auth Service] Respuesta del backend:', response.data);
      return response.data;
    } catch (error) {
      // Si el backend no está disponible (404), lanzar error específico
      if (error.response?.status === 404) {
        console.warn('[Auth Service] Backend de autenticación no disponible (404). El servicio de autenticación JWT está deshabilitado.');
        const backendUnavailableError = new Error('Backend de autenticación no disponible');
        backendUnavailableError.response = { status: 404 };
        throw backendUnavailableError;
      }
      
      console.error('[Auth Service] Error obteniendo nonce:', error);
      console.error('[Auth Service] Detalles del error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullUrl: error.config?.baseURL + error.config?.url
      });
      throw error;
    }
  },

  // Verificar firma y obtener JWT
  verify: async (walletAddress, signature) => {
    try {
      // El endpoint siempre es /auth/verify
      // El baseURL ya está configurado correctamente en backendApi
      const endpoint = '/auth/verify';
      
      const response = await backendApi.post(endpoint, {
        walletAddress,
        signature
      });
      console.log('[Auth Service] Verificación exitosa, token recibido');
      return response.data;
    } catch (error) {
      console.error('[Auth Service] Error verificando firma:', error);
      console.error('[Auth Service] Detalles:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      throw error;
    }
  },

  // Cliente API configurado (para usar en otros servicios)
  api: backendApi
};

export default authService;
