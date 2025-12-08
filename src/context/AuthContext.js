import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useWallet } from './WalletContext';
import { authService } from '../services/jwtAuthService';

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { address, signer, isConnected, disconnectWallet } = useWallet();
  const [accessToken, setAccessToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Definir logout primero para que pueda ser usado en otros hooks
  const logout = useCallback(() => {
    setAccessToken(null);
    setIsAuthenticated(false);
    setAuthError(null);
    authService.setToken(null);
    
    // Limpiar localStorage de autenticación
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('jwt_wallet_address');
    
    // Limpiar flags del modal de NFT para que aparezca de nuevo al volver a loguearse
    if (address) {
      const modalShownKey = `nftModalShownOnce_${address.toLowerCase()}`;
      localStorage.removeItem(modalShownKey);
      console.log('[Auth] Limpiado flag del modal de NFT para wallet:', address);
    }
    
    // Limpiar todos los flags de modal (por si cambia de wallet)
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('nftModalShownOnce_')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('[Auth] Sesión cerrada');
  }, [address]);

  const authenticate = useCallback(async () => {
    if (!address || !signer) {
      setAuthError('Wallet no conectada');
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      // 1. Obtener nonce del backend
      console.log('[Auth] Obteniendo nonce para wallet:', address);
      const nonceResponse = await authService.getNonce(address);
      const message = nonceResponse.message;

      console.log('[Auth] Nonce recibido del backend:', message);
      console.log('[Auth] Respuesta completa:', nonceResponse);

      if (!message) {
        throw new Error('No se recibió el mensaje para firmar');
      }

      // 2. Firmar el mensaje con la wallet
      console.log('[Auth] Solicitando firma del mensaje en MetaMask...');
      const signature = await signer.signMessage(message);
      console.log('[Auth] Firma obtenida:', signature);

      // 3. Verificar y obtener el JWT
      const verifyResponse = await authService.verify(address, signature);
      const token = verifyResponse.accessToken;

      if (!token) {
        throw new Error('No se recibió el token de acceso');
      }

      // 4. Guardar el token
      setAccessToken(token);
      setIsAuthenticated(true);
      authService.setToken(token);
      
      // Guardar en localStorage
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('jwt_wallet_address', address.toLowerCase());

      console.log('[Auth] Autenticación exitosa');
    } catch (err) {
      console.error('[Auth] Error en autenticación:', err);
      
      // Si el backend no está disponible (404), no bloquear el flujo
      // La autenticación JWT es opcional
      if (err.response?.status === 404 || err.message?.includes('404')) {
        console.warn('[Auth] Backend de autenticación no disponible (404). Continuando sin autenticación JWT.');
        setAuthError(null); // No mostrar error si el backend no está disponible
        setIsAuthenticated(false);
        setAccessToken(null);
        authService.setToken(null);
        setIsAuthenticating(false);
        return; // Salir sin bloquear
      }
      
      let errorMessage = 'Error al autenticar';
      
      if (err.message?.includes('reject') || err.message?.includes('denied') || err.message?.includes('User rejected')) {
        errorMessage = 'Firma cancelada. Por favor, firma el mensaje para autenticarte.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setAuthError(errorMessage);
      setIsAuthenticated(false);
      setAccessToken(null);
      authService.setToken(null);
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, signer]);

  // Re-autenticar si el token expira (manejar 401)
  const handleTokenExpired = useCallback(() => {
    console.log('[Auth] Token expirado, re-autenticando...');
    logout();
    if (isConnected && address && signer) {
      // Re-autenticar automáticamente
      setTimeout(() => authenticate(), 500);
    }
  }, [isConnected, address, signer, logout, authenticate]);

  // Cargar token desde localStorage al montar (PRIMERO, antes de cualquier autenticación)
  useEffect(() => {
    // Este efecto se ejecuta primero, al montar el componente
    const storedToken = localStorage.getItem('jwt_token');
    const storedAddress = localStorage.getItem('jwt_wallet_address');
    
    if (storedToken && storedAddress) {
      console.log('[Auth] Token encontrado en localStorage al montar');
      // Guardar el token en el servicio inmediatamente
      authService.setToken(storedToken);
    }
  }, []); // Solo ejecutar al montar

  // Verificar y restaurar token cuando la wallet se conecta o cambia
  useEffect(() => {
    if (!address) {
      // Si no hay wallet, limpiar autenticación
      if (isAuthenticated) {
        setAccessToken(null);
        setIsAuthenticated(false);
      }
      return;
    }
    
    const storedToken = localStorage.getItem('jwt_token');
    const storedAddress = localStorage.getItem('jwt_wallet_address');
    
    // Verificar si hay token válido para esta wallet
    if (storedToken && storedAddress && address.toLowerCase() === storedAddress.toLowerCase()) {
      // Token válido para esta wallet
      if (!isAuthenticated || accessToken !== storedToken) {
        console.log('[Auth] Restaurando sesión desde token guardado para wallet:', address);
        setAccessToken(storedToken);
        setIsAuthenticated(true);
        authService.setToken(storedToken);
      }
    } else if (storedToken && storedAddress) {
      // Token existe pero es para otra wallet
      console.log('[Auth] Token es para otra wallet, limpiando...');
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('jwt_wallet_address');
      setAccessToken(null);
      setIsAuthenticated(false);
      authService.setToken(null);
    } else if (!storedToken && isAuthenticated) {
      // No hay token pero está marcado como autenticado (inconsistencia)
      console.log('[Auth] Inconsistencia detectada: autenticado pero sin token, limpiando...');
      setAccessToken(null);
      setIsAuthenticated(false);
      authService.setToken(null);
    }
  }, [address, isAuthenticated, accessToken]);

  // Autenticar automáticamente cuando se conecta la wallet (solo si NO hay token válido)
  // DESHABILITADO TEMPORALMENTE: El backend de autenticación no está disponible
  // La autenticación JWT es opcional y no bloquea el flujo de creación de NFT
  useEffect(() => {
    // NO autenticar automáticamente si el backend no está disponible
    // El usuario puede usar la app sin autenticación JWT
    const authBackendEnabled = process.env.REACT_APP_ENABLE_AUTH_BACKEND === 'true';
    
    if (!authBackendEnabled) {
      console.log('[Auth] Backend de autenticación deshabilitado, saltando autenticación automática');
      return;
    }
    
    // NO autenticar si ya estamos autenticados
    if (isAuthenticated) {
      return;
    }
    
    // Verificar token una vez más antes de autenticar
    const storedToken = localStorage.getItem('jwt_token');
    const storedAddress = localStorage.getItem('jwt_wallet_address');
    const hasValidToken = storedToken && 
                         storedAddress && 
                         address && 
                         address.toLowerCase() === storedAddress.toLowerCase();
    
    // Solo intentar autenticar si:
    // - Wallet está conectada
    // - Hay signer disponible
    // - NO está autenticado (ya verificado arriba)
    // - NO está en proceso de autenticación
    // - NO hay error previo
    // - NO hay token válido guardado
    if (isConnected && 
        address && 
        signer && 
        !isAuthenticating && 
        !authError &&
        !hasValidToken) {
      console.log('[Auth] No hay token válido, iniciando autenticación...');
      // Pequeño delay para asegurar que todos los efectos anteriores hayan terminado
      const timer = setTimeout(() => {
        // Verificar una vez más antes de autenticar (por si otro efecto restauró el token)
        const finalToken = localStorage.getItem('jwt_token');
        const finalAddress = localStorage.getItem('jwt_wallet_address');
        const stillNoToken = !finalToken || 
                            !finalAddress || 
                            finalAddress.toLowerCase() !== address.toLowerCase();
        
        if (stillNoToken && !isAuthenticated) {
      authenticate();
        }
      }, 200);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, signer, isAuthenticated, isAuthenticating, authError]);

  // Limpiar autenticación cuando se desconecta la wallet (pero no si hay token guardado)
  useEffect(() => {
    if (!isConnected) {
      // Verificar si hay token guardado antes de limpiar
      // Si hay token, puede ser que la wallet se esté reconectando
      const storedToken = localStorage.getItem('jwt_token');
      const storedAddress = localStorage.getItem('jwt_wallet_address');
      
      if (storedToken && storedAddress) {
        // Hay token guardado, no limpiar todavía
        // Esperar a ver si la wallet se reconecta
        console.log('[Auth] Wallet desconectada pero hay token guardado, esperando reconexión...');
        return;
      }
      
      // No hay token guardado, limpiar autenticación
      if (isAuthenticated) {
        console.log('[Auth] Wallet desconectada y sin token guardado, cerrando sesión');
      logout();
    }
    }
  }, [isConnected, logout, isAuthenticated]);

  // Escuchar evento de token expirado
  useEffect(() => {
    const handleTokenExpiredEvent = () => {
      handleTokenExpired();
    };

    window.addEventListener('token-expired', handleTokenExpiredEvent);

    return () => {
      window.removeEventListener('token-expired', handleTokenExpiredEvent);
    };
  }, [handleTokenExpired]);

  const value = {
    accessToken,
    isAuthenticated,
    isAuthenticating,
    authError,
    authenticate,
    logout,
    handleTokenExpired
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

