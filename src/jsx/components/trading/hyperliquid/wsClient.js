/**
 * Hyperliquid WebSocket Client
 * Implementación real del cliente WebSocket para HyperLiquid API
 * Documentación: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket
 */

export class HyperliquidWSClient {
  constructor({ onTrade, onCandle, onOrderBook, onAllMids, onUserEvents, onError, log = false }) {
    this.onTrade = onTrade;
    this.onCandle = onCandle;
    this.onOrderBook = onOrderBook;
    this.onAllMids = onAllMids;
    this.onUserEvents = onUserEvents;
    this.onError = onError;
    this.log = log;
    
    this.ws = null;
    this._connected = false;
    this._subscriptions = new Set();
    this._reconnectAttempts = 0;
    this._maxReconnectAttempts = 5; // Reduced from 10
    this._reconnectDelay = 2000; // Increased from 1000ms to 2000ms
    this._heartbeatInterval = null;
    this._messageHandlers = new Map();
    
    // Log environment configuration
    if (this.log || process.env.NODE_ENV === 'development') {
      console.log('[HyperliquidWS] Environment config:', {
        REACT_APP_HYPERLIQUID_ENV: process.env.REACT_APP_HYPERLIQUID_ENV,
        REACT_APP_HYPERLIQUID_WS_URL: process.env.REACT_APP_HYPERLIQUID_WS_URL,
      });
    }
    
    // Determine WebSocket URL based on environment
    this.wsUrl = this._getWebSocketUrl();
  }

  _getWebSocketUrl() {
    // Check for explicit WS URL
    if (process.env.REACT_APP_HYPERLIQUID_WS_URL) {
      const explicitUrl = process.env.REACT_APP_HYPERLIQUID_WS_URL;
      console.log('[HyperliquidWS] Using explicit WS URL:', explicitUrl);
      return explicitUrl;
    }
    
    // Auto-detect based on environment
    const env = process.env.REACT_APP_HYPERLIQUID_ENV;
    if (env === 'testnet') {
      const testnetUrl = 'wss://api.hyperliquid-testnet.xyz/ws';
      console.log('[HyperliquidWS] Auto-detected testnet, using:', testnetUrl);
      return testnetUrl;
    }
    
    // Default to mainnet
    const mainnetUrl = 'wss://api.hyperliquid.xyz/ws';
    console.log('[HyperliquidWS] Defaulting to mainnet, using:', mainnetUrl);
    return mainnetUrl;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      if (this.log) console.log('[HyperliquidWS] Already connected or connecting');
      return;
    }

    try {
      if (this.log) console.log(`[HyperliquidWS] Connecting to ${this.wsUrl}...`);
      
      this.ws = new WebSocket(this.wsUrl);
      
      this.ws.onopen = () => {
        this._connected = true;
        this._reconnectAttempts = 0;
        if (this.log) console.log('[HyperliquidWS] Connected successfully');
        
        // Wait a bit before resubscribing to avoid overwhelming the server
        setTimeout(() => {
          this._resubscribeAll();
        }, 100);
        
        // Start heartbeat
        this._startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this._handleMessage(message);
        } catch (error) {
          console.error('[HyperliquidWS] Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[HyperliquidWS] WebSocket error:', error);
        if (this.onError) this.onError(error);
      };

      this.ws.onclose = (event) => {
        this._connected = false;
        this._stopHeartbeat();
        
        if (this.log) {
          console.log(`[HyperliquidWS] Connection closed. Code: ${event.code}, Reason: ${event.reason}`);
        }
        
        // Only attempt reconnection if not manually closed
        if (this._reconnectAttempts < this._maxReconnectAttempts && event.code !== 1000) {
          this._reconnectAttempts++;
          const delay = Math.min(this._reconnectDelay * Math.pow(2, this._reconnectAttempts - 1), 30000); // Max 30s
          if (this.log) {
            console.log(`[HyperliquidWS] Reconnecting in ${delay}ms (attempt ${this._reconnectAttempts}/${this._maxReconnectAttempts})...`);
          }
          setTimeout(() => this.connect(), delay);
        } else if (this._reconnectAttempts >= this._maxReconnectAttempts) {
          console.warn('[HyperliquidWS] Max reconnection attempts reached. Call connect() manually to retry.');
        }
      };
      
    } catch (error) {
      console.error('[HyperliquidWS] Error creating WebSocket:', error);
      if (this.onError) this.onError(error);
    }
  }

  _startHeartbeat() {
    this._heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ method: 'ping' }));
      }
    }, 30000); // ping every 30 seconds
  }

  _stopHeartbeat() {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }
  }

  _handleMessage(message) {
    // Validate message structure
    if (!message || typeof message !== 'object') {
      console.warn('[HyperliquidWS] Invalid message format:', message);
      return;
    }

    if (this.log && message.channel !== 'allMids') {
      console.log('[HyperliquidWS] Received:', message);
    }

    // Handle pong response
    if (message.channel === 'pong') {
      return;
    }

    const { channel, data } = message;

    // Validate channel and data
    if (!channel) {
      console.warn('[HyperliquidWS] Message missing channel:', message);
      return;
    }

    switch (channel) {
      case 'allMids':
        if (this.onAllMids && data) {
          this.onAllMids(data);
        }
        break;

      case 'trades':
        if (this.onTrade && Array.isArray(data)) {
          data.forEach((trade, index) => {
            // Generate unique ID using coin, time, and index to avoid duplicates
            const uniqueId = `${trade.coin}-${trade.time}-${index}-${Math.random().toString(36).substr(2, 9)}`;
            this.onTrade({
              id: uniqueId,
              symbol: trade.coin,
              side: trade.side === 'B' ? 'buy' : 'sell',
              price: parseFloat(trade.px),
              amount: parseFloat(trade.sz),
              ts: trade.time
            });
          });
        }
        break;

      case 'l2Book':
        if (this.onOrderBook && data) {
          const { coin, levels } = data;
          if (levels && Array.isArray(levels) && levels.length >= 2) {
            const [bidsData, asksData] = levels;
            
            // Ensure bidsData and asksData are arrays
            const bids = Array.isArray(bidsData) 
              ? bidsData.map(level => {
                  // Handle both array format [price, size] and object format {px, sz}
                  if (Array.isArray(level)) {
                    return {
                      price: parseFloat(level[0] || 0),
                      amount: parseFloat(level[1] || 0)
                    };
                  } else if (level && typeof level === 'object') {
                    return {
                      price: parseFloat(level.px || level.price || 0),
                      amount: parseFloat(level.sz || level.size || level.amount || 0)
                    };
                  }
                  return null;
                }).filter(Boolean)
              : [];
            
            const asks = Array.isArray(asksData)
              ? asksData.map(level => {
                  // Handle both array format [price, size] and object format {px, sz}
                  if (Array.isArray(level)) {
                    return {
                      price: parseFloat(level[0] || 0),
                      amount: parseFloat(level[1] || 0)
                    };
                  } else if (level && typeof level === 'object') {
                    return {
                      price: parseFloat(level.px || level.price || 0),
                      amount: parseFloat(level.sz || level.size || level.amount || 0)
                    };
                  }
                  return null;
                }).filter(Boolean)
              : [];
            
            this.onOrderBook({ coin, bids, asks });
          }
        }
        break;

      case 'candle':
        if (this.onCandle && data) {
          const { t, o, h, l, c, v } = data;
          this.onCandle({
            time: parseInt(t),
            open: parseFloat(o),
            high: parseFloat(h),
            low: parseFloat(l),
            close: parseFloat(c),
            volume: parseFloat(v)
          });
        }
        break;

      case 'user':
      case 'userEvents':
        if (this.onUserEvents && data) {
          this.onUserEvents(data);
        }
        break;

      case 'subscriptionResponse':
        if (this.log) {
          console.log('[HyperliquidWS] Subscription response:', data);
        }
        break;

      default:
        if (this.log) {
          console.log('[HyperliquidWS] Unhandled channel:', channel);
        }
    }
  }

  subscribe(subscription) {
    const subKey = JSON.stringify(subscription);
    
    if (this._subscriptions.has(subKey)) {
      if (this.log) console.log('[HyperliquidWS] Already subscribed to:', subscription);
      return;
    }

    this._subscriptions.add(subKey);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this._sendSubscription(subscription);
    } else {
      if (this.log) console.log('[HyperliquidWS] WebSocket not open, subscription queued:', subscription);
    }
  }

  _sendSubscription(subscription) {
    try {
      const message = {
        method: 'subscribe',
        subscription
      };
      
      if (this.log) console.log('[HyperliquidWS] Subscribing:', subscription);
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('[HyperliquidWS] Error sending subscription:', error);
    }
  }

  unsubscribe(subscription) {
    const subKey = JSON.stringify(subscription);
    this._subscriptions.delete(subKey);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        const message = {
          method: 'unsubscribe',
          subscription
        };
        
        if (this.log) console.log('[HyperliquidWS] Unsubscribing:', subscription);
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('[HyperliquidWS] Error sending unsubscribe:', error);
      }
    }
  }

  _resubscribeAll() {
    if (this.log) console.log('[HyperliquidWS] Resubscribing to all channels...');
    
    const subscriptions = Array.from(this._subscriptions);
    
    // Send subscriptions with delay to avoid overwhelming the server
    subscriptions.forEach((subKey, index) => {
      setTimeout(() => {
        try {
          const subscription = JSON.parse(subKey);
          this._sendSubscription(subscription);
        } catch (error) {
          console.error('[HyperliquidWS] Error resubscribing:', error);
        }
      }, index * 100); // 100ms delay between each subscription
    });
  }

  close() {
    if (this.log) console.log('[HyperliquidWS] Closing connection...');
    
    this._stopHeartbeat();
    this._reconnectAttempts = this._maxReconnectAttempts; // Prevent reconnection
    
    if (this.ws) {
      try {
        this.ws.close(1000, 'Client disconnect'); // Normal closure
      } catch (error) {
        console.error('[HyperliquidWS] Error closing WebSocket:', error);
      }
      this.ws = null;
    }
    
    this._connected = false;
  }

  isConnected() {
    return this._connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}
