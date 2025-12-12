import api from './api';

const postData = async (url, data) => {
  try {
    const response = await api.post(url, data);
    return response;
  } catch (error) {
    console.error('Error posting data:', error);
    throw error;
  }
};

const getAllMids = async () => {
  return await postData('/info', { type: 'allMids' });
};

const getMetaAndAssetCtxs = async () => {
  return await postData('/info', { type: 'metaAndAssetCtxs' });
};

const getCandles = async (coin, interval, startTime, endTime) => {
  // Normalize interval format for Hyperliquid API
  // Hyperliquid expects lowercase: '1m', '5m', '15m', '1h', '4h', '1d'
  // But we support '1D', '1W', and '1M' in UI, so normalize them
  // Note: For '1M' (monthly), we'll fetch daily data and aggregate it on the frontend
  let normalizedInterval = interval;
  if (interval === '1D') {
    normalizedInterval = '1d';
  } else if (interval === '1W') {
    normalizedInterval = '1w'; // Note: Hyperliquid may not support '1w', but we'll try
  } else if (interval === '1M') {
    normalizedInterval = '1d'; // Fetch daily data, will be aggregated to monthly on frontend
  } else {
    normalizedInterval = interval.toLowerCase();
  }
  
  return await postData('/info', {
    type: 'candleSnapshot',
    req: {
      coin,
      interval: normalizedInterval,
      startTime,
      endTime
    }
  });
};

const getOrderBook = async (coin) => {
  return await postData('/info', {
    type: 'l2Book',
    coin
  });
};

const getRecentTrades = async (coin) => {
  return await postData('/info', {
    type: 'recentTrades',
    coin
  });
};

const getClearinghouseState = async (user) => {
  return await postData('/info', {
    type: 'clearinghouseState',
    user
  });
};

const getOpenOrders = async (user) => {
  return await postData('/info', {
    type: 'openOrders',
    user
  });
};

const getUserFills = async (user) => {
  return await postData('/info', {
    type: 'userFills',
    user
  });
};

const getUserFunding = async (user) => {
  return await postData('/info', {
    type: 'userFunding',
    user
  });
};

const getUserNonFundingLedgerUpdates = async (user) => {
  return await postData('/info', {
    type: 'userNonFundingLedgerUpdates',
    user
  });
};

const SYMBOL_MAP = {
  bitcoin: 'BTC',
  btc: 'BTC',
  ethereum: 'ETH',
  eth: 'ETH',
  litecoin: 'LTC',
  ltc: 'LTC',
  solana: 'SOL',
  sol: 'SOL',
  monero: 'XMR',
  xmr: 'XMR',
  cardano: 'ADA',
  ada: 'ADA',
  dogecoin: 'DOGE',
  doge: 'DOGE',
};

const normalizeSymbol = (input) => {
  // converts coin name to hyperliquid symbol format
  const normalized = input.toLowerCase();
  return SYMBOL_MAP[normalized] || input.toUpperCase();
};

export const apiService = {
  // Exponer métodos directos para uso en providers
  getAllMids,
  getMetaAndAssetCtxs,
  getCandles,
  
  async fetchCryptoPrice(coinId) {
    const symbol = normalizeSymbol(coinId);
    const response = await getAllMids();
    const allPrices = response.data || response;

    if (!allPrices[symbol]) {
      throw new Error(`No se encontró precio para ${symbol} en Hyperliquid`);
    }

    const price = parseFloat(allPrices[symbol]);

      return {
      id: coinId.toLowerCase(),
      symbol: symbol,
      price: price,
      change24h: 0,
      volume24h: 0,
      marketCap: 0,
      lastUpdated: new Date().toISOString()
    };
  },

  async fetchDashboardPrices() {
    // fetches prices for dashboard main coins (btc, eth, ltc, sol)
    const [allPrices, metaData] = await Promise.all([
      getAllMids(),
      getMetaAndAssetCtxs()
    ]);

    const prices = allPrices.data || allPrices;
    const metaDataResponse = metaData.data || metaData;
    const [universe, assetCtxs] = Array.isArray(metaDataResponse) ? metaDataResponse : [metaDataResponse?.universe || [], metaDataResponse?.assetCtxs || {}];

    // Helper function to get weekly change using candles
    const getWeeklyChange = async (symbol, currentPrice) => {
      try {
        // Get candles for the past 7 days (1 day = 1440 minutes, 7 days = ~10080 minutes)
        // Using 1h interval to get last ~168 candles (7 days * 24 hours)
        const endTime = Date.now();
        const startTime = endTime - (7 * 24 * 60 * 60 * 1000); // 7 days ago in milliseconds
        
        const candlesResponse = await getCandles(symbol, '1h', startTime, endTime);
        const candlesData = candlesResponse.data || candlesResponse || [];
        
        // If we have candles, find the price 7 days ago
        if (Array.isArray(candlesData) && candlesData.length > 0) {
          // Get the first candle (oldest) close price as the price 7 days ago
          const weekAgoPrice = Array.isArray(candlesData[0]) 
            ? parseFloat(candlesData[0][4] || candlesData[0][1] || '0') // [time, open, high, low, close]
            : parseFloat(candlesData[0].close || candlesData[0].c || candlesData[0][1] || '0');
          
          if (weekAgoPrice > 0 && currentPrice > 0) {
            return ((currentPrice - weekAgoPrice) / weekAgoPrice) * 100;
          }
        }
        
        // Fallback: try using prevDayPx if candles are not available
        const ctx = assetCtxs?.[symbol];
        const prevDayPx = parseFloat(ctx?.prevDayPx || '0');
        if (prevDayPx > 0 && currentPrice > 0) {
          return ((currentPrice - prevDayPx) / prevDayPx) * 100;
        }
        
        return 0;
      } catch (err) {
        console.error(`[fetchDashboardPrices] Error getting weekly change for ${symbol}:`, err);
        // Fallback to 24h change if weekly calculation fails
        const ctx = assetCtxs?.[symbol];
        const prevDayPx = parseFloat(ctx?.prevDayPx || '0');
        if (prevDayPx > 0 && currentPrice > 0) {
          return ((currentPrice - prevDayPx) / prevDayPx) * 100;
        }
        return 0;
      }
    };

    const getPriceData = async (symbol, coinId) => {
      // calculates price and weekly change from 7 days ago price
      const price = parseFloat(prices[symbol] || '0');
      
      if (price <= 0) return null;
      
      // Get weekly change
      const changeWeek = await getWeeklyChange(symbol, price);
      
      const ctx = assetCtxs?.[symbol];
      const prevDayPx = parseFloat(ctx?.prevDayPx || '0');
      const change24h = prevDayPx > 0 ? ((price - prevDayPx) / prevDayPx) * 100 : 0;

      return {
        id: coinId,
        symbol,
        price,
        change24h,
        changeWeek,
        volume24h: parseFloat(ctx?.dayNtlVlm || '0'),
        marketCap: 0,
        lastUpdated: new Date().toISOString()
      };
    };

    // Get all price data in parallel
    const [bitcoin, ethereum, litecoin, solana] = await Promise.all([
      getPriceData('BTC', 'bitcoin'),
      getPriceData('ETH', 'ethereum'),
      getPriceData('LTC', 'litecoin'),
      getPriceData('SOL', 'solana'),
    ]);

    return {
      bitcoin,
      ethereum,
      litecoin,
      solana,
    };
  },

  async fetchMultipleCryptoPrices(coinIds) {
    const response = await getAllMids();
    const allPrices = response.data || response;
      
      const result = {};

    coinIds.forEach(coinId => {
      const normalizedSymbol = normalizeSymbol(coinId);
      const price = parseFloat(allPrices[normalizedSymbol] || '0');

      if (price > 0) {
        result[coinId] = {
          id: coinId.toLowerCase(),
          symbol: normalizedSymbol,
          price,
          change24h: 0,
          volume24h: 0,
          marketCap: 0,
          lastUpdated: new Date().toISOString()
          };
        }
      });

      return result;
  },

  async fetchOrderBook(coin) {
    // returns formatted order book with asks and bids arrays
    const symbol = normalizeSymbol(coin);
    const response = await getOrderBook(symbol);
    const data = response;

    const asks = [];
    const bids = [];

    if (data?.levels && Array.isArray(data.levels)) {
      // levels[0] = bids, levels[1] = asks
      const bidsData = data.levels[0] || [];
      const asksData = data.levels[1] || [];

      bidsData.forEach((level) => {
        const price = parseFloat(level.px || level[0] || '0');
        const size = parseFloat(level.sz || level[1] || '0');
        if (price > 0 && size > 0) {
          bids.push({ price, quantity: size, total: price * size });
        }
      });

      asksData.forEach((level) => {
        const price = parseFloat(level.px || level[0] || '0');
        const size = parseFloat(level.sz || level[1] || '0');
        if (price > 0 && size > 0) {
          asks.push({ price, quantity: size, total: price * size });
        }
      });
    }

    return { asks, bids };
  },

  async fetchRecentTrades(coin, limit = 50) {
    // formats recent trades and converts side 'B' to 'buy', else 'sell'
    const symbol = normalizeSymbol(coin);
    const response = await getRecentTrades(symbol);
    const trades = response.data || response;

    return trades.slice(0, limit).map(trade => ({
      id: trade.coin || trade.id || `${symbol}-${trade.time}`,
      symbol: symbol,
      price: parseFloat(trade.px || '0'),
      quantity: parseFloat(trade.sz || '0'),
      side: trade.side === 'B' ? 'buy' : 'sell',
      timestamp: trade.time || Date.now(),
      size: parseFloat(trade.sz || '0')
    }));
  },

  async fetchUserState(address) {
    return await getClearinghouseState(address);
  },

  async fetchCandles(coin, interval, startTime, endTime) {
    return await getCandles(coin, interval, startTime, endTime);
  },

  async fetchMetaAndAssetCtxs() {
    return await getMetaAndAssetCtxs();
  },

  async fetchOpenOrders(address) {
    // fetches user open orders from hyperliquid
    if (!address) {
      throw new Error('Address is required to fetch open orders');
    }
    const response = await getOpenOrders(address);
    const orders = response.data || response || [];
    
    return orders.map(order => {
      const size = parseFloat(order.sz || '0');
      const filled = parseFloat(order.filledSz || '0');
      const filledPercent = size > 0 ? ((filled / size) * 100).toFixed(2) : '0.00';
      
      return {
        id: order.oid || `${order.coin}-${order.timestamp}`,
        symbol: order.coin || 'N/A',
        side: order.side === 'B' ? 'buy' : 'sell',
        type: order.limitPx ? 'Limit' : 'Market',
        price: parseFloat(order.limitPx || '0'),
        amount: size,
        filled: filled,
        filledPercent: filledPercent,
        timestamp: order.timestamp || Date.now(),
        orderId: order.oid || null
      };
    });
  },

  async fetchUserFills(address) {
    // fetches user trade history (filled orders) from hyperliquid
    if (!address) {
      throw new Error('Address is required to fetch user fills');
    }
    const response = await getUserFills(address);
    const fills = response.data || response || [];
    
    return fills.map(fill => ({
      id: fill.tid || `${fill.coin}-${fill.time}`,
      symbol: fill.coin || 'N/A',
      side: fill.side === 'B' ? 'buy' : 'sell',
      price: parseFloat(fill.px || '0'),
      amount: parseFloat(fill.sz || '0'),
      fee: parseFloat(fill.fee || '0'),
      timestamp: fill.time || Date.now(),
      tradeId: fill.tid || null
    }));
  },

  async fetchUserFunding(address) {
    // fetches user funding history from hyperliquid
    if (!address) {
      throw new Error('Address is required to fetch user funding');
    }
    const response = await getUserFunding(address);
    const funding = response.data || response || [];
    
    return funding.map(fund => ({
      id: fund.id || `${fund.coin}-${fund.time}`,
      symbol: fund.coin || 'N/A',
      amount: parseFloat(fund.funding || '0'),
      timestamp: fund.time || Date.now(),
      type: fund.amount >= 0 ? 'received' : 'paid'
    }));
  },

  async fetchUserNonFundingLedgerUpdates(address) {
    // fetches user deposits, withdrawals, liquidations from hyperliquid
    if (!address) {
      throw new Error('Address is required to fetch ledger updates');
    }
    const response = await getUserNonFundingLedgerUpdates(address);
    const updates = response.data || response || [];
    
    return updates.map(update => ({
      id: update.id || `ledger-${update.timestamp}`,
      type: update.type || 'unknown', // 'deposit', 'withdrawal', 'liquidation'
      coin: update.coin || 'USDC',
      amount: parseFloat(update.amount || '0'),
      fee: parseFloat(update.fee || '0'),
      timestamp: update.timestamp || Date.now(),
      note: update.note || `${update.type || 'Transaction'}`
    }));
  },

  formatPrice(price, decimals = 2) {
    if (price === 0 || isNaN(price)) return '0.00';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(price);
  },

  async placeOrder(signer, orderData) {
    // places order on hyperliquid exchange using wallet signature
    const { coin, side, size, price, orderType = 'Limit', reduceOnly = false } = orderData;
    
    if (!signer) {
      throw new Error('Wallet signer is required to place orders');
    }

    try {
      const address = await signer.getAddress();
      
      // construct order action
      const orderAction = {
        type: orderType,
        coin: normalizeSymbol(coin),
        side: side === 'buy' ? 'B' : 'A',
        sz: parseFloat(size).toString(),
        limitPx: parseFloat(price).toString(),
        reduceOnly: reduceOnly
      };

      // get vault address (null for main account)
      const vaultAddress = null;
      
      // construct action
      const action = {
        type: 'order',
        orders: [orderAction],
        grouping: 'na'
      };

      // get connection id (nonce)
      const connectionId = Date.now();
      
      // construct payload for signing
      const payload = {
        action,
        nonce: connectionId,
        vaultAddress
      };

      // sign payload
      const { ethers } = await import('ethers');
      const message = JSON.stringify(payload);
      const signature = await signer.signMessage(message);
      const sig = ethers.utils.splitSignature(signature);
      
      // construct request body
      const requestBody = {
        action,
        nonce: connectionId,
        signature: {
          r: sig.r,
          s: sig.s,
          v: sig.v
        },
        vaultAddress
      };

      // post to exchange endpoint
      const response = await api.post('/exchange', requestBody);

      return {
        success: true,
        data: response,
        orderId: response?.status?.resting?.oid || null
      };
    } catch (error) {
      console.error('[Hyperliquid] Error placing order:', error);
      throw new Error(error.response?.data?.message || error.message || 'Error al colocar la orden');
    }
  },

  async cancelOrder(signer, orderId) {
    // cancels order on hyperliquid exchange using wallet signature
    if (!signer) {
      throw new Error('Wallet signer is required to cancel orders');
    }

    try {
      const address = await signer.getAddress();
      
      // construct cancel action
      const action = {
        type: 'cancel',
        cancels: [{
          oid: orderId
        }]
      };

      // get vault address (null for main account)
      const vaultAddress = null;
      
      // get connection id (nonce)
      const connectionId = Date.now();
      
      // construct payload for signing
      const payload = {
        action,
        nonce: connectionId,
        vaultAddress
      };

      // sign payload
      const { ethers } = await import('ethers');
      const message = JSON.stringify(payload);
      const signature = await signer.signMessage(message);
      const sig = ethers.utils.splitSignature(signature);
      
      // construct request body
      const requestBody = {
        action,
        nonce: connectionId,
        signature: {
          r: sig.r,
          s: sig.s,
          v: sig.v
        },
        vaultAddress
      };

      // post to exchange endpoint
      const response = await api.post('/exchange', requestBody);
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('[Hyperliquid] Error canceling order:', error);
      throw new Error(error.response?.data?.message || error.message || 'Error al cancelar la orden');
    }
  }
};

export { getAllMids, getMetaAndAssetCtxs, getOrderBook, getRecentTrades, getClearinghouseState, getCandles, getOpenOrders, getUserFills, getUserFunding, getUserNonFundingLedgerUpdates };

export default apiService;
