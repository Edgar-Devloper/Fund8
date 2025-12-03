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
    
    // Limpiar localStorage
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('jwt_wallet_address');
    
    console.log('[Auth] Sesión cerrada');
  }, []);

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

  // Cargar token desde localStorage al montar
  useEffect(() => {
    const storedToken = localStorage.getItem('jwt_token');
    const storedAddress = localStorage.getItem('jwt_wallet_address');
    
    if (storedToken && storedAddress) {
      // Verificar que el token sea para la wallet actual
      if (address && address.toLowerCase() === storedAddress.toLowerCase()) {
        setAccessToken(storedToken);
        setIsAuthenticated(true);
        // Verificar si el token sigue siendo válido
        authService.setToken(storedToken);
      } else {
        // Si la wallet cambió, limpiar el token
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('jwt_wallet_address');
      }
    }
  }, [address]);

  // Autenticar automáticamente cuando se conecta la wallet (solo una vez)
  useEffect(() => {
    // Solo intentar autenticar si:
    // - Wallet está conectada
    // - No está autenticado
    // - No está en proceso de autenticación
    // - No hay error previo
    if (isConnected && address && signer && !isAuthenticated && !isAuthenticating && !authError) {
      console.log('[Auth] Iniciando autenticación automática...');
      authenticate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, signer]); // Solo depender de estos para evitar loops infinitos

  // Limpiar autenticación cuando se desconecta la wallet
  useEffect(() => {
    if (!isConnected) {
      logout();
    }
  }, [isConnected, logout]);

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

