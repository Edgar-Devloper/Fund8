/**
 * Servicio para hacer peticiones al backend protegidas con JWT
 * 
 * Este servicio usa el cliente API configurado en authService que
 * automáticamente agrega el header Authorization con el JWT.
 * 
 * Ejemplo de uso:
 * 
 * import { jwtApiService } from '../services/jwtApiService';
 * 
 * // Hacer una petición GET protegida
 * const data = await jwtApiService.get('/api/protected-endpoint');
 * 
 * // Hacer una petición POST protegida
 * const result = await jwtApiService.post('/api/protected-endpoint', { data: 'value' });
 */

import { authService } from './jwtAuthService';

// Cliente API del backend (ya configurado con interceptor para JWT)
const api = authService.api;

export const jwtApiService = {
  /**
   * GET request al backend
   */
  get: async (url, config = {}) => {
    try {
      const response = await api.get(url, config);
      return response.data;
    } catch (error) {
      console.error('[Backend API] GET Error:', error);
      throw error;
    }
  },

  /**
   * POST request al backend
   */
  post: async (url, data = {}, config = {}) => {
    try {
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      console.error('[Backend API] POST Error:', error);
      throw error;
    }
  },

  /**
   * PUT request al backend
   */
  put: async (url, data = {}, config = {}) => {
    try {
      const response = await api.put(url, data, config);
      return response.data;
    } catch (error) {
      console.error('[Backend API] PUT Error:', error);
      throw error;
    }
  },

  /**
   * DELETE request al backend
   */
  delete: async (url, config = {}) => {
    try {
      const response = await api.delete(url, config);
      return response.data;
    } catch (error) {
      console.error('[Backend API] DELETE Error:', error);
      throw error;
    }
  },

  /**
   * PATCH request al backend
   */
  patch: async (url, data = {}, config = {}) => {
    try {
      const response = await api.patch(url, data, config);
      return response.data;
    } catch (error) {
      console.error('[Backend API] PATCH Error:', error);
      throw error;
    }
  }
};

export default jwtApiService;

