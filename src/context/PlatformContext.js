import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { detectPlatform, getPlatformBaseUrl } from '../utils/platformDetector';
import { getReferralParamsWithFallback } from '../utils/urlParams';

const PlatformContext = createContext(undefined);

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (!context) {
    console.warn('[usePlatform] Contexto no disponible, usando valores por defecto');
    // Retornar valores por defecto en lugar de lanzar error
    return {
      platform: 'fund8',
      isFund8: true,
      isDefily: false,
      referralParams: {
        hasReferral: false,
        requiresReferral: false,
        nftId: null,
        side: null,
        isCorporate: false
      },
      redirectToOtherPlatform: () => {},
      getOtherPlatformUrl: () => ''
    };
  }
  return context;
};

export const PlatformProvider = ({ children }) => {
  // Estado para la plataforma (puede cambiar si el usuario navega)
  const [platform, setPlatform] = useState(() => detectPlatform());
  const [referralParams, setReferralParams] = useState(() => getReferralParamsWithFallback());
  
  // Detectar cambios en la URL (por si el usuario navega o cambia parámetros)
  useEffect(() => {
    const updatePlatform = () => {
      const newPlatform = detectPlatform();
      setPlatform(newPlatform);
    };
    
    const updateReferralParams = () => {
      const newParams = getReferralParamsWithFallback();
      setReferralParams(newParams);
    };
    
    // Actualizar al montar
    updatePlatform();
    updateReferralParams();
    
    // Escuchar cambios en la URL (popstate para navegación del navegador)
    // Guardar referencia de la función para poder removerla correctamente
    const handlePopState = () => {
      updatePlatform();
      updateReferralParams();
    };
    window.addEventListener('popstate', handlePopState);
    
    // Escuchar cambios en hash/search (para cambios de parámetros sin recargar)
    const handleLocationChange = () => {
      updateReferralParams();
    };
    
    // Usar MutationObserver para detectar cambios en la URL sin recargar
    let lastUrl = window.location.href;
    const checkUrl = () => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        updatePlatform();
        updateReferralParams();
      }
    };
    
    // Verificar periódicamente (cada 500ms) si la URL cambió
    const intervalId = setInterval(checkUrl, 500);
    
    return () => {
      // Usar la misma referencia de función para remover el listener correctamente
      window.removeEventListener('popstate', handlePopState);
      clearInterval(intervalId);
    };
  }, []);
  
  const baseUrl = useMemo(() => getPlatformBaseUrl(platform), [platform]);
  
  // Función para redirigir a la otra plataforma
  const redirectToOtherPlatform = useMemo(() => {
    return (path = '') => {
      const otherPlatform = platform === 'fund8' ? 'defily' : 'fund8';
      const otherUrl = getPlatformBaseUrl(otherPlatform);
      window.location.href = `${otherUrl}${path}`;
    };
  }, [platform]);
  
  // Función para generar URL de la otra plataforma (sin redirigir)
  const getOtherPlatformUrl = useMemo(() => {
    return (path = '') => {
      const otherPlatform = platform === 'fund8' ? 'defily' : 'fund8';
      return `${getPlatformBaseUrl(otherPlatform)}${path}`;
    };
  }, [platform]);
  
  const value = useMemo(() => ({
    // Estado
    platform, // 'fund8' o 'defily'
    baseUrl,
    referralParams,
    
    // Flags de conveniencia
    isFund8: platform === 'fund8',
    isDefily: platform === 'defily',
    
    // Funciones
    redirectToOtherPlatform,
    getOtherPlatformUrl,
    
    // Funciones de actualización (para casos especiales)
    refreshReferralParams: () => {
      setReferralParams(getReferralParamsWithFallback());
    }
  }), [platform, baseUrl, referralParams, redirectToOtherPlatform, getOtherPlatformUrl]);
  
  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
};







