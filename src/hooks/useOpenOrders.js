import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext.js';
import { apiService } from '../api/apiService.js';

export const useOpenOrders = (refreshInterval = 30000) => {
  const { address, isConnected } = useWallet();
  const [openOrders, setOpenOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOpenOrders = useCallback(async () => {
    if (!isConnected || !address) {
      setOpenOrders([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const orders = await apiService.fetchOpenOrders(address);
      setOpenOrders(orders);
      setLoading(false);
    } catch (err) {
      console.error('[useOpenOrders] Error:', err);
      setError(err.message || 'Error al obtener órdenes abiertas');
      setLoading(false);
    }
  }, [address, isConnected]);

  useEffect(() => {
    fetchOpenOrders();
    if (refreshInterval > 0 && isConnected && address) {
      const interval = setInterval(fetchOpenOrders, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [address, isConnected, fetchOpenOrders, refreshInterval]);

  return {
    openOrders,
    loading,
    error,
    refetch: fetchOpenOrders,
    isConnected
  };
};

export default useOpenOrders;






