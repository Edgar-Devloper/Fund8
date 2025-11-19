import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { apiService } from '../api/apiService.js';

export const useMultipleRecentTrades = (coinIds = [], refreshInterval = 60000) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const coinIdsKey = useMemo(() => coinIds.join(','), [coinIds.join(',')]);
  const hasLoadedRef = useRef(false);

  const fetchAllTrades = useCallback(async (isInitialLoad = false) => {
    const coins = coinIdsKey.split(',').filter(c => c.length > 0);
    if (coins.length === 0) return;

    try {
      setError(null);
      if (isInitialLoad && !hasLoadedRef.current) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const promises = coins.map(coinId =>
        apiService.fetchRecentTrades(coinId).catch(() => [])
      );

      const results = await Promise.all(promises);
      const allTrades = results.flat();

      allTrades.sort((a, b) => b.timestamp - a.timestamp);

      setTrades(allTrades);
      setLoading(false);
      setIsRefreshing(false);

      if (isInitialLoad && !hasLoadedRef.current) {
        hasLoadedRef.current = true;
      }
    } catch (err) {
      setError(err.message || 'Error al obtener trades');
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [coinIdsKey]);

  useEffect(() => {
    fetchAllTrades(true);

    if (refreshInterval > 0 && coinIds.length > 0) {
      const interval = setInterval(() => fetchAllTrades(false), refreshInterval);
      return () => clearInterval(interval);
    }
  }, [coinIdsKey, fetchAllTrades, refreshInterval, coinIds.length]);

  return {
    trades,
    loading,
    isRefreshing,
    error,
    refetch: () => fetchAllTrades(false)
  };
};

export default useMultipleRecentTrades;

