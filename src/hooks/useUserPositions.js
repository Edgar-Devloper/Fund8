import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext.js';
import { getClearinghouseState } from '../api/apiService.js';

export const useUserPositions = (refreshInterval = 15000) => {
  const { address } = useWallet();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPositions = useCallback(async () => {
    if (!address) {
      setPositions([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await getClearinghouseState(address);
      const responseData = data.data || data;
      const assetPositions = responseData.assetPositions || [];

      const openPositions = assetPositions.filter((pos) => {
        const size = parseFloat(pos.position?.szi || 0);
        return size !== 0;
      });

      const formattedPositions = openPositions.map((pos) => ({
        coin: pos.position?.coin || 'Unknown',
        side: parseFloat(pos.position?.szi || 0) > 0 ? 'LONG' : 'SHORT',
        size: Math.abs(parseFloat(pos.position?.szi || 0)),
        entryPrice: parseFloat(pos.position?.entryPx || 0),
        markPrice: parseFloat(pos.position?.markPx || 0),
        unrealizedPnl: parseFloat(pos.position?.unrealizedPnl || 0),
        returnOnEquity: parseFloat(pos.position?.returnOnEquity || 0) * 100,
        leverage: parseFloat(pos.position?.leverage?.value || 0),
        liquidationPrice: parseFloat(pos.position?.liquidationPx || 0),
        marginUsed: parseFloat(pos.position?.marginUsed || 0),
      }));

      setPositions(formattedPositions);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Error al obtener posiciones');
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchPositions();
    if (refreshInterval > 0 && address) {
      const interval = setInterval(fetchPositions, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [address, fetchPositions, refreshInterval]);

  return {
    positions,
    loading,
    error,
    refetch: fetchPositions,
    isConnected: !!address,
    hasOpenPositions: positions.length > 0
  };
};

export default useUserPositions;

