/**
 * useHistoricalData Hook
 * 
 * Hook para obtener datos históricos de precios (para gráficos)
 */

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../api/apiService.js';

/**
 * Hook para obtener datos históricos
 * @param {string} coinId - ID de la crypto
 * @param {number} days - Días de historia (1, 7, 14, 30, etc)
 * @returns {Object} { data, loading, error, refetch }
 */
export const useHistoricalData = (coinId, days = 7) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!coinId) return;

    try {
      setLoading(true);
      setError(null);
      const historicalData = await apiService.fetchHistoricalData(coinId, days);
      setData(historicalData);
    } catch (err) {
      setError(err.message || 'Error al obtener datos históricos');
      console.error(`Error en useHistoricalData(${coinId}, ${days}):`, err);
    } finally {
      setLoading(false);
    }
  }, [coinId, days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

export default useHistoricalData;

