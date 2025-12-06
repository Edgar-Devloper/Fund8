// Hyperliquid REST API stubs
// TODO: Reemplazar URLs y parsing con la documentación oficial.

// Nota: Mantener funciones puras y retornos normalizados para facilitar test y caching.

/**
 * fetchMarkets
 * Obtiene listado de mercados (spot y perps). Placeholder hasta confirmar endpoint real.
 * @returns {Promise<Array<{symbol:string,type:'spot'|'perp',base:string,quote:string,leverageMax?:number}>>}
 */
export async function fetchMarkets() {
  // Simulación: pequeña latencia
  await new Promise(r => setTimeout(r, 150));
  return [
    { symbol: 'BTC/USDC', type: 'spot', base: 'BTC', quote: 'USDC' },
    { symbol: 'ETH/USDC', type: 'spot', base: 'ETH', quote: 'USDC' },
    { symbol: 'SOL/USDC', type: 'spot', base: 'SOL', quote: 'USDC' },
    { symbol: 'HYPE/USDC', type: 'spot', base: 'HYPE', quote: 'USDC' },
    { symbol: 'BTC-PERP', type: 'perp', base: 'BTC', quote: 'USDC', leverageMax: 50 },
    { symbol: 'ETH-PERP', type: 'perp', base: 'ETH', quote: 'USDC', leverageMax: 50 },
  ];
}

/**
 * fetchCandles
 * Devuelve velas normalizadas para un símbolo e intervalo.
 * @param {string} symbol
 * @param {string} interval e.g. '1m','5m','1h'
 * @param {number} limit
 */
export async function fetchCandles(symbol, interval = '1m', limit = 120) {
  await new Promise(r => setTimeout(r, 120));
  const now = Math.floor(Date.now() / 1000);
  const sec = intervalToSec(interval);
  const start = now - limit * sec;
  let price = 100 + Math.random()*50;
  const candles = [];
  for (let i=0;i<limit;i++) {
    const t = start + i*sec;
    const open = price;
    const drift = price * (Math.random()-0.5)*0.01;
    price = Math.max(0.0001, price + drift);
    const close = price;
    const high = Math.max(open, close) * (1 + Math.random()*0.002);
    const low  = Math.min(open, close) * (1 - Math.random()*0.002);
    candles.push({ time:t, open, high, low, close, volume: Math.random()*1000 });
  }
  return candles;
}

export function intervalToSec(interval) {
  switch(interval) {
    case '5m': return 300;
    case '15m': return 900;
    case '1h': return 3600;
    case '1D': return 86400; // 1 día = 24 horas
    case '1W': return 604800; // 1 semana = 7 días
    case '1m':
    default: return 60;
  }
}
