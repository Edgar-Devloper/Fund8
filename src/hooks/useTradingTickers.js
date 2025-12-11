import { useState, useEffect } from 'react';
import { apiService } from '../api/apiService';
import { hasLocalIcon } from '../utils/coinIcons';

export const useTradingTickers = (refreshInterval = 30000) => {
  const [tickers, setTickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllTickers = async () => {
    try {
      setError(null);
      
      // Obtener precios actuales y contexto de meta
      const [allMidsResponse, metaResponse] = await Promise.all([
        apiService.getAllMids(),
        apiService.getMetaAndAssetCtxs()
      ]);
      
      const allPrices = allMidsResponse.data || allMidsResponse;
      const metaData = metaResponse.data || metaResponse;
      
      let universe = [];
      let assetCtxs = [];
      
      if (Array.isArray(metaData)) {
        universe = Array.isArray(metaData[0]) ? metaData[0] : [];
        assetCtxs = Array.isArray(metaData[1]) 
          ? metaData[1] 
          : (typeof metaData[1] === 'object' ? Object.values(metaData[1]) : []);
      } else if (metaData && typeof metaData === 'object') {
        universe = Array.isArray(metaData.universe) ? metaData.universe : [];
        assetCtxs = Array.isArray(metaData.assetCtxs) 
          ? metaData.assetCtxs 
          : (typeof metaData.assetCtxs === 'object' ? Object.values(metaData.assetCtxs) : []);
      }
      
      const symbolToIndexMap = {};
      
      if (Array.isArray(universe) && universe.length > 0) {
        universe.forEach((coin, index) => {
          const coinName = coin?.name || coin;
          if (coinName) {
            symbolToIndexMap[coinName] = index;
            symbolToIndexMap[coinName.toUpperCase()] = index;
          }
        });
      } else {
        const allPricesKeys = Object.keys(allPrices || {})
          .filter(key => !key.startsWith('@') && !/^\d+$/.test(key));
        
        allPricesKeys.forEach((key, idx) => {
          if (idx < assetCtxs.length) {
            symbolToIndexMap[key] = idx;
            symbolToIndexMap[key.toUpperCase()] = idx;
          }
        });
      }
      
      // Obtener todos los símbolos disponibles dinámicamente
      let availableSymbols = [];
      
      if (Array.isArray(universe) && universe.length > 0) {
        availableSymbols = universe
          .map(coin => {
            return coin?.name || coin?.symbol || (typeof coin === 'string' ? coin : null);
          })
          .filter(Boolean)
          .filter(name => {
            const nameStr = String(name).toUpperCase();
            return !nameStr.startsWith('@') && 
                   !/^\d+$/.test(nameStr) &&
                   nameStr.length >= 2 && 
                   nameStr.length <= 10;
          })
          .map(s => s.toUpperCase());
        } else {
        availableSymbols = Object.keys(allPrices || {})
          .filter(key => {
            const upperKey = key.toUpperCase();
            return !upperKey.startsWith('@') && 
                   !/^\d+$/.test(upperKey) &&
                   upperKey.length >= 2 && 
                   upperKey.length <= 10 &&
                   /^[A-Z0-9]+$/.test(upperKey);
          })
          .map(key => key.toUpperCase());
      }
      
      const HYPERLIQUID_SYMBOLS = ['BTC', 'ETH', 'SOL', 'AVAX', 'MATIC', 'ATOM', 'LINK', 'UNI', 'AAVE'];
      if (availableSymbols.length === 0) {
        console.warn('[useTradingTickers] No symbols found from API, using hardcoded list');
        availableSymbols = HYPERLIQUID_SYMBOLS;
      }
      
      console.log('[useTradingTickers] Available symbols:', {
        fromUniverse: Array.isArray(universe) && universe.length > 0,
        universeLength: Array.isArray(universe) ? universe.length : 0,
        totalSymbols: availableSymbols.length,
        symbols: availableSymbols.slice(0, 30)
      });
      
      // Función helper para obtener stats de 24h
      const getLast24hStats = async (symbol) => {
        try {
          // Aquí puedes agregar lógica para obtener high/low 24h si la API lo soporta
          // Por ahora retornamos valores por defecto
          return { high24h: 0, low24h: 0 };
        } catch (err) {
          console.error(`Error getting 24h stats for ${symbol}:`, err);
          return { high24h: 0, low24h: 0 };
        }
      };
      
      const basicTickers = availableSymbols
        .filter(symbol => {
          const upperSymbol = String(symbol).toUpperCase().trim();
          const isValid = !upperSymbol.startsWith('@') && 
                         !/^\d+$/.test(upperSymbol) &&
                         upperSymbol.length >= 2 &&
                         upperSymbol.length <= 10 &&
                         /^[A-Z0-9]+$/.test(upperSymbol) &&
                         hasLocalIcon(upperSymbol);
          
          if (!isValid && symbol) {
            if (!hasLocalIcon(upperSymbol)) {
              console.log('[useTradingTickers] Filtered out (no local icon):', symbol);
            } else {
              console.log('[useTradingTickers] Filtered out (index or invalid):', symbol);
            }
          }
          return isValid;
        })
        .map((symbol) => {
          const coinId = symbol.toLowerCase();
          const pair = `${symbol}/USDC`;
          
          const currentPrice = parseFloat(
            allPrices[symbol] || 
            allPrices[coinId] || 
            allPrices[symbol.toLowerCase()] || 
            0
          );
          
          // Buscar contexto
          let ctx = {};
          let ctxIndex = symbolToIndexMap[symbol] ?? symbolToIndexMap[coinId] ?? -1;
          
          if (ctxIndex >= 0 && Array.isArray(assetCtxs) && assetCtxs[ctxIndex]) {
            ctx = assetCtxs[ctxIndex];
          } else if (currentPrice > 0 && Array.isArray(assetCtxs)) {
            let closestIndex = -1;
            let closestDiff = Infinity;
            
            assetCtxs.forEach((c, idx) => {
              const prevPx = parseFloat(c.prevDayPx || c.markPx || 0);
              if (prevPx > 0) {
                const diff = Math.abs(prevPx - currentPrice) / Math.max(prevPx, currentPrice);
                if (diff < 0.05 && diff < closestDiff) {
                  closestDiff = diff;
                  closestIndex = idx;
                }
              }
            });
            
            if (closestIndex >= 0) {
              ctxIndex = closestIndex;
              ctx = assetCtxs[closestIndex];
            }
          }
          
          const prevDayPx = parseFloat(ctx.prevDayPx || ctx.markPx || currentPrice || 0);
          const change24h = currentPrice - prevDayPx;
          const change24hPercent = prevDayPx > 0 
            ? ((change24h / prevDayPx) * 100) 
            : 0;
          
          // Obtener volumen y otros datos
          const volume24h = parseFloat(ctx.dayNtlVlm || 0);
          const fundingRate = parseFloat(ctx.funding || 0);
          
          return {
            symbol: pair,
            last: currentPrice,
            change24h: change24h,
            change24hPercent: change24hPercent,
            volume24h: volume24h,
            high24h: parseFloat(ctx.high24h || 0),
            low24h: parseFloat(ctx.low24h || 0),
            marketCap: 0,
            fundingRate: fundingRate
          };
        })
        .filter(ticker => ticker.last > 0); // Solo tickers con precio válido
      
      // Ordenar por precio descendente por defecto
      basicTickers.sort((a, b) => (b.last || 0) - (a.last || 0));
      
      setTickers(basicTickers);
      setLoading(false);
      
      console.log(`[useTradingTickers] Loaded ${basicTickers.length} tickers`);
    } catch (err) {
      console.error('[useTradingTickers] Error fetching tickers:', err);
      setError(err.message || 'Error al obtener datos de trading');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTickers();
    
    const interval = setInterval(() => {
      fetchAllTickers();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return {
    tickers,
    loading,
    error,
    refetch: fetchAllTickers
  };
};

