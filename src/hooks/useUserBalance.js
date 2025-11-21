import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext.js';
import { getClearinghouseState } from '../api/apiService.js';

export const useUserBalance = (refreshInterval = 30000) => {
  const { address } = useWallet();
  const [userState, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserState = useCallback(async () => {
    if (!address) {
      setUserState(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await getClearinghouseState(address);

      const responseData = data.data || data;
      const processedData = {
        address,
        marginSummary: responseData.marginSummary || {},
        withdrawable: responseData.withdrawable || '0',
        assetPositions: responseData.assetPositions || [],
        crossMarginSummary: responseData.crossMarginSummary || {},
        timestamp: Date.now()
      };

      setUserState(processedData);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Error al obtener datos del usuario');
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchUserState();
    if (refreshInterval > 0 && address) {
      const interval = setInterval(fetchUserState, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [address, fetchUserState, refreshInterval]);

  return {
    userState,
    loading,
    error,
    refetch: fetchUserState,
    isConnected: !!address
  };
};

export default useUserBalance;

