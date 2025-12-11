/**
 * Utilidades para detectar la plataforma actual (Fund8 o DeFily)
 * basándose en el dominio de la URL
 */

/**
 * Detecta la plataforma actual desde el hostname
 * @returns {'fund8' | 'defily'} - La plataforma detectada
 */
export const detectPlatform = () => {
  const hostname = window.location.hostname.toLowerCase();
  
  // Detectar Fund8
  if (hostname.includes('fund8.io') || hostname.includes('fund8')) {
    return 'fund8';
  }
  
  // Detectar DeFily
  if (hostname.includes('defily.ai') || hostname.includes('defily')) {
    return 'defily';
  }
  
  // Default: asumir Fund8 si no se puede determinar
  // (útil para desarrollo local)
  return 'fund8';
};

/**
 * Obtiene la URL base de la plataforma especificada
 * @param {string} platform - 'fund8' o 'defily'
 * @returns {string} URL base de la plataforma
 */
export const getPlatformBaseUrl = (platform) => {
  return platform === 'fund8' 
    ? 'https://app.fund8.io'
    : 'https://app.defily.ai';
};

/**
 * Obtiene la URL base de la plataforma actual
 * @returns {string} URL base de la plataforma actual
 */
export const getCurrentPlatformBaseUrl = () => {
  const platform = detectPlatform();
  return getPlatformBaseUrl(platform);
};

/**
 * Verifica si la plataforma actual es Fund8
 * @returns {boolean}
 */
export const isFund8 = () => {
  return detectPlatform() === 'fund8';
};

/**
 * Verifica si la plataforma actual es DeFily
 * @returns {boolean}
 */
export const isDefily = () => {
  return detectPlatform() === 'defily';
};

