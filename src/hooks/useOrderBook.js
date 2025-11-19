import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../api/apiService.js';

export const useOrderBook = (coinId, refreshInterval = 30000) => {
  const [orderBook, setOrderBook] = useState({
    asks: [],
    bids: []
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const hasLoadedRef = useRef(false);

  const fetchOrderBook = useCallback(async (isInitialLoad = false) => {
    if (!coinId) return;

    try {
      setError(null);
      if (isInitialLoad && !hasLoadedRef.current) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const bookData = await apiService.fetchOrderBook(coinId);

      if (isInitialLoad && !hasLoadedRef.current) {
        hasLoadedRef.current = true;
      }

      setOrderBook(bookData);
      setLoading(false);
      setIsRefreshing(false);
    } catch (err) {
      setError(err.message || 'Error al obtener order book');
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [coinId]);

  useEffect(() => {
    fetchOrderBook(true);

    if (refreshInterval > 0 && coinId) {
      const interval = setInterval(() => fetchOrderBook(false), refreshInterval);
      return () => clearInterval(interval);
    }
  }, [coinId, fetchOrderBook, refreshInterval]);

  return {
    orderBook,
    loading,
    isRefreshing,
    error,
    refetch: () => fetchOrderBook(false)
  };
};

export default useOrderBook;

