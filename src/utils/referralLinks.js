// Base URLs para las plataformas
const DEFILY_URL = 'https://app.defily.ai';
const FUND8_URL = 'https://app.fund8.io';

/**
 * Convierte side a formato de letra (L/R)
 * @param {number|string} side - 0 (Left) o 1 (Right), o 'left'/'right'
 * @returns {string} 'L' o 'R'
 */
const sideToLetter = (side) => {
  if (side === 0 || side === '0' || side === 'left' || side === 'LEFT' || side === 'L') {
    return 'L';
  }
  if (side === 1 || side === '1' || side === 'right' || side === 'RIGHT' || side === 'R') {
    return 'R';
  }
  return 'L'; // Default
};

/**
 * Genera enlace de referido para DeFily (formato nuevo: nftId + side)
 * @param {number} nftId - ID del NFT (tokenId)
 * @param {number|string} side - 0 (Left) o 1 (Right)
 * @param {boolean} useRelativeUrl - Si es true, usa URL relativa en lugar de absoluta
 * @returns {string} URL de referido para DeFily (redirige a página de registro)
 */
export const generateDefilyReferralLink = (nftId, side, useRelativeUrl = false) => {
  if (!nftId && nftId !== 0) {
    return null;
  }
  
  const sideLetter = sideToLetter(side);
  
  // Si se solicita URL relativa, usar la ruta relativa (útil para desarrollo/localhost)
  if (useRelativeUrl) {
    return `/register?nftId=${nftId}&side=${sideLetter}`;
  }
  
  // Redirigir a página de registro de DeFily
  return `${DEFILY_URL}/register?nftId=${nftId}&side=${sideLetter}`;
};

/**
 * Genera enlace de referido para Fund8 (formato nuevo: nftId + side)
 * @param {number} nftId - ID del NFT (tokenId)
 * @param {number|string} side - 0 (Left) o 1 (Right)
 * @param {boolean} useRelativeUrl - Si es true, usa URL relativa en lugar de absoluta
 * @returns {string} URL de referido para Fund8 (redirige a página de registro)
 */
export const generateFund8ReferralLink = (nftId, side, useRelativeUrl = false) => {
  if (!nftId && nftId !== 0) {
    return null;
  }
  
  const sideLetter = sideToLetter(side);
  
  // Si se solicita URL relativa, usar la ruta relativa (útil para desarrollo/localhost)
  if (useRelativeUrl) {
    return `/register?nftId=${nftId}&side=${sideLetter}`;
  }
  
  // Redirigir a página de registro de Fund8 (NO a DeFily)
  return `${FUND8_URL}/register?nftId=${nftId}&side=${sideLetter}`;
};

/**
 * Genera ambos enlaces de referido (DeFily y Fund8) para un NFT
 * @param {number} nftId - ID del NFT (tokenId)
 * @param {number|string} side - 0 (Left) o 1 (Right)
 * @returns {Object} Objeto con enlaces para DeFily y Fund8
 */
export const generateDualReferralLinks = (nftId, side) => {
  return {
    defily: generateDefilyReferralLink(nftId, side),
    fund8: generateFund8ReferralLink(nftId, side)
  };
};

/**
 * Genera enlace de referido (compatibilidad con código antiguo, pero usa nuevo formato)
 * @param {string|null} referralsLink - No se usa en nuevo formato, mantener para compatibilidad
 * @param {number|string} side - 0 (Left) o 1 (Right), o 'left'/'right'
 * @param {number|null} tokenId - ID del NFT (tokenId) - REQUERIDO para nuevo formato
 * @returns {string|null} URL de referido o null si no hay tokenId
 */
export const generateReferralLink = (referralsLink, side, tokenId = null) => {
  // En el nuevo formato, solo usamos tokenId
  if (tokenId === null || tokenId === undefined) {
    return null;
  }
  
  // Por defecto genera para DeFily (mantener compatibilidad)
  return generateDefilyReferralLink(tokenId, side);
};

/**
 * URL por defecto para usuarios de Fund8 sin enlace de referido
 * Apunta a la cuenta corporativa de Fund8 (NFT #2904) en el árbol de DeFily
 * @returns {string} URL corporativa de Fund8
 */
export const getFund8DefaultReferralUrl = () => {
  return `${FUND8_URL}?nftId=2904&side=A`;
};

/**
 * Abre enlace de referido en nueva ventana
 * @param {string|null} referralsLink - No se usa en nuevo formato
 * @param {number|string} side - 0 (Left) o 1 (Right)
 * @param {number|null} tokenId - ID del NFT (tokenId)
 */
export const openReferralLink = (referralsLink, side, tokenId = null) => {
  const link = generateReferralLink(referralsLink, side, tokenId);
  if (link) {
    window.open(link, '_blank', 'noopener,noreferrer');
  }
};

// Exportar URLs base
export { DEFILY_URL, FUND8_URL };

