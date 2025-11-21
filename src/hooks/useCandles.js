import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../api/apiService.js';

export const useCandles = (coinId, interval = '1h', limit = 200) => {
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const intervalMilliseconds = {
        '1m': 60 * 1000,
        '5m': 300 * 1000,
        '15m': 900 * 1000,
        '1h': 3600 * 1000,
        '4h': 14400 * 1000,
        '1d': 86400 * 1000
      }[interval] || 3600 * 1000;
      
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

  useEffect(() => {
    fetchCandles();
  }, [fetchCandles]);

  return {
    candles,
    loading,
    error,
    refetch: fetchCandles
  };
};

export default useCandles;

