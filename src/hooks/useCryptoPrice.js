/**
 * useCryptoPrice Hook
 * 
 * Hook para obtener el precio actual de una crypto con soporte para WebSocket
 * Cuando WebSocket está conectado, recibe precios en tiempo real desde allMids
 * Caso contrario, usa polling via REST API
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../api/apiService.js';
import { useHyperliquidWebSocket } from './useHyperliquidWebSocket.js';

/**
 * Hook para obtener precio de una crypto
 * @param {string} coinId - ID de la crypto (bitcoin, ethereum, etc)
 * @param {number} refreshInterval - Intervalo de actualización en ms (default: 60000 = 1 min)
 * @param {boolean} useWebSocket - Si debe usar WebSocket para datos en tiempo real
 * @returns {Object} { data, loading, error, isRealTime, refetch }
 */
export const useCryptoPrice = (coinId, refreshInterval = 60000, useWebSocket = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRealTime, setIsRealTime] = useState(false);

  const hasLoadedRef = useRef(false);

  // WebSocket connection
  const ws = useHyperliquidWebSocket({
    autoConnect: useWebSocket,
    log: false,
  });

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

  const fetchPrice = useCallback(async () => {
    if (!coinId) return;

    try {
      setError(null);
      const priceData = await apiService.fetchCryptoPrice(coinId);
      setData(priceData);
      setLoading(false);
      
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
      }
    } catch (err) {
      setError(err.message || 'Error al obtener el precio');
      console.error(`Error en useCryptoPrice(${coinId}):`, err);
      setLoading(false);
    }
  }, [coinId]);

  // Handle WebSocket allMids updates
  useEffect(() => {
    if (!useWebSocket || !coinId || !ws.isConnected) {
      setIsRealTime(false);
      return;
    }

    const symbol = normalizeSymbol(coinId);
    
    const unsubscribe = ws.subscribeAllMids((allMids) => {
      if (allMids && allMids[symbol]) {
        const price = parseFloat(allMids[symbol]);
        
        setData(prevData => ({
          ...prevData,
          id: coinId.toLowerCase(),
          symbol: symbol,
          price: price,
          lastUpdated: new Date().toISOString()
        }));
        
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

    // Fetch inicial
    fetchPrice();

    // Setup intervalo de actualización solo si WebSocket no está activo
    if (refreshInterval > 0) {
      const interval = setInterval(fetchPrice, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchPrice, refreshInterval, useWebSocket, ws.isConnected]);

  return {
    data,
    loading,
    error,
    isRealTime,
    refetch: fetchPrice
  };
};

export default useCryptoPrice;

