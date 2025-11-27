/**
 * Hyperliquid Trading Service
 * Handles order placement, cancellation, and transaction signing
 */

import { ethers } from 'ethers';

const HYPERLIQUID_API_URL = process.env.REACT_APP_HYPERLIQUID_ENV === 'testnet' 
  ? 'https://api.hyperliquid-testnet.xyz'
  : 'https://api.hyperliquid.xyz';

class HyperliquidTradingService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
  }

  /**
   * Initialize with Web3 provider and signer (from wallet connection)
   */
  async initialize(provider, signer) {
    try {
      if (!provider || !signer) {
        throw new Error('Provider and signer are required');
      }

      console.log('[HL Trading] Initializing trading service...');
      
      // Use the provider and signer directly from WalletContext
      this.provider = provider;
      this.signer = signer;
      this.address = await signer.getAddress();
      
      console.log('[HL Trading] Initialized with address:', this.address);
      return true;
    } catch (error) {
      console.error('[HL Trading] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Place a limit order
   * @param {Object} params - Order parameters
   * @param {string} params.coin - Trading pair symbol (e.g., 'BTC')
   * @param {boolean} params.isBuy - true for buy, false for sell
   * @param {number} params.price - Limit price
   * @param {number} params.size - Order size
   * @param {string} params.orderType - 'limit' or 'market'
   */
  async placeOrder({ coin, isBuy, price, size, orderType = 'limit' }) {
    if (!this.signer || !this.address) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    try {
      console.log('[HL Trading] Placing order:', { coin, isBuy, price, size, orderType });

      // Build the order payload
      const order = {
        coin: coin,
        is_buy: isBuy,
        sz: size.toString(),
        limit_px: price.toString(),
        order_type: { limit: { tif: 'Gtc' } }, // Good-Til-Cancelled
        reduce_only: false
      };

      // Create the action payload
      const action = {
        type: 'order',
        orders: [order],
        grouping: 'na'
      };

      // Get the current timestamp
      const timestamp = Date.now();

      // Create the message to sign
      const message = JSON.stringify({
        action: action,
        nonce: timestamp,
        vault_address: null // For personal trading, not vault
      });

      // Sign the message
      const signature = await this.signer.signMessage(message);

      // Send the order to Hyperliquid
      const response = await fetch(`${HYPERLIQUID_API_URL}/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action,
          nonce: timestamp,
          signature: signature,
          vault_address: null
        })
      });

      const result = await response.json();

      if (response.ok && result.status === 'ok') {
        console.log('[HL Trading] Order placed successfully:', result);
        return {
          success: true,
          data: result.response,
          orderId: result.response?.statuses?.[0]?.oid
        };
      } else {
        console.error('[HL Trading] Order failed:', result);
        return {
          success: false,
          error: result.error || result.response || 'Order placement failed'
        };
      }
    } catch (error) {
      console.error('[HL Trading] Error placing order:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Place a market order
   */
  async placeMarketOrder({ coin, isBuy, size }) {
    if (!this.signer || !this.address) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    try {
      console.log('[HL Trading] Placing market order:', { coin, isBuy, size });

      const order = {
        coin: coin,
        is_buy: isBuy,
        sz: size.toString(),
        limit_px: isBuy ? '999999999' : '0.01', // High price for buy, low for sell (market)
        order_type: { limit: { tif: 'Ioc' } }, // Immediate-Or-Cancel
        reduce_only: false
      };

      const action = {
        type: 'order',
        orders: [order],
        grouping: 'na'
      };

      const timestamp = Date.now();

      const message = JSON.stringify({
        action: action,
        nonce: timestamp,
        vault_address: null
      });

      const signature = await this.signer.signMessage(message);

      const response = await fetch(`${HYPERLIQUID_API_URL}/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action,
          nonce: timestamp,
          signature: signature,
          vault_address: null
        })
      });

      const result = await response.json();

      if (response.ok && result.status === 'ok') {
        console.log('[HL Trading] Market order placed successfully:', result);
        return {
          success: true,
          data: result.response,
          orderId: result.response?.statuses?.[0]?.oid
        };
      } else {
        console.error('[HL Trading] Market order failed:', result);
        return {
          success: false,
          error: result.error || result.response || 'Market order placement failed'
        };
      }
    } catch (error) {
      console.error('[HL Trading] Error placing market order:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder({ coin, orderId }) {
    if (!this.signer || !this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const action = {
        type: 'cancel',
        cancels: [{
          coin: coin,
          oid: orderId
        }]
      };

      const timestamp = Date.now();
      const message = JSON.stringify({
        action: action,
        nonce: timestamp,
        vault_address: null
      });

      const signature = await this.signer.signMessage(message);

      const response = await fetch(`${HYPERLIQUID_API_URL}/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action,
          nonce: timestamp,
          signature: signature,
          vault_address: null
        })
      });

      const result = await response.json();

      return {
        success: response.ok && result.status === 'ok',
        data: result
      };
    } catch (error) {
      console.error('[HL Trading] Error canceling order:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancel all orders for a coin
   */
  async cancelAllOrders(coin) {
    if (!this.signer || !this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const action = {
        type: 'cancelByCloid',
        cancels: [{
          coin: coin,
          cloid: null // Cancel all
        }]
      };

      const timestamp = Date.now();
      const message = JSON.stringify({
        action: action,
        nonce: timestamp,
        vault_address: null
      });

      const signature = await this.signer.signMessage(message);

      const response = await fetch(`${HYPERLIQUID_API_URL}/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action,
          nonce: timestamp,
          signature: signature,
          vault_address: null
        })
      });

      const result = await response.json();

      return {
        success: response.ok && result.status === 'ok',
        data: result
      };
    } catch (error) {
      console.error('[HL Trading] Error canceling all orders:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's open orders
   */
  async getOpenOrders() {
    if (!this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await fetch(`${HYPERLIQUID_API_URL}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'openOrders',
          user: this.address
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('[HL Trading] Error getting open orders:', error);
      return [];
    }
  }

  /**
   * Get user state (balances, positions, etc.)
   */
  async getUserState() {
    if (!this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await fetch(`${HYPERLIQUID_API_URL}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'clearinghouseState',
          user: this.address
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('[HL Trading] Error getting user state:', error);
      return null;
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    console.log('[HL Trading] Disconnected');
  }
}

// Export singleton instance
const hyperliquidTrading = new HyperliquidTradingService();
export default hyperliquidTrading;

