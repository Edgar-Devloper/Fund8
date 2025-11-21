/**
 * useRecentTrades Hook
 * 
 * Hook para obtener trades recientes de Hyperliquid
 */

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../api/apiService.js';

/**
 * Hook para obtener trades recientes de una crypto
 * @param {string} coinId - ID de la crypto (bitcoin, ethereum, etc)
 * @param {number} refreshInterval - Intervalo de actualización en ms (default: 10000 = 10s)
 * @returns {Object} { trades, loading, error, refetch }
 */
export const useRecentTrades = (coinId, refreshInterval = 10000) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrades = useCallback(async () => {
    if (!coinId) return;

    try {
      setError(null);
      console.log(`[Recent Trades] Fetching for ${coinId}...`);
      const tradesData = await apiService.fetchRecentTrades(coinId);
      
      console.log(`[Recent Trades] ${coinId}:`, tradesData.length, 'trades');
      
      setTrades(tradesData);
    } catch (err) {
      setError(err.message || 'Error al obtener trades recientes');
      console.error(`[Recent Trades] Error for ${coinId}:`, err);
    } finally {
      setLoading(false);
    }
  }, [coinId]);

  useEffect(() => {
    // Fetch inicial
    fetchTrades();

    // Setup intervalo de actualización (más frecuente para trades)
    if (refreshInterval > 0) {
      const interval = setInterval(fetchTrades, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchTrades, refreshInterval]);

  return {
    trades,
    loading,
    error,
    refetch: fetchTrades
  };
};

export default useRecentTrades;


