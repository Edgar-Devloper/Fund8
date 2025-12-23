/**
 * Utilidades para integración con DeFily
 * Lee datos de redirección desde DeFily (URL params y sessionStorage)
 */

/**
 * Obtiene los datos de redirección desde DeFily
 * Lee primero de los parámetros de URL, luego de sessionStorage como respaldo
 * @returns {Object} Objeto con walletAddress, nftId, isFromDefily, timestamp
 */
export const getDefilyRedirectData = () => {
  try {
    // Leer parámetros de URL primero (tienen prioridad)
    const urlParams = new URLSearchParams(window.location.search);
    const walletFromUrl = urlParams.get('wallet');
    const nftIdFromUrl = urlParams.get('nftId');
    const sourceFromUrl = urlParams.get('source');
    const timestampFromUrl = urlParams.get('timestamp');

    // Leer de sessionStorage como respaldo
    const walletFromStorage = sessionStorage.getItem('defily_wallet_address');
    const nftIdFromStorage = sessionStorage.getItem('defily_nft_id');
    const timestampFromStorage = sessionStorage.getItem('defily_redirect_timestamp');

    // Priorizar datos de URL, usar sessionStorage como fallback
    const walletAddress = walletFromUrl || walletFromStorage;
    const nftId = nftIdFromUrl || nftIdFromStorage;
    const timestamp = timestampFromUrl || timestampFromStorage;
    
    // Verificar si viene de DeFily
    const isFromDefily = sourceFromUrl === 'defily' || !!walletFromStorage || !!nftIdFromStorage;

    return {
      walletAddress: walletAddress ? walletAddress.toLowerCase() : null,
      nftId: nftId ? parseInt(nftId, 10) : null,
      isFromDefily,
      timestamp: timestamp ? parseInt(timestamp, 10) : null,
      // Flags adicionales
      hasWallet: !!walletAddress,
      hasNftId: !!nftId,
    };
  } catch (error) {
    console.error('[Defily Integration] Error reading redirect data:', error);
    return {
      walletAddress: null,
      nftId: null,
      isFromDefily: false,
      timestamp: null,
      hasWallet: false,
      hasNftId: false,
    };
  }
};

/**
 * Limpia los datos temporales de sessionStorage después de usarlos
 * Esta función debe ser llamada después de procesar los datos de DeFily
 */
export const clearDefilyRedirectData = () => {
  try {
    sessionStorage.removeItem('defily_wallet_address');
    sessionStorage.removeItem('defily_nft_id');
    sessionStorage.removeItem('defily_redirect_timestamp');
    
    console.log('[Defily Integration] Redirect data cleared from sessionStorage');
  } catch (error) {
    console.error('[Defily Integration] Error clearing sessionStorage:', error);
  }
};

/**
 * Valida si los datos de DeFily son válidos y no están expirados
 * @param {number} maxAge - Tiempo máximo en milisegundos (default: 5 minutos)
 * @returns {Object} Objeto con isValid y reason
 */
export const validateDefilyRedirectData = (maxAge = 5 * 60 * 1000) => {
  const data = getDefilyRedirectData();

  if (!data.isFromDefily) {
    return {
      isValid: false,
      reason: 'not_from_defily',
      data: null,
    };
  }

  if (!data.walletAddress) {
    return {
      isValid: false,
      reason: 'no_wallet_address',
      data: null,
    };
  }

  // Validar formato de wallet address (debe ser una dirección Ethereum válida)
  if (!/^0x[a-fA-F0-9]{40}$/.test(data.walletAddress)) {
    return {
      isValid: false,
      reason: 'invalid_wallet_format',
      data: null,
    };
  }

  // Validar timestamp si existe (no debe estar expirado)
  if (data.timestamp) {
    const age = Date.now() - data.timestamp;
    if (age > maxAge) {
      return {
        isValid: false,
        reason: 'data_expired',
        data: null,
      };
    }
  }

  // Validar NFT ID si existe (debe ser un número válido)
  if (data.nftId !== null && (isNaN(data.nftId) || data.nftId < 0)) {
    return {
      isValid: false,
      reason: 'invalid_nft_id',
      data: null,
    };
  }

  return {
    isValid: true,
    reason: null,
    data,
  };
};

/**
 * Obtiene la URL de DeFily (producción)
 * @param {string} path - Ruta adicional en DeFily (opcional)
 * @returns {string} URL completa de DeFily
 */
export const getDefilyUrl = (path = '') => {
  const baseUrl = 'https://app.defily.ai'; // URL de producción de DeFily
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

