/**
 * Servicio para registrar y obtener operaciones de trading del backend Fund8
 * 
 * Este servicio registra todas las operaciones de trading (exitosas y fallidas)
 * para llevar un control completo del historial.
 */

import { jwtApiService } from './jwtApiService';

// Verificar que el usuario esté autenticado antes de usar este servicio
// El jwtApiService automáticamente agrega el JWT token si está disponible

/**
 * Tipos de operación soportados
 */
export const OperationSide = {
  BUY: 'BUY',
  SELL: 'SELL',
  OPEN: 'OPEN',
  CLOSE: 'CLOSE'
};

/**
 * Normaliza el side de Hyperliquid al formato del backend
 * @param {string} side - 'buy' o 'sell' de Hyperliquid
 * @returns {string} - 'BUY' o 'SELL' para el backend
 */
const normalizeSide = (side) => {
  const normalized = side?.toUpperCase();
  if (normalized === 'BUY' || normalized === 'SELL') {
    return normalized;
  }
  // Si viene como 'b' o 'a' (Hyperliquid format)
  if (side === 'b' || side === 'B') return 'BUY';
  if (side === 'a' || side === 'A') return 'SELL';
  return 'BUY'; // Default
};

/**
 * Normaliza el símbolo agregando USDT si no está presente
 * @param {string} symbol - Símbolo de Hyperliquid (ej: 'BTC')
 * @returns {string} - Símbolo normalizado (ej: 'BTCUSDT')
 */
const normalizeSymbol = (symbol) => {
  if (!symbol) return 'UNKNOWN';
  const upperSymbol = symbol.toUpperCase();
  // Si ya termina en USDT, retornarlo tal cual
  if (upperSymbol.endsWith('USDT')) {
    return upperSymbol;
  }
  // Agregar USDT al final
  return `${upperSymbol}USDT`;
};

/**
 * Registra una operación de trading en el backend
 * 
 * @param {string} nftId - ID del NFT (tokenId)
 * @param {Object} operationData - Datos de la operación
 * @param {string} operationData.side - 'BUY' o 'SELL'
 * @param {string} operationData.symbol - Símbolo del par (ej: 'BTCUSDT')
 * @param {number} operationData.amount - Cantidad
 * @param {number} [operationData.price] - Precio (opcional)
 * @param {Object} [operationData.metadata] - Metadata adicional (opcional)
 * @param {string} [operationData.status] - 'pending', 'success', 'failed' (para control)
 * @param {string} [operationData.error] - Mensaje de error si falló
 * @returns {Promise<Object>} - Respuesta del backend
 */
export const registerOperation = async (nftId, operationData) => {
  if (!nftId) {
    throw new Error('NFT ID es requerido para registrar la operación');
  }

  try {
    const normalizedSide = normalizeSide(operationData.side);
    const normalizedSymbol = normalizeSymbol(operationData.symbol);

    const payload = {
      side: normalizedSide,
      symbol: normalizedSymbol,
      amount: parseFloat(operationData.amount) || 0,
      price: operationData.price ? parseFloat(operationData.price) : undefined,
      metadata: {
        ...operationData.metadata,
        status: operationData.status || 'pending',
        timestamp: new Date().toISOString(),
        error: operationData.error || undefined,
        // Agregar información adicional si está disponible
        orderId: operationData.orderId,
        orderType: operationData.orderType,
        source: operationData.source || 'hyperliquid',
        hyperliquidOrderId: operationData.hyperliquidOrderId,
      }
    };

    // Remover campos undefined del metadata
    Object.keys(payload.metadata).forEach(key => {
      if (payload.metadata[key] === undefined) {
        delete payload.metadata[key];
      }
    });

    console.log('[Operations Service] Registrando operación:', {
      nftId,
      payload
    });

    // El endpoint es /operations?nftId=<nftId>
    const response = await jwtApiService.post(`/operations?nftId=${nftId}`, payload);

    console.log('[Operations Service] Operación registrada exitosamente:', response);
    return response;
    } catch (error) {
      console.error('[Operations Service] Error registrando operación:', error);
      console.error('[Operations Service] Detalles del error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullUrl: error.config?.baseURL + error.config?.url
      });
      // Log detallado del error del backend
      if (error.response?.data) {
        console.error('[Operations Service] ===== ERROR DEL BACKEND =====');
        console.error('[Operations Service] Mensaje:', error.response.data.message || error.response.data.error || 'Sin mensaje');
        console.error('[Operations Service] Status Code:', error.response.data.statusCode);
        console.error('[Operations Service] Error completo:', error.response.data);
        console.error('[Operations Service] ============================');
      }
      // No lanzar el error para no interrumpir el flujo de trading
      // Solo loguear el error
      return {
        success: false,
        error: error.message || 'Error al registrar operación',
        status: error.response?.status,
        details: error.response?.data
      };
    }
};

/**
 * Obtiene el historial de operaciones de un NFT
 * 
 * @param {string} nftId - ID del NFT (tokenId)
 * @returns {Promise<Array>} - Array de operaciones ordenadas por fecha
 */
export const getOperationsHistory = async (nftId) => {
  if (!nftId) {
    throw new Error('NFT ID es requerido para obtener el historial');
  }

  try {
    console.log('[Operations Service] Obteniendo historial para NFT:', nftId);

    const response = await jwtApiService.get(`/operations?nftId=${nftId}`);

    console.log('[Operations Service] Historial obtenido:', response);
    return response || [];
  } catch (error) {
    console.error('[Operations Service] Error obteniendo historial:', error);
    // Retornar array vacío en caso de error
    return [];
  }
};

/**
 * Registra una operación como exitosa
 * Helper para facilitar el uso
 */
export const registerSuccessfulOperation = async (nftId, operationData) => {
  return registerOperation(nftId, {
    ...operationData,
    status: 'success'
  });
};

/**
 * Registra una operación como fallida
 * Helper para facilitar el uso
 */
export const registerFailedOperation = async (nftId, operationData, errorMessage) => {
  return registerOperation(nftId, {
    ...operationData,
    status: 'failed',
    error: errorMessage
  });
};

/**
 * Registra una operación como pendiente (antes de ejecutarse)
 * Helper para facilitar el uso
 */
export const registerPendingOperation = async (nftId, operationData) => {
  return registerOperation(nftId, {
    ...operationData,
    status: 'pending'
  });
};

// Exportar servicio completo
export const operationsService = {
  registerOperation,
  getOperationsHistory,
  registerSuccessfulOperation,
  registerFailedOperation,
  registerPendingOperation,
  OperationSide
};

export default operationsService;

