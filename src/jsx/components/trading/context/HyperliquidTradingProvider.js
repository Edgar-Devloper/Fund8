import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useWallet } from '../../../../context/WalletContext.js';
import { apiService } from '../../../../api/apiService.js';
import { useOrderBook } from '../../../../hooks/useOrderBook.js';
import { useRecentTrades } from '../../../../hooks/useRecentTrades.js';
import { useCryptoPrice } from '../../../../hooks/useCryptoPrice.js';
import { useOpenOrders } from '../../../../hooks/useOpenOrders.js';

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
  
  // fetch real data from hyperliquid
  const { orderBook, loading: orderBookLoading } = useOrderBook(coinId, 30000);
  const { trades: recentTrades, loading: tradesLoading } = useRecentTrades(coinId, 30000);
  const { data: priceData, loading: priceLoading } = useCryptoPrice(coinId);
  const { openOrders, loading: openOrdersLoading } = useOpenOrders(30000);
  
  // handle empty order book
  const safeOrderBook = orderBook || { bids: [], asks: [] };
  
  // format tickers from available symbols
  const [tickers, setTickers] = useState([]);
  
  useEffect(() => {
    // fetch prices for all hyperliquid symbols
    const fetchAllTickers = async () => {
      try {
        const allPrices = await apiService.fetchMultipleCryptoPrices(
          HYPERLIQUID_SYMBOLS.map(s => s.toLowerCase())
        );
        
        const formattedTickers = HYPERLIQUID_SYMBOLS.map(symbol => {
          const coinId = symbol.toLowerCase();
          const priceData = allPrices[coinId];
          const pair = SYMBOL_TO_PAIR[symbol];
          
          return {
            symbol: pair,
            last: priceData?.price || 0,
            change24h: priceData?.change24h || 0,
            volume24h: 0 // would need metaAndAssetCtxs for this
          };
        });
        
        setTickers(formattedTickers);
      } catch (error) {
        console.error('[HyperliquidTradingProvider] Error fetching tickers:', error);
      }
    };
    
    fetchAllTickers();
    const interval = setInterval(fetchAllTickers, 60000); // update every minute
    return () => clearInterval(interval);
  }, []);
  
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
    placeOrder,
    cancelOrder,
    connectionStatus: isConnected ? 'connected' : 'disconnected',
    isConnected
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
    placeOrder,
    cancelOrder,
    isConnected,
    exchanges,
    exchangeSymbols
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

