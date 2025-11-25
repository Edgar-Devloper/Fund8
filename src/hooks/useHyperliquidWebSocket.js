import { useEffect, useRef, useCallback, useState } from 'react';
import { HyperliquidWSClient } from '../jsx/components/trading/hyperliquid/wsClient';

/**
 * Hook to manage HyperLiquid WebSocket connections
 * Provides real-time data for prices, orderbook, trades, candles, and user events
 * 
 * @param {Object} options Configuration options
 * @param {boolean} options.autoConnect Auto-connect on mount (default: true)
 * @param {boolean} options.log Enable debug logging (default: false)
 * @returns {Object} WebSocket connection utilities and status
 */
export const useHyperliquidWebSocket = (options = {}) => {
  const {
    autoConnect = true,
    log = false,
  } = options;

  const clientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState(null);

  // Store callbacks in refs to avoid recreating the client on every render
  const callbacksRef = useRef({
    onTrade: null,
    onCandle: null,
    onOrderBook: null,
    onAllMids: null,
    onUserEvents: null,
    onError: null,
  });

  // Initialize WebSocket client
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = new HyperliquidWSClient({
        onTrade: (trade) => callbacksRef.current.onTrade?.(trade),
        onCandle: (candle) => callbacksRef.current.onCandle?.(candle),
        onOrderBook: (book) => callbacksRef.current.onOrderBook?.(book),
        onAllMids: (mids) => callbacksRef.current.onAllMids?.(mids),
        onUserEvents: (events) => callbacksRef.current.onUserEvents?.(events),
        onError: (error) => {
          setLastError(error);
          callbacksRef.current.onError?.(error);
        },
        log,
      });

      if (autoConnect) {
        clientRef.current.connect();
      }
    }

    // Monitor connection status
    const checkConnection = setInterval(() => {
      if (clientRef.current) {
        setIsConnected(clientRef.current.isConnected());
      }
    }, 1000);

    return () => {
      clearInterval(checkConnection);
      if (clientRef.current) {
        clientRef.current.close();
        clientRef.current = null;
      }
    };
  }, [autoConnect, log]);

  // Subscribe to all price updates
  const subscribeAllMids = useCallback((callback) => {
    callbacksRef.current.onAllMids = callback;
    
    if (clientRef.current) {
      clientRef.current.subscribe({ type: 'allMids' });
    }

    return () => {
      callbacksRef.current.onAllMids = null;
      if (clientRef.current) {
        clientRef.current.unsubscribe({ type: 'allMids' });
      }
    };
  }, []);

  // Subscribe to trades for a specific coin
  const subscribeTrades = useCallback((coin, callback) => {
    if (!coin) return () => {};

    callbacksRef.current.onTrade = callback;
    
    if (clientRef.current) {
      clientRef.current.subscribe({ type: 'trades', coin });
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.unsubscribe({ type: 'trades', coin });
      }
    };
  }, []);

  // Subscribe to order book for a specific coin
  const subscribeOrderBook = useCallback((coin, callback) => {
    if (!coin) return () => {};

    callbacksRef.current.onOrderBook = callback;
    
    if (clientRef.current) {
      clientRef.current.subscribe({ type: 'l2Book', coin });
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.unsubscribe({ type: 'l2Book', coin });
      }
    };
  }, []);

  // Subscribe to candles for a specific coin and interval
  const subscribeCandles = useCallback((coin, interval = '1m', callback) => {
    if (!coin) return () => {};

    callbacksRef.current.onCandle = callback;
    
    if (clientRef.current) {
      clientRef.current.subscribe({ type: 'candle', coin, interval });
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.unsubscribe({ type: 'candle', coin, interval });
      }
    };
  }, []);

  // Subscribe to user events (fills, orders, etc.)
  const subscribeUserEvents = useCallback((user, callback) => {
    if (!user) return () => {};

    callbacksRef.current.onUserEvents = callback;
    
    if (clientRef.current) {
      clientRef.current.subscribe({ type: 'user', user });
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.unsubscribe({ type: 'user', user });
      }
    };
  }, []);

  // Connect manually
  const connect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.connect();
    }
  }, []);

  // Disconnect manually
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.close();
    }
  }, []);

  // Set error callback
  const onError = useCallback((callback) => {
    callbacksRef.current.onError = callback;
  }, []);

  return {
    isConnected,
    lastError,
    connect,
    disconnect,
    subscribeAllMids,
    subscribeTrades,
    subscribeOrderBook,
    subscribeCandles,
    subscribeUserEvents,
    onError,
  };
};

export default useHyperliquidWebSocket;

