/**
 * Utilidades para leer y procesar parámetros de URL relacionados con referidos
 */

import { detectPlatform } from './platformDetector';

/**
 * Lee los parámetros de referido de la URL actual (SOLO formato nuevo: nftId + side)
 * @returns {Object} Objeto con nftId, side, y hasReferral
 */
export const getReferralParams = () => {
  const params = new URLSearchParams(window.location.search);
  const nftId = params.get('nftId');
  const side = params.get('side'); // 'L', 'R', o número (0/1)
  
  // Normalizar side: convertir L/R a números o mantener número
  let normalizedSide = null;
  if (side) {
    const sideUpper = side.toUpperCase();
    if (sideUpper === 'L' || sideUpper === 'LEFT' || sideUpper === '0') {
      normalizedSide = 0; // Left = 0
    } else if (sideUpper === 'R' || sideUpper === 'RIGHT' || sideUpper === '1') {
      normalizedSide = 1; // Right = 1
    } else if (!isNaN(Number(side))) {
      normalizedSide = Number(side);
    }
  }
  
  return {
    nftId: nftId ? parseInt(nftId, 10) : null,
    side: normalizedSide,
    sideRaw: side, // Mantener valor original para referencia
    hasReferral: !!(nftId && normalizedSide !== null)
  };
};

/**
 * Obtiene los parámetros de referido con fallback para usuarios sin enlace
 * @returns {Object} Parámetros de referido con información de fallback
 */
export const getReferralParamsWithFallback = () => {
  const platform = detectPlatform();
  const params = getReferralParams();
  
  // Si es Fund8 y no tiene enlace, usar corporativo
  if (platform === 'fund8' && !params.hasReferral) {
    return {
      nftId: 2904, // NFT corporativo de Fund8 (según el código actual)
      side: 0, // O 'A' según lo que definan, por ahora usamos 0 (Left)
      sideRaw: 'A', // Mantener 'A' como valor original
      hasReferral: false,
      isCorporate: true,
      requiresReferral: false
    };
  }
  
  // Si es DeFily y no tiene enlace, requerir enlace
  if (platform === 'defily' && !params.hasReferral) {
    return {
      nftId: null,
      side: null,
      sideRaw: null,
      hasReferral: false,
      isCorporate: false,
      requiresReferral: true // Flag para mostrar error
    };
  }
  
  // Tiene enlace válido
  return {
    ...params,
    isCorporate: false,
    requiresReferral: false
  };
};

/**
 * Convierte side de número a letra (para URLs)
 * @param {number} side - 0 (Left) o 1 (Right)
 * @returns {string} 'L' o 'R'
 */
export const sideToLetter = (side) => {
  if (side === 0 || side === '0' || side === 'L' || side === 'LEFT') {
    return 'L';
  }
  if (side === 1 || side === '1' || side === 'R' || side === 'RIGHT') {
    return 'R';
  }
  return 'L'; // Default
};

/**
 * Convierte side de letra a número
 * @param {string} side - 'L' o 'R'
 * @returns {number} 0 (Left) o 1 (Right)
 */
export const sideToNumber = (side) => {
  if (!side) return 0;
  const sideUpper = String(side).toUpperCase();
  if (sideUpper === 'L' || sideUpper === 'LEFT' || sideUpper === '0') {
    return 0;
  }
  if (sideUpper === 'R' || sideUpper === 'RIGHT' || sideUpper === '1') {
    return 1;
  }
  return 0; // Default
};


