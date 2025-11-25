import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../api/apiService.js';
import { useHyperliquidWebSocket } from './useHyperliquidWebSocket.js';

export const useOrderBook = (coinId, refreshInterval = 30000, useWebSocket = true) => {
  const [orderBook, setOrderBook] = useState({
    asks: [],
    bids: []
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isRealTime, setIsRealTime] = useState(false);

  const hasLoadedRef = useRef(false);
  const lastUpdateRef = useRef(0);

  // WebSocket connection
  const ws = useHyperliquidWebSocket({
    autoConnect: useWebSocket,
    log: false,
  });

  // Normalize symbol (remove /USDC if present)
  const normalizeSymbol = (symbol) => {
    if (!symbol) return '';
    return symbol.split('/')[0].toUpperCase();
  };

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

  // Handle WebSocket order book updates
  useEffect(() => {
    if (!useWebSocket || !coinId || !ws.isConnected) {
      setIsRealTime(false);
      return;
    }

    const coin = normalizeSymbol(coinId);
    
    const unsubscribe = ws.subscribeOrderBook(coin, (bookData) => {
      const now = Date.now();
      // Throttle updates to max 100ms
      if (now - lastUpdateRef.current < 100) return;
      lastUpdateRef.current = now;

      if (bookData && bookData.bids && bookData.asks) {
        setOrderBook({
          asks: bookData.asks,
          bids: bookData.bids
        });
        setIsRealTime(true);
        setLoading(false);
        setError(null);
        
        if (!hasLoadedRef.current) {
          hasLoadedRef.current = true;
        }
      }
    });

    return unsubscribe;
  }, [coinId, ws.isConnected, useWebSocket, ws]);

  // Fallback to REST API if WebSocket is not connected
  useEffect(() => {
    // If WebSocket is enabled and connected, don't use polling
    if (useWebSocket && ws.isConnected) {
      return;
    }

    // Initial load
    fetchOrderBook(true);

    // Setup polling only if WebSocket is not active
    if (refreshInterval > 0 && coinId) {
      const interval = setInterval(() => fetchOrderBook(false), refreshInterval);
      return () => clearInterval(interval);
    }
  }, [coinId, fetchOrderBook, refreshInterval, useWebSocket, ws.isConnected]);

  return {
    orderBook,
    loading,
    isRefreshing,
    error,
    isRealTime,
    refetch: () => fetchOrderBook(false)
  };
};

export default useOrderBook;

