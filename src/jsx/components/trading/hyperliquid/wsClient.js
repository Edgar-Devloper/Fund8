// Hyperliquid WebSocket client stub
// TODO: Implementar conexión real a la API de Hyperliquid.

export class HyperliquidWSClient {
  constructor({ onTrade, onCandle, onOrderBook, log = false }) {
    this.onTrade = onTrade;
    this.onCandle = onCandle;
    this.onOrderBook = onOrderBook;
    this.log = log;
    this._intervals = [];
    this._connected = false;
  }

  connect() {
    // Simular open
    this._connected = true;
    if (this.log) console.log('[HyperliquidWS] connected (stub)');
  }

  subscribe({ symbol, interval = '1m' }) {
    // Simular trades cada 2s
    const tradeInt = setInterval(() => {
      this.onTrade && this.onTrade({
        id: 'T'+Math.random().toString(36).slice(2),
        symbol,
        side: Math.random()>0.5?'buy':'sell',
        price: 100 + Math.random()*50,
        amount: Math.random(),
        ts: Date.now()
      });
    }, 2000);
    this._intervals.push(tradeInt);

    // Simular vela incremental cada 5s
    const candleInt = setInterval(() => {
      const now = Math.floor(Date.now()/1000);
      const base = 100 + Math.random()*50;
      const candle = {
        time: now - (now % 60),
        open: base*0.995,
        high: base*1.01,
        low: base*0.99,
        close: base*1.002,
        volume: Math.random()*500
      };
      this.onCandle && this.onCandle(candle);
    }, 5000);
    this._intervals.push(candleInt);

    // Simular orderbook snapshot/diff
    const bookInt = setInterval(() => {
      const mid = 100 + Math.random()*50;
      const bids = [];
      const asks = [];
      for (let i=0;i<10;i++) {
        bids.push({ price: +(mid - i*0.5).toFixed(2), amount: +(Math.random()*2).toFixed(4) });
        asks.push({ price: +(mid + i*0.5).toFixed(2), amount: +(Math.random()*2).toFixed(4) });
      }
      this.onOrderBook && this.onOrderBook({ bids, asks });
    }, 4000);
    this._intervals.push(bookInt);
  }

  close() {
    this._intervals.forEach(i => clearInterval(i));
    this._intervals = [];
    this._connected = false;
  }
}
