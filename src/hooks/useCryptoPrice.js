/**
 * useCryptoPrice Hook
 * 
 * Hook para obtener el precio actual de una crypto
 * Se actualiza automáticamente cada X segundos
 */

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../api/apiService.js';

/**
 * Hook para obtener precio de una crypto
 * @param {string} coinId - ID de la crypto (bitcoin, ethereum, etc)
 * @param {number} refreshInterval - Intervalo de actualización en ms (default: 60000 = 1 min)
 * @returns {Object} { data, loading, error, refetch }
 */
export const useCryptoPrice = (coinId, refreshInterval = 60000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrice = useCallback(async () => {
    if (!coinId) return;

    try {
      setError(null);
      const priceData = await apiService.fetchCryptoPrice(coinId);
      setData(priceData);
    } catch (err) {
      setError(err.message || 'Error al obtener el precio');
      console.error(`Error en useCryptoPrice(${coinId}):`, err);
    } finally {
      setLoading(false);
    }
  }, [coinId]);

  useEffect(() => {
    // Fetch inicial
    fetchPrice();

    // Setup intervalo de actualización
    if (refreshInterval > 0) {
      const interval = setInterval(fetchPrice, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchPrice, refreshInterval]);

  return {
    data,
    loading,
    error,
    refetch: fetchPrice
  };
};

export default useCryptoPrice;

