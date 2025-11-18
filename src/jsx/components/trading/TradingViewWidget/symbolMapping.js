// Mapeo interno símbolo -> símbolo TradingView
// Ajusta según exchange seleccionado. Para Hyperliquid (si no existe feed directo en TV)
// se puede mapear a un proxy (ej. BITMEX) o dejar fallback.

export const SYMBOL_MAPPING = {
  'BTC/USDT': 'BINANCE:BTCUSDT',
  'ETH/USDT': 'BINANCE:ETHUSDT',
  'SOL/USDT': 'BINANCE:SOLUSDT',
  'ADA/USDT': 'BINANCE:ADAUSDT',
  'XRP/USDT': 'BINANCE:XRPUSDT',
  'BTC/USDC': 'BINANCE:BTCUSDT', // fallback
  'ETH/USDC': 'BINANCE:ETHUSDT',
  'SOL/USDC': 'BINANCE:SOLUSDT',
  'HYPE/USDC': 'BITMEX:BHYPET', // ejemplo proporcionado por el usuario
};

export function mapToTradingViewSymbol(sym) {
  return SYMBOL_MAPPING[sym] || 'BINANCE:BTCUSDT';
}
