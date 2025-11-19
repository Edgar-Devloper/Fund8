import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext.js';
import { apiService } from '../api/apiService.js';

export const useUserFills = (refreshInterval = 60000, limit = 100) => {
  const { address, isConnected } = useWallet();
  const [fills, setFills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserFills = useCallback(async () => {
    if (!isConnected || !address) {
      setFills([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const userFills = await apiService.fetchUserFills(address);
      // sort by timestamp descending (most recent first) and limit
      const sortedFills = userFills
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
      setFills(sortedFills);
      setLoading(false);
    } catch (err) {
      console.error('[useUserFills] Error:', err);
      setError(err.message || 'Error al obtener historial de trades');
      setLoading(false);
    }
  }, [address, isConnected, limit]);

  useEffect(() => {
    fetchUserFills();
    if (refreshInterval > 0 && isConnected && address) {
      const interval = setInterval(fetchUserFills, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [address, isConnected, fetchUserFills, refreshInterval]);

  return {
    fills,
    loading,
    error,
    refetch: fetchUserFills,
    isConnected
  };
};

export default useUserFills;

