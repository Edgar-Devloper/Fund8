import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useWallet } from '../../../../context/WalletContext.js';
import { apiService } from '../../../../api/apiService.js';
import { useOrderBook } from '../../../../hooks/useOrderBook.js';
import { useRecentTrades } from '../../../../hooks/useRecentTrades.js';
import { useCryptoPrice } from '../../../../hooks/useCryptoPrice.js';
import { useOpenOrders } from '../../../../hooks/useOpenOrders.js';
import { useHyperliquidWebSocket } from '../../../../hooks/useHyperliquidWebSocket.js';

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
  const { address, isConnected, signer } = useWallet();
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDC');
  const [exchange, setExchange] = useState('hyperliquid');
  
  const coinId = useMemo(() => pairToCoinId(selectedSymbol), [selectedSymbol]);
  
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
  
  // format tickers from available symbols
  const [tickers, setTickers] = useState([]);
  
  useEffect(() => {
    // fetch prices and 24h stats for all hyperliquid symbols
    const fetchAllTickers = async () => {
      try {
        // Obtener precios actuales y contexto de meta
        const [allMidsResponse, metaResponse] = await Promise.all([
          apiService.getAllMids(),
          apiService.getMetaAndAssetCtxs()
        ]);
        
        const allPrices = allMidsResponse.data || allMidsResponse;
        const metaData = metaResponse.data || metaResponse;
        
        // Parse metaAndAssetCtxs correctly
        let assetCtxs = {};
        if (Array.isArray(metaData)) {
          // Format: [universe, assetCtxs]
          assetCtxs = metaData[1] || {};
        } else if (metaData?.assetCtxs) {
          assetCtxs = metaData.assetCtxs;
        }
        
        // console.log('[HyperliquidTradingProvider] assetCtxs:', assetCtxs);
        
        // Para high/low 24h, usamos candles de últimas 24h
        const getLast24hStats = async (symbol) => {
          try {
            const endTime = Date.now();
            const startTime = endTime - (24 * 60 * 60 * 1000); // 24 horas atrás
            
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
        
        // Formatear tickers - primero datos básicos rápidamente
        const basicTickers = HYPERLIQUID_SYMBOLS.map((symbol) => {
          const coinId = symbol.toLowerCase();
          const pair = SYMBOL_TO_PAIR[symbol];
          
          const currentPrice = parseFloat(allPrices[symbol] || 0);
          const ctx = assetCtxs[symbol] || {};
          const prevDayPx = parseFloat(ctx.prevDayPx || 0);
          const change24h = prevDayPx > 0 ? currentPrice - prevDayPx : 0;
          const volume24h = parseFloat(ctx.dayNtlVlm || 0);
          
          // console.log(`[Ticker ${symbol}] price: ${currentPrice}, prevDay: ${prevDayPx}, change: ${change24h}, ctx:`, ctx);
          
          return {
            symbol: pair,
            last: currentPrice,
            change24h: change24h,
            change24hPercent: prevDayPx > 0 ? ((change24h / prevDayPx) * 100) : 0,
            volume24h: volume24h,
            high24h: currentPrice, // temporal
            low24h: currentPrice, // temporal
            marketCap: currentPrice * 21000000 // Estimado para BTC, ajustar por coin
          };
        });
        
        // Actualizar inmediatamente con datos básicos
        setTickers(basicTickers);
        
        // Luego obtener high/low de candles en background (solo para símbolo actual)
        const currentSymbol = selectedSymbol.split('/')[0];
        if (HYPERLIQUID_SYMBOLS.includes(currentSymbol)) {
          const { high24h, low24h } = await getLast24hStats(currentSymbol);
          
          // Actualizar solo el símbolo actual con high/low
          setTickers(prev => prev.map(ticker => 
            ticker.symbol.startsWith(currentSymbol) 
              ? { ...ticker, high24h: high24h || ticker.last, low24h: low24h || ticker.last }
              : ticker
          ));
        }
      } catch (error) {
        console.error('[HyperliquidTradingProvider] Error fetching tickers:', error);
      }
    };
    
    fetchAllTickers();
    const interval = setInterval(fetchAllTickers, 120000); // update every 2 minutes
    return () => clearInterval(interval);
  }, [selectedSymbol]); // Re-fetch cuando cambia el símbolo seleccionado
  
  // format order book data
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
  
  // format portfolio (from user balance)
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
  
  // place order function
  const placeOrder = useCallback(async (orderData) => {
    if (!signer) {
      throw new Error('Wallet no conectada');
    }
    
    const symbol = selectedSymbol.split('/')[0];
    return await apiService.placeOrder(signer, {
      coin: symbol,
      side: orderData.side,
      size: orderData.size || orderData.amount,
      price: orderData.price,
      orderType: orderData.type === 'market' ? 'Market' : 'Limit',
      reduceOnly: orderData.reduceOnly || false
    });
  }, [signer, selectedSymbol]);
  
  // cancel order function
  const cancelOrder = useCallback(async (orderId) => {
    if (!signer) {
      throw new Error('Wallet no conectada');
    }
    return await apiService.cancelOrder(signer, orderId);
  }, [signer]);
  
  const exchanges = [
    { id: 'hyperliquid', name: 'Hyperliquid', status: 'live' }
  ];
  
  const exchangeSymbols = {
    hyperliquid: HYPERLIQUID_SYMBOLS.map(s => SYMBOL_TO_PAIR[s])
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
    connectionStatus: isConnected ? 'connected' : 'disconnected',
    isConnected,
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
    isConnected,
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

