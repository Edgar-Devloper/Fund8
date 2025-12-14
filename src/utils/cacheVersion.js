/**
 * Sistema de versionado de caché para forzar actualización de recursos
 * en actualizaciones importantes de la aplicación
 * 
 * La versión se obtiene automáticamente del package.json durante el build.
 * Para forzar una actualización de caché, simplemente actualiza la versión en package.json
 */

// Versión de la aplicación - se obtiene automáticamente del package.json vía webpack
// Si no está disponible, usa un valor por defecto
const APP_VERSION = process.env.REACT_APP_VERSION || '1.0.0';

// Clave para almacenar la versión en localStorage
const VERSION_STORAGE_KEY = 'fund8_app_version';
const CACHE_BUST_KEY = 'fund8_cache_bust';

/**
 * Obtiene la versión actual de la aplicación
 */
export const getAppVersion = () => {
  return APP_VERSION;
};

/**
 * Obtiene el cache bust parameter (timestamp o versión)
 */
export const getCacheBust = () => {
  // Intentar obtener desde localStorage
  const stored = localStorage.getItem(CACHE_BUST_KEY);
  if (stored) {
    return stored;
  }
  
  // Si no existe, generar uno nuevo basado en la versión
  const cacheBust = `v${APP_VERSION.replace(/\./g, '_')}_${Date.now()}`;
  localStorage.setItem(CACHE_BUST_KEY, cacheBust);
  return cacheBust;
};

/**
 * Verifica si hay una nueva versión de la aplicación
 * y fuerza la limpieza de caché si es necesario
 */
export const checkForUpdates = () => {
  const currentVersion = getAppVersion();
  const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);
  
  // Si no hay versión almacenada o es diferente, es una actualización
  if (!storedVersion || storedVersion !== currentVersion) {
    console.log('[Cache Version] Nueva versión detectada:', currentVersion, 'Anterior:', storedVersion);
    
    // Limpiar caché de imágenes
    clearImageCache();
    
    // Actualizar versión almacenada
    localStorage.setItem(VERSION_STORAGE_KEY, currentVersion);
    
    // Generar nuevo cache bust
    const newCacheBust = `v${currentVersion.replace(/\./g, '_')}_${Date.now()}`;
    localStorage.setItem(CACHE_BUST_KEY, newCacheBust);
    
    // Forzar recarga de recursos críticos
    if (storedVersion) {
      // Solo mostrar mensaje si ya había una versión previa (no en primera carga)
      console.log('[Cache Version] Caché limpiado para nueva versión. Las imágenes se recargarán automáticamente.');
    }
    
    return true;
  }
  
  return false;
};

/**
 * Limpia el caché de imágenes del navegador
 */
const clearImageCache = () => {
  try {
    // Limpiar caché de service workers si existe
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('images') || name.includes('static') || name.includes('ipfs')) {
            caches.delete(name).then(() => {
              console.log('[Cache Version] Caché eliminado:', name);
            });
          }
        });
      }).catch(err => {
        console.error('[Cache Version] Error eliminando cachés:', err);
      });
    }
    
    // Forzar recarga de imágenes en el DOM (si ya están cargadas)
    setTimeout(() => {
      const images = document.querySelectorAll('img[src*="ipfs"]');
      if (images.length > 0) {
        console.log('[Cache Version] Forzando recarga de', images.length, 'imágenes');
        images.forEach(img => {
          const src = img.src;
          if (src && !src.includes('_v=')) {
            // Agregar timestamp para forzar recarga
            const separator = src.includes('?') ? '&' : '?';
            img.src = `${src}${separator}_v=${Date.now()}`;
          }
        });
      }
    }, 100);
  } catch (error) {
    console.error('[Cache Version] Error limpiando caché:', error);
  }
};

/**
 * Agrega el parámetro de cache bust a una URL
 */
export const addCacheBust = (url) => {
  if (!url) return url;
  
  // Si ya tiene parámetros de query, verificar si ya tiene cache bust
  if (url.includes('_v=')) {
    return url; // Ya tiene cache bust, no duplicar
  }
  
  const separator = url.includes('?') ? '&' : '?';
  const cacheBust = getCacheBust();
  
  return `${url}${separator}_v=${cacheBust}`;
};

/**
 * Inicializa el sistema de versionado
 * Debe llamarse al inicio de la aplicación
 */
export const initCacheVersion = () => {
  const hasUpdate = checkForUpdates();
  
  // Verificar actualizaciones periódicamente (cada 5 minutos)
  setInterval(() => {
    checkForUpdates();
  }, 5 * 60 * 1000);
  
  return hasUpdate;
};
