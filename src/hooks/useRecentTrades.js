/**
 * useRecentTrades Hook
 * 
 * Hook para obtener trades recientes de Hyperliquid con soporte para WebSocket
 * Cuando WebSocket está conectado, recibe trades en tiempo real
 * Caso contrario, usa polling via REST API
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../api/apiService.js';
import { useHyperliquidWebSocket } from './useHyperliquidWebSocket.js';

/**
 * Hook para obtener trades recientes de una crypto
 * @param {string} coinId - ID de la crypto (bitcoin, ethereum, etc)
 * @param {number} refreshInterval - Intervalo de actualización en ms (default: 10000 = 10s)
 * @param {boolean} useWebSocket - Si debe usar WebSocket para datos en tiempo real
 * @param {number} maxTrades - Número máximo de trades a mantener en el array
 * @returns {Object} { trades, loading, error, isRealTime, refetch }
 */
export const useRecentTrades = (coinId, refreshInterval = 10000, useWebSocket = true, maxTrades = 100) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRealTime, setIsRealTime] = useState(false);

  const hasLoadedRef = useRef(false);

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

  const fetchTrades = useCallback(async () => {
    if (!coinId) return;

    try {
      setError(null);
      const tradesData = await apiService.fetchRecentTrades(coinId);
      
      setTrades(tradesData);
      setLoading(false);
      
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
      }
    } catch (err) {
      setError(err.message || 'Error al obtener trades recientes');
      console.error(`[Recent Trades] Error for ${coinId}:`, err);
      setLoading(false);
    }
  }, [coinId]);

  // Handle WebSocket trade updates
  useEffect(() => {
    if (!useWebSocket || !coinId || !ws.isConnected) {
      setIsRealTime(false);
      return;
    }

    const coin = normalizeSymbol(coinId);
    
    const unsubscribe = ws.subscribeTrades(coin, (newTrade) => {
      setTrades(prevTrades => {
        // Ensure unique ID - if ID already exists, don't add duplicate
        const exists = prevTrades.some(t => t.id === newTrade.id);
        if (exists) {
          return prevTrades;
        }
        
        // Add new trade at the beginning and limit array size
        const updated = [newTrade, ...prevTrades].slice(0, maxTrades);
        return updated;
      });
      
      setIsRealTime(true);
      setLoading(false);
      setError(null);
      
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
      }
    });

    return unsubscribe;
  }, [coinId, ws.isConnected, useWebSocket, ws, maxTrades]);

  // Fallback to REST API if WebSocket is not connected
  useEffect(() => {
    // If WebSocket is enabled and connected, don't use polling
    if (useWebSocket && ws.isConnected) {
      return;
    }

    // Fetch inicial
    fetchTrades();

    // Setup intervalo de actualización solo si WebSocket no está activo
    if (refreshInterval > 0) {
      const interval = setInterval(fetchTrades, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchTrades, refreshInterval, useWebSocket, ws.isConnected]);

  return {
    trades,
    loading,
    error,
    isRealTime,
    refetch: fetchTrades
  };
};

export default useRecentTrades;


