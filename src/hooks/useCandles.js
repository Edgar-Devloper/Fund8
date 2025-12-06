import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../api/apiService.js';
import { useHyperliquidWebSocket } from './useHyperliquidWebSocket.js';

export const useCandles = (coinId, interval = '1h', limit = 200, useWebSocket = true) => {
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRealTime, setIsRealTime] = useState(false);
  
  const lastUpdateRef = useRef(0);
  const currentCandleRef = useRef(null);

  // WebSocket connection
  const ws = useHyperliquidWebSocket({
    autoConnect: useWebSocket,
    log: false,
  });

  const fetchCandles = useCallback(async () => {
    if (!coinId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      
      // calculate time range based on interval and limit
      // hyperliquid uses milliseconds for timestamps in candleSnapshot
      // Normalize interval (handle both '1D' and '1d', '1W' and '1w')
      const normalizedInterval = interval.toLowerCase();
      const intervalMilliseconds = {
        '1m': 60 * 1000,
        '5m': 300 * 1000,
        '15m': 900 * 1000,
        '1h': 3600 * 1000,
        '4h': 14400 * 1000,
        '1d': 86400 * 1000,
        '1w': 604800 * 1000
      }[normalizedInterval] || 3600 * 1000;
      
      const endTime = Date.now(); // milliseconds
      const startTime = endTime - (limit * intervalMilliseconds);
      
      const symbol = coinId.toUpperCase();
      const response = await apiService.fetchCandles(symbol, interval, startTime, endTime);
      
      // format candles for lightweight-charts
      // hyperliquid returns array of [time, open, high, low, close, ...] arrays
      let candlesData = response.data || response || [];
      let formattedCandles = [];
      
      // if response is array of arrays (hyperliquid format)
      if (Array.isArray(candlesData) && candlesData.length > 0 && Array.isArray(candlesData[0])) {
        formattedCandles = candlesData.map(candle => {
          // Convert timestamp from milliseconds to seconds for lightweight-charts
          let timestamp = candle[0];
          // If timestamp is in milliseconds (> year 2000 in seconds), convert to seconds
          if (timestamp > 946684800000) { // year 2000 in milliseconds
            timestamp = Math.floor(timestamp / 1000);
          }
          return {
            time: timestamp, // timestamp in seconds
            open: parseFloat(candle[1] || 0),
            high: parseFloat(candle[2] || 0),
            low: parseFloat(candle[3] || 0),
            close: parseFloat(candle[4] || 0)
          };
        }).filter(c => c.time && c.open > 0 && c.high > 0 && c.low > 0 && c.close > 0);
      } else {
        // if response is array of objects
        formattedCandles = candlesData.map(candle => {
          let time = candle.time || candle.t || candle[0];
          // Convert timestamp from milliseconds to seconds for lightweight-charts
          if (typeof time === 'number' && time > 946684800000) { // year 2000 in milliseconds
            time = Math.floor(time / 1000);
          }
          return {
            time: time,
            open: parseFloat(candle.open || candle.o || candle[1] || 0),
            high: parseFloat(candle.high || candle.h || candle[2] || 0),
            low: parseFloat(candle.low || candle.l || candle[3] || 0),
            close: parseFloat(candle.close || candle.c || candle[4] || 0)
          };
        }).filter(c => c.time && c.open > 0 && c.high > 0 && c.low > 0 && c.close > 0);
      }
      
      setCandles(formattedCandles);
    } catch (err) {
      setError(err.message || 'Error al obtener velas');
      console.error('[useCandles] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [coinId, interval, limit]);

  // Normalize symbol (bitcoin -> BTC, ethereum -> ETH, etc)
  const normalizeSymbol = (symbol) => {
    if (!symbol) return '';
    const symbolMap = {
      bitcoin: 'BTC',
      btc: 'BTC',
      ethereum: 'ETH',
      eth: 'ETH',
      litecoin: 'LTC',
      ltc: 'LTC',
      solana: 'SOL',
      sol: 'SOL',
      monero: 'XMR',
      xmr: 'XMR',
      cardano: 'ADA',
      ada: 'ADA',
      dogecoin: 'DOGE',
      doge: 'DOGE',
    };
    return symbolMap[symbol.toLowerCase()] || symbol.toUpperCase();
  };

  // Get interval in seconds
  const getIntervalSeconds = (interval) => {
    // Normalize interval (handle both '1D' and '1d', '1W' and '1w')
    const normalizedInterval = interval.toLowerCase();
    const intervalSeconds = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '1h': 3600,
      '4h': 14400,
      '1d': 86400,
      '1w': 604800
    };
    return intervalSeconds[normalizedInterval] || 3600;
  };

  // Update current candle with real-time price from WebSocket
  useEffect(() => {
    if (!useWebSocket || !coinId || !ws.isConnected || candles.length === 0) {
      setIsRealTime(false);
      return;
    }

    const symbol = normalizeSymbol(coinId);
    const intervalSec = getIntervalSeconds(interval);
    
    const unsubscribe = ws.subscribeAllMids((allMids) => {
      if (!allMids || !allMids[symbol]) return;
      
      const now = Date.now();
      // Throttle updates to max 500ms
      if (now - lastUpdateRef.current < 500) return;
      lastUpdateRef.current = now;

      const currentPrice = parseFloat(allMids[symbol]);
      if (!currentPrice || currentPrice <= 0) return;

      setCandles(prevCandles => {
        if (!prevCandles || prevCandles.length === 0) return prevCandles;

        // Get the last candle
        const lastCandle = prevCandles[prevCandles.length - 1];
        if (!lastCandle) return prevCandles;

        // Calculate current candle timestamp (aligned to interval)
        const currentTime = Math.floor(Date.now() / 1000);
        const currentCandleTime = Math.floor(currentTime / intervalSec) * intervalSec;

        // Check if we need to create a new candle or update the existing one
        if (lastCandle.time === currentCandleTime) {
          // Update existing candle
          const updatedCandle = {
            ...lastCandle,
            high: Math.max(lastCandle.high, currentPrice),
            low: Math.min(lastCandle.low, currentPrice),
            close: currentPrice
          };

          return [
            ...prevCandles.slice(0, -1),
            updatedCandle
          ];
        } else if (currentCandleTime > lastCandle.time) {
          // Create new candle
          const newCandle = {
            time: currentCandleTime,
            open: currentPrice,
            high: currentPrice,
            low: currentPrice,
            close: currentPrice
          };

          // Add new candle and keep array size limited
          return [
            ...prevCandles,
            newCandle
          ].slice(-limit);
        }

        return prevCandles;
      });

      setIsRealTime(true);
    });

    return unsubscribe;
  }, [coinId, interval, ws.isConnected, useWebSocket, ws, candles.length, limit]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    // Initial fetch
    fetchCandles();

    // Refresh more frequently for better real-time feeling
    // 1 minute for 1m/5m intervals, 2 minutes for others
    let refreshInterval;
    if (interval === '1m' || interval === '5m') {
      refreshInterval = 60 * 1000; // 1 minute
    } else {
      refreshInterval = 2 * 60 * 1000; // 2 minutes
    }
    
    const intervalId = setInterval(fetchCandles, refreshInterval);

    return () => clearInterval(intervalId);
  }, [fetchCandles, interval]);

  return {
    candles,
    loading,
    error,
    isRealTime,
    refetch: fetchCandles
  };
};

export default useCandles;

