import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../api/apiService.js';

export const useDashboardPrices = (refreshInterval = 60000) => {
  const [prices, setPrices] = useState({
    bitcoin: null,
    ethereum: null,
    litecoin: null,
    solana: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrices = useCallback(async () => {
    try {
      setError(null);
      const data = await apiService.fetchDashboardPrices();
      setPrices(data);
    } catch (err) {
      setError(err.message || 'Error al obtener precios del dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    if (refreshInterval > 0) {
      const interval = setInterval(fetchPrices, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchPrices, refreshInterval]);

  return {
    prices,
    loading,
    error,
    refetch: fetchPrices
  };
};

export default useDashboardPrices;

