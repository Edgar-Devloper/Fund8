import { useState, useEffect, useCallback } from 'react';
import { getMetaAndAssetCtxs } from '../api/apiService.js';

export const useMarketOverview = (refreshInterval = 30000) => {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMarketData = useCallback(async () => {
    try {
      setError(null);
      const response = await getMetaAndAssetCtxs();

      if (!Array.isArray(response) || response.length < 2) {
        throw new Error('Invalid response format from API');
      }

      const universeObj = response[0];
      const assetCtxs = response[1];

      const universe = universeObj?.universe || [];

      if (!Array.isArray(universe) || !Array.isArray(assetCtxs)) {
        throw new Error('Invalid response format from API');
      }

      const formattedData = universe
        .map((coin, index) => {
          const ctx = assetCtxs[index];

          if (!ctx) return null;

          const name = coin.name || `Coin-${index}`;
          // En Hyperliquid:
          // - markPx = precio actual
          // - prevDayPx = precio de hace 24h
          const markPx = parseFloat(ctx.markPx || '0');
          const prevDayPx = parseFloat(ctx.prevDayPx || '0');

          const lastPrice = markPx > 0 ? markPx : prevDayPx;

          // Cambio 24h en porcentaje basado en precios de Hyperliquid
          const change24h = prevDayPx > 0 && markPx > 0
            ? ((markPx - prevDayPx) / prevDayPx) * 100
            : 0;
          const volume24h = parseFloat(ctx.dayNtlVlm || '0');
          const openInterest = parseFloat(ctx.openInterest || '0');
          const fundingRate = ctx.funding ? parseFloat(ctx.funding) : 0;

          return {
            rank: index + 1,
            coin: name,
            symbol: name,
            lastPrice,
            change24h,
            volume24h,
            openInterest,
            fundingRate,
            priceHistory: [],
          };
        })
        .filter(asset => asset !== null && asset.lastPrice > 0)
        .sort((a, b) => b.volume24h - a.volume24h)
        .slice(0, 20);

      setMarketData(formattedData);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Error al obtener datos de mercado');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
    if (refreshInterval > 0) {
      const interval = setInterval(fetchMarketData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchMarketData, refreshInterval]);

  return { marketData, loading, error, refetch: fetchMarketData };
};

export default useMarketOverview;

