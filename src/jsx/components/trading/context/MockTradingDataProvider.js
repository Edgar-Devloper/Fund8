import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { fetchMarkets, fetchCandles } from '../hyperliquid/api';
import { HyperliquidWSClient } from '../hyperliquid/wsClient';

/**
 * MockTradingDataProvider
 * Provee datos simulados para los componentes de trading antes de integrar backend real.
 * Los datos se actualizan con intervalos para emular flujo en tiempo real.
 */
const TradingDataContext = createContext(null);

function randomFloat(min, max, decimals = 2) {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

function genInitialTickers() {
  const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'XRP/USDT'];
  return pairs.map(p => ({
    symbol: p,
    last: randomFloat(10, 60000, 2),
    change24h: randomFloat(-10, 10, 2),
    volume24h: randomFloat(1000, 500000, 0)
  }));
}

function genOrderBook(basePrice) {
  const bids = [];
  const asks = [];
  for (let i = 0; i < 15; i++) {
    bids.push({ price: parseFloat((basePrice - i * Math.random() * 5).toFixed(2)), amount: randomFloat(0.01, 5, 4) });
    asks.push({ price: parseFloat((basePrice + i * Math.random() * 5).toFixed(2)), amount: randomFloat(0.01, 5, 4) });
  }
  return { bids, asks };
}

function genTrades(symbol, basePrice) {
  return Array.from({ length: 30 }, () => ({
    id: Math.random().toString(36).slice(2),
    symbol,
    side: Math.random() > 0.5 ? 'buy' : 'sell',
    price: randomFloat(basePrice * 0.98, basePrice * 1.02, 2),
    amount: randomFloat(0.001, 1, 4),
    ts: Date.now() - Math.floor(Math.random() * 3600_000)
  }));
}

function genPortfolio() {
  const assets = ['USDT', 'BTC', 'ETH', 'SOL', 'ADA'];
  return assets.map(a => ({
    asset: a,
    free: randomFloat(0.0, 50, 6),
    locked: randomFloat(0.0, 10, 6)
  }));
}

function genOpenOrders(symbol) {
  return Array.from({ length: 8 }, (_, i) => ({
    id: 'ORD-' + (1000 + i),
    symbol,
    side: Math.random() > 0.5 ? 'buy' : 'sell',
    type: 'limit',
    price: randomFloat(100, 60000, 2),
    amount: randomFloat(0.001, 2, 4),
    filled: randomFloat(0, 100, 2),
    status: 'open',
    createdAt: Date.now() - (i * 60000)
  }));
}

export const MockTradingDataProvider = ({ children }) => {
  // Exchange management (multi-exchange scaffolding)
  const exchanges = useRef([
    { id: 'mock', name: 'Mock', status: 'dev' },
    { id: 'hyperliquid', name: 'Hyperliquid', status: 'live' },
    { id: 'binance', name: 'Binance', status: 'soon' }
  ]).current;
  const [exchange, setExchange] = useState('mock');

  // Symbols per exchange (placeholder lists; real lists vendrán de APIs)
  const exchangeSymbols = useMemo(() => ({
    mock: ['BTC/USDT','ETH/USDT','SOL/USDT','ADA/USDT','XRP/USDT'],
    hyperliquid: ['BTC/USDC','ETH/USDC','SOL/USDC','HYPE/USDC'], // ejemplo basado en UI Hyperliquid
    binance: ['BTC/USDT','ETH/USDT','BNB/USDT','SOL/USDT']
  }), []);

  const initialTickers = useMemo(() => genInitialTickers(), []);
  const [selectedSymbol, setSelectedSymbol] = useState(initialTickers[0].symbol);
  const [tickers, setTickers] = useState(initialTickers);
  const baseTicker = tickers.find(t => t.symbol === selectedSymbol) || tickers[0];
  const [orderBook, setOrderBook] = useState(() => genOrderBook(baseTicker.last));
  const [trades, setTrades] = useState(() => genTrades(selectedSymbol, baseTicker.last));
  const [portfolio] = useState(genPortfolio());
  const [openOrders, setOpenOrders] = useState(() => genOpenOrders(selectedSymbol));
  const tradesRef = useRef(trades);

  // Simular cambios de ticker cada 3s (solo mientras exchange = mock)
  useEffect(() => {
    if (exchange !== 'mock') return; // para hyperliquid/binance se reemplazará por feed real
    const id = setInterval(() => {
      setTickers(prev => prev.map(t => {
        const drift = 1 + (Math.random() - 0.5) * 0.01; // +-0.5%
        const last = Math.max(0.01, t.last * drift);
        const change24h = t.change24h + (Math.random() - 0.5) * 0.2;
        return { ...t, last: parseFloat(last.toFixed(2)), change24h: parseFloat(change24h.toFixed(2)) };
      }));
    }, 3000);
    return () => clearInterval(id);
  }, [exchange]);

  // Actualizar orderBook y trades cuando cambia symbol o exchange
  useEffect(() => {
    // Si luego agregamos Hyperliquid: aquí disparar fetch inicial + suscripciones
    if (exchange === 'mock') {
      const currentTicker = tickers.find(t => t.symbol === selectedSymbol) || { last: randomFloat(10, 60000) };
      setOrderBook(genOrderBook(currentTicker.last));
      const newTrades = genTrades(selectedSymbol, currentTicker.last);
      setTrades(newTrades);
      tradesRef.current = newTrades;
      setOpenOrders(genOpenOrders(selectedSymbol));
    } else if (exchange === 'hyperliquid') {
      // Placeholder: reutilizamos datos mock hasta integrar feed real
      const currentTicker = tickers.find(t => t.symbol === selectedSymbol) || { last: randomFloat(10, 60000) };
      setOrderBook(genOrderBook(currentTicker.last));
      setTrades(genTrades(selectedSymbol, currentTicker.last));
    } else {
      // Otros exchanges futuros
    }
  }, [selectedSymbol, tickers, exchange]);

  // Simular llegada de trades cada 2s (solo mock). Para hyperliquid se reemplazará por stream WS.
  useEffect(() => {
    if (exchange !== 'mock') return;
    const id = setInterval(() => {
      const currentTicker = tickers.find(t => t.symbol === selectedSymbol) || { last: randomFloat(10, 60000) };
      const newTrade = {
        id: Math.random().toString(36).slice(2),
        symbol: selectedSymbol,
        side: Math.random() > 0.5 ? 'buy' : 'sell',
        price: randomFloat(currentTicker.last * 0.99, currentTicker.last * 1.01, 2),
        amount: randomFloat(0.001, 0.5, 4),
        ts: Date.now()
      };
      setTrades(prev => {
        const updated = [newTrade, ...prev];
        tradesRef.current = updated.slice(0, 60);
        return tradesRef.current;
      });
      setOrderBook(() => genOrderBook(currentTicker.last));
    }, 2000);
    return () => clearInterval(id);
  }, [selectedSymbol, tickers, exchange]);

  // Filtrar tickers por exchange seleccionado (por ahora mock comparte todos)
  const effectiveTickers = useMemo(() => {
    if (exchange === 'mock') return tickers;
    const symbols = exchangeSymbols[exchange] || [];
    // Reutilizamos tickers mock adaptando símbolo si no existe
    return symbols.map(sym => {
      const base = tickers[0];
      return {
        symbol: sym,
        last: base?.last || randomFloat(10,60000,2),
        change24h: base?.change24h || randomFloat(-5,5,2),
        volume24h: base?.volume24h || randomFloat(1000,500000,0)
      };
    });
  }, [exchange, tickers, exchangeSymbols]);

  const value = useMemo(() => ({
    exchange,
    setExchange,
    exchanges,
    exchangeSymbols,
    selectedSymbol,
    setSelectedSymbol,
    tickers: effectiveTickers,
    orderBook,
    trades,
    portfolio,
    openOrders,
    // Hyperliquid scaffolding (estos valores se irán poblando con feed real)
    connectionStatus: exchange === 'hyperliquid' ? 'placeholder' : 'mock'
  }), [exchange, effectiveTickers, orderBook, trades, portfolio, openOrders, exchanges, exchangeSymbols, selectedSymbol]);

  /* ============================
   * Hyperliquid Scaffolding (Stub)
   * ============================
   * Objetivo: preparar la estructura para integrar REST + WS reales sin romper la API actual.
   * TODO:
   *  - Reemplazar endpoints ficticios por los oficiales.
   *  - Implementar fetch real de lista de mercados (spot & perps) y mapear a formato interno.
   *  - WebSocket: suscribir a trades, orderbook (level 2), kline para selectedSymbol.
   *  - Mantener throttling/debounce en actualizaciones de orderBook & trades.
   */
  useEffect(() => {
    if (exchange !== 'hyperliquid') return;
    let cancelled = false;
    let wsClient = null;

    (async () => {
      // 1. Fetch markets (para futuro filtrado completo)
      try {
        await fetchMarkets(); // resultado no utilizado aún (ya tenemos placeholders)
      } catch(e) {
        console.warn('[Hyperliquid] error fetchMarkets (stub):', e);
      }
      // 2. Fetch velas iniciales del símbolo seleccionado (para eventual mini chart)
      try {
        await fetchCandles(selectedSymbol.replace('/USDT','/USDC').replace('/USDC','/USDC'), '1m', 60);
      } catch(e) {
        console.warn('[Hyperliquid] error fetchCandles (stub):', e);
      }
      if (cancelled) return;
      // 3. Iniciar cliente WS stub
      wsClient = new HyperliquidWSClient({
        onTrade: (t) => {
          setTrades(prev => [t, ...prev].slice(0, 200));
        },
        onCandle: (c) => {
          // Podríamos almacenar última vela para mini chart; por ahora ignoramos.
        },
        onOrderBook: (ob) => {
          setOrderBook(ob);
        },
      });
      wsClient.connect();
      wsClient.subscribe({ symbol: selectedSymbol });
    })();

    return () => {
      cancelled = true;
      if (wsClient) wsClient.close();
    };
  }, [exchange, selectedSymbol]);

  return (
    <TradingDataContext.Provider value={value}>
      {children}
    </TradingDataContext.Provider>
  );
};

export function useTradingData() {
  const ctx = useContext(TradingDataContext);
  if (!ctx) throw new Error('useTradingData debe usarse dentro de <MockTradingDataProvider/>');
  return ctx;
}

export default MockTradingDataProvider;
