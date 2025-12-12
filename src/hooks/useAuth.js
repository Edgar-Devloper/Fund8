import { useAuth as useAuthContext } from '../context/AuthContext';

/**
 * Hook para acceder al contexto de autenticación JWT
 * 
 * @returns {Object} Objeto con el estado y funciones de autenticación
 * 
 * @example
 * const { isAuthenticated, isAuthenticating, authError, authenticate, logout } = useAuth();
 */
export const useAuth = () => {
  return useAuthContext();
};

export default useAuth;

















