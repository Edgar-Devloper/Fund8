import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useWallet } from '../../../../context/WalletContext.js';
import { apiService } from '../../../../api/apiService.js';
import { useOrderBook } from '../../../../hooks/useOrderBook.js';
import { useRecentTrades } from '../../../../hooks/useRecentTrades.js';
import { useCryptoPrice } from '../../../../hooks/useCryptoPrice.js';
import { useOpenOrders } from '../../../../hooks/useOpenOrders.js';
import { useHyperliquidWebSocket } from '../../../../hooks/useHyperliquidWebSocket.js';
import { useTradingTickers } from '../../../../hooks/useTradingTickers.js';
import hyperliquidTrading from '../../../../services/hyperliquidTrading.js';

const TradingDataContext = createContext(null);

// hyperliquid symbols mapping
const HYPERLIQUID_SYMBOLS = ['BTC', 'ETH', 'SOL', 'LTC', 'XMR', 'ADA', 'DOGE'];
const SYMBOL_TO_PAIR = {
  'BTC': 'BTC/USDC',
  'ETH': 'ETH/USDC',
  'SOL': 'SOL/USDC',
  'LTC': 'LTC/USDC',
  'XMR': 'XMR/USDC',
  'ADA': 'ADA/USDC',
  'DOGE': 'DOGE/USDC'
};

const pairToCoinId = (pair) => {
  const symbol = pair.split('/')[0];
  return symbol.toLowerCase();
};

export const HyperliquidTradingProvider = ({ children }) => {
  const { address, isConnected, signer, provider } = useWallet();
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDC');
  const [exchange, setExchange] = useState('hyperliquid');
  const [tradingInitialized, setTradingInitialized] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState(null);
  
  const coinId = useMemo(() => pairToCoinId(selectedSymbol), [selectedSymbol]);
  
  // Initialize trading service when wallet connects
  useEffect(() => {
    const initTrading = async () => {
      if (isConnected && provider && signer) {
        console.log('[HL Provider] Initializing trading service...', {
          isConnected,
          hasProvider: !!provider,
          hasSigner: !!signer,
          address: address
        });
        
        try {
          const success = await hyperliquidTrading.initialize(provider, signer);
          if (success) {
            setTradingInitialized(true);
            console.log('[HL Provider] Trading service initialized successfully');
          } else {
            console.error('[HL Provider] Trading service initialization failed');
            setTradingInitialized(false);
          }
        } catch (error) {
          console.error('[HL Provider] Error initializing trading service:', error);
          setTradingInitialized(false);
        }
      } else if (!isConnected && tradingInitialized) {
        console.log('[HL Provider] Wallet disconnected, cleaning up trading service...');
        hyperliquidTrading.disconnect();
        setTradingInitialized(false);
      } else if (isConnected && (!provider || !signer)) {
        // Wallet está conectada pero falta provider o signer
        console.warn('[HL Provider] Wallet connected but missing provider or signer');
        setTradingInitialized(false);
      }
    };

    initTrading();
  }, [isConnected, provider, signer, address, tradingInitialized]);
  
  // WebSocket connection for real-time data (disabled to avoid rate limits)
  const ws = useHyperliquidWebSocket({
    autoConnect: false, // Deshabilitado para evitar rate limits
    log: false,
  });
  
  // fetch real data from hyperliquid via REST API (WebSocket disabled)
  const { orderBook, loading: orderBookLoading, isRealTime: orderBookRealTime } = useOrderBook(coinId, 10000, false);
  const { trades: recentTrades, loading: tradesLoading, isRealTime: tradesRealTime } = useRecentTrades(coinId, 10000, false);
  const { data: priceData, loading: priceLoading, isRealTime: priceRealTime } = useCryptoPrice(coinId, 30000, false);
  const { openOrders, loading: openOrdersLoading } = useOpenOrders(60000);
  
  // handle empty order book
  const safeOrderBook = orderBook || { bids: [], asks: [] };
  
  const { tickers, loading: tickersLoading, error: tickersError } = useTradingTickers(120000);
  
  useEffect(() => {
    if (tickersError) {
      console.error('[HyperliquidTradingProvider] Tickers error:', tickersError);
    }
  }, [tickersError]);
  
  const [legacyTickers, setLegacyTickers] = useState([]);
  
  useEffect(() => {
    const fetchAllTickers = async () => {
      try {
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
          // Format: [universe, assetCtxs]
          universe = Array.isArray(metaData[0]) ? metaData[0] : [];
          assetCtxs = Array.isArray(metaData[1]) ? metaData[1] : (typeof metaData[1] === 'object' ? Object.values(metaData[1]) : []);
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
            // Mapear solo si el índice es válido
            if (idx < assetCtxs.length) {
              symbolToIndexMap[key] = idx;
              symbolToIndexMap[key.toUpperCase()] = idx;
            }
          });
        }
        
        const getLast24hStats = async (symbol) => {
          try {
            const endTime = Date.now();
            const startTime = endTime - (24 * 60 * 60 * 1000);
            
            const candlesResponse = await apiService.getCandles(symbol, '1h', startTime, endTime);
            const candles = candlesResponse.data || candlesResponse || [];
            
            if (Array.isArray(candles) && candles.length > 0) {
              let high24h = 0;
              let low24h = Infinity;
              
              candles.forEach(candle => {
                const high = parseFloat(candle[2] || candle.high || candle.h || 0);
                const low = parseFloat(candle[3] || candle.low || candle.l || 0);
                
                if (high > high24h) high24h = high;
                if (low < low24h && low > 0) low24h = low;
              });
              
              return {
                high24h: high24h > 0 ? high24h : 0,
                low24h: low24h !== Infinity ? low24h : 0
              };
            }
          } catch (err) {
            console.error(`Error getting 24h stats for ${symbol}:`, err);
          }
          return { high24h: 0, low24h: 0 };
        };
        
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
        
        if (availableSymbols.length === 0) {
          console.warn('[HyperliquidTradingProvider] No symbols found from API, using hardcoded list');
          availableSymbols = HYPERLIQUID_SYMBOLS;
        }
        
        const basicTickers = availableSymbols
          .filter(symbol => {
            const upperSymbol = String(symbol).toUpperCase().trim();
            const isValid = !upperSymbol.startsWith('@') && 
                           !/^\d+$/.test(upperSymbol) &&
                           upperSymbol.length >= 2 &&
                           upperSymbol.length <= 10 &&
                           /^[A-Z0-9]+$/.test(upperSymbol);
            
            if (!isValid) {
              console.log('[HyperliquidTradingProvider] Filtered out symbol (index or invalid):', symbol);
            }
            return isValid;
          })
          .map((symbol) => {
            const coinId = symbol.toLowerCase();
            const pair = SYMBOL_TO_PAIR[symbol] || `${symbol}/USDC`;
            
            const currentPrice = parseFloat(
              allPrices[symbol] || 
              allPrices[coinId] || 
              allPrices[symbol.toLowerCase()] || 
              0
            );
          
          // Try multiple ways to find the context
          let ctx = {};
          let ctxIndex = -1;
          
          // Method 1: Try direct symbol mapping from universe (if available)
          ctxIndex = symbolToIndexMap[symbol] ?? symbolToIndexMap[coinId] ?? -1;
          
          // Method 2: If not found and we have a current price, search by price match
          // This is the most reliable method when universe is empty
          if (ctxIndex < 0 && currentPrice > 0 && Array.isArray(assetCtxs)) {
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
            }
          }
          
          if (ctxIndex >= 0 && Array.isArray(assetCtxs) && assetCtxs[ctxIndex]) {
            ctx = assetCtxs[ctxIndex];
          }
          
          const prevDayPx = parseFloat(ctx.prevDayPx || ctx.markPx || 0);
          const change24h = prevDayPx > 0 ? currentPrice - prevDayPx : 0;
          const change24hPercent = prevDayPx > 0 ? ((change24h / prevDayPx) * 100) : 0;
          const volume24h = parseFloat(ctx.dayNtlVlm || 0);
          // Funding rate viene en ctx.funding como decimal (ej: 0.0001 = 0.01%)
          const fundingRate = parseFloat(ctx.funding || 0);
          
          console.log(`[Ticker ${symbol}]`, {
            currentPrice,
            prevDayPx,
            change24h: change24h.toFixed(2),
            change24hPercent: change24hPercent.toFixed(2) + '%',
            volume24h,
            fundingRate,
            ctxIndex,
            hasCtx: !!ctx.prevDayPx,
            allPricesHasSymbol: !!(allPrices[symbol]),
            ctxSample: ctxIndex >= 0 ? assetCtxs[ctxIndex] : null
          });
          
          return {
            symbol: pair,
            last: currentPrice,
            change24h: change24h,
            change24hPercent: change24hPercent,
            volume24h: volume24h,
            fundingRate: fundingRate,
            high24h: currentPrice,
            low24h: currentPrice,
            marketCap: currentPrice * 21000000
          };
        });
        
        setLegacyTickers(basicTickers);
      } catch (error) {
        console.error('[HyperliquidTradingProvider] Legacy ticker fetch error:', error);
      }
    };
  }, []);
  
  const formattedOrderBook = useMemo(() => {
    if (!safeOrderBook || (!safeOrderBook.bids && !safeOrderBook.asks)) {
      return { bids: [], asks: [] };
    }
    
    return {
      bids: (safeOrderBook.bids || []).slice(0, 20).map(bid => ({
        price: bid.price || 0,
        amount: bid.quantity || bid.size || 0
      })),
      asks: (safeOrderBook.asks || []).slice(0, 20).map(ask => ({
        price: ask.price || 0,
        amount: ask.quantity || ask.size || 0
      }))
    };
  }, [safeOrderBook]);
  
  // format trades data
  const formattedTrades = useMemo(() => {
    if (!recentTrades || !Array.isArray(recentTrades)) return [];
    
    return recentTrades.slice(0, 60).map(trade => ({
      id: trade.id || `${trade.symbol || coinId}-${trade.timestamp || Date.now()}`,
      symbol: selectedSymbol,
      side: trade.side || 'buy',
      price: trade.price || 0,
      amount: trade.quantity || trade.size || 0,
      ts: trade.timestamp || Date.now()
    }));
  }, [recentTrades, selectedSymbol, coinId]);
  
  const portfolio = useMemo(() => {
    if (!isConnected || !address) return [];
    
    // this would come from useUserBalance, but for now return empty
    return [];
  }, [isConnected, address]);
  
  // format open orders
  const formattedOpenOrders = useMemo(() => {
    if (!openOrders || !isConnected) return [];
    
    return openOrders.map(order => ({
      id: order.orderId || order.id,
      symbol: `${order.symbol}/USDC`,
      side: order.side,
      type: order.type?.toLowerCase() || 'limit',
      price: order.price,
      amount: order.amount,
      filled: order.filled || 0,
      status: 'open',
      createdAt: order.timestamp
    }));
  }, [openOrders, isConnected]);
  
  const placeOrder = useCallback(async (orderData) => {
    // Verificar que el servicio esté inicializado
    if (!tradingInitialized) {
      // Intentar reinicializar si la wallet está conectada
      if (isConnected && provider && signer) {
        console.log('[HL Provider] Trading service not initialized, attempting to initialize...');
        try {
          const success = await hyperliquidTrading.initialize(provider, signer);
          if (success) {
            setTradingInitialized(true);
            console.log('[HL Provider] Trading service initialized successfully');
          } else {
            throw new Error('Failed to initialize trading service. Please reconnect your wallet.');
          }
        } catch (error) {
          console.error('[HL Provider] Error initializing trading service:', error);
          throw new Error('Trading service not initialized. Please reconnect your wallet.');
        }
      } else {
        throw new Error('Trading service not initialized. Please connect your wallet.');
      }
    }
    
    const symbol = selectedSymbol.split('/')[0];
    const isBuy = orderData.side === 'buy';
    const size = orderData.size || orderData.amount;
    const price = orderData.price;
    const nftId = orderData.nftId;
    
    console.log('[HL Provider] Placing order:', {
      coin: symbol,
      isBuy,
      size,
      price,
      type: orderData.type,
      nftId: nftId || 'No NFT selected',
      tradingInitialized
    });
    
    let result;
    
    if (orderData.type === 'market') {
      result = await hyperliquidTrading.placeMarketOrder({
        coin: symbol,
        isBuy: isBuy,
        size: size,
        nftId: nftId
      });
    } else {
      result = await hyperliquidTrading.placeOrder({
        coin: symbol,
        isBuy: isBuy,
        price: price,
        size: size,
        orderType: 'limit',
        nftId: nftId
      });
    }
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to place order');
    }
    
    return result;
  }, [tradingInitialized, selectedSymbol, isConnected, provider, signer]);
  
  const cancelOrder = useCallback(async (orderId) => {
    if (!tradingInitialized) {
      throw new Error('Trading service not initialized');
    }
    
    const symbol = selectedSymbol.split('/')[0];
    return await hyperliquidTrading.cancelOrder({
      coin: symbol,
      orderId: orderId
    });
  }, [tradingInitialized, selectedSymbol]);
  
  const exchanges = [
    { id: 'hyperliquid', name: 'Hyperliquid', status: 'live' }
  ];
  
  const exchangeSymbols = {
    hyperliquid: tickers.map(t => t.symbol)
  };
  
  const value = useMemo(() => ({
    exchange,
    setExchange,
    exchanges,
    exchangeSymbols,
    selectedSymbol,
    setSelectedSymbol,
    tickers,
    orderBook: formattedOrderBook,
    trades: formattedTrades,
    portfolio,
    openOrders: formattedOpenOrders,
    loading: {
      orderBook: orderBookLoading,
      trades: tradesLoading,
      price: priceLoading,
      openOrders: openOrdersLoading
    },
    realTime: {
      orderBook: orderBookRealTime,
      trades: tradesRealTime,
      price: priceRealTime,
      websocket: ws.isConnected
    },
    placeOrder,
    cancelOrder,
    selectedPrice,
    setSelectedPrice,
    connectionStatus: isConnected ? 'connected' : 'disconnected',
    isConnected,
    tradingInitialized,
    websocket: ws
  }), [
    exchange,
    selectedSymbol,
    tickers,
    formattedOrderBook,
    formattedTrades,
    portfolio,
    formattedOpenOrders,
    orderBookLoading,
    tradesLoading,
    priceLoading,
    openOrdersLoading,
    orderBookRealTime,
    tradesRealTime,
    priceRealTime,
    placeOrder,
    cancelOrder,
    selectedPrice,
    setSelectedPrice,
    isConnected,
    tradingInitialized,
    exchanges,
    exchangeSymbols,
    ws
  ]);
  
  return (
    <TradingDataContext.Provider value={value}>
      {children}
    </TradingDataContext.Provider>
  );
};

export function useTradingData() {
  const ctx = useContext(TradingDataContext);
  if (!ctx) {
    throw new Error('useTradingData debe usarse dentro de <HyperliquidTradingProvider/>');
  }
  return ctx;
}

export default HyperliquidTradingProvider;

