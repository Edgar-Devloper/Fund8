/**
 * Hyperliquid Trading Service
 * Handles order placement, cancellation, and transaction signing using the official Hyperliquid SDK
 */

import * as hl from '@nktkas/hyperliquid';
import { ethers } from 'ethers';

const HYPERLIQUID_API_URL = process.env.REACT_APP_HYPERLIQUID_ENV === 'testnet' 
  ? 'https://api.hyperliquid-testnet.xyz'
  : 'https://api.hyperliquid.xyz';

const IS_TESTNET = process.env.REACT_APP_HYPERLIQUID_ENV === 'testnet';

class HyperliquidTradingService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.exchangeClient = null;
  }

  /**
   * Initialize with Web3 provider and signer (from wallet connection)
   */
  async initialize(provider, signer) {
    try {
      if (!provider || !signer) {
        throw new Error('Provider and signer are required');
      }

      console.log('[HL Trading] Initializing trading service with SDK...');
      
      // Use the provider and signer directly from WalletContext
      this.provider = provider;
      this.signer = signer;
      this.address = await signer.getAddress();
      
      // Initialize the ExchangeClient with the ethers signer
      // The SDK handles signing correctly with msgpack and action_hash
      this.exchangeClient = new hl.ExchangeClient({
        wallet: this.signer, // ethers signer is compatible
        transport: new hl.HttpTransport({
          isTestnet: IS_TESTNET
        })
      });
      
      console.log('[HL Trading] Initialized with address:', this.address);
      return true;
    } catch (error) {
      console.error('[HL Trading] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Get coin index for a symbol
   * Hyperliquid uses coin indices (a: 0 for BTC, etc.)
   */
  async getCoinIndex(coinSymbol) {
    try {
      const infoClient = new hl.InfoClient({
        transport: new hl.HttpTransport({ isTestnet: IS_TESTNET })
      });
      
      const meta = await infoClient.metaAndAssetCtxs();
      const universe = meta?.universe || [];
      
      // Find the coin index
      const coinIndex = universe.findIndex(coin => 
        coin?.name?.toUpperCase() === coinSymbol.toUpperCase()
      );
      
      if (coinIndex === -1) {
        throw new Error(`Coin ${coinSymbol} not found in Hyperliquid universe`);
      }
      
      return coinIndex;
    } catch (error) {
      console.error('[HL Trading] Error getting coin index:', error);
      throw error;
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
    if (!this.exchangeClient || !this.address) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    try {
      console.log('[HL Trading] Placing order:', { coin, isBuy, price, size, orderType });

      // Get coin index
      const coinIndex = await this.getCoinIndex(coin);

      // Build the order according to Hyperliquid SDK format
      const order = {
        a: coinIndex, // asset index
        b: isBuy, // is buy
        p: price.toString(), // limit price
        s: size.toString(), // size
        r: false, // reduce only
        t: orderType === 'market' 
          ? { limit: { tif: 'Ioc' } } // Immediate-Or-Cancel for market
          : { limit: { tif: 'Gtc' } } // Good-Til-Cancelled for limit
      };

      // Place order using the SDK (handles signing automatically)
      const result = await this.exchangeClient.order({
        orders: [order],
        grouping: 'na'
      });

      console.log('[HL Trading] Order placed successfully:', result);

      // Parse result
      if (result && result.status === 'ok') {
        const orderId = result.response?.statuses?.[0]?.resting?.oid || 
                       result.response?.statuses?.[0]?.filled?.oid;
        
        return {
          success: true,
          data: result.response,
          orderId: orderId
        };
      } else {
        const errorMsg = result?.response || result?.error || 'Order placement failed';
        console.error('[HL Trading] Order failed:', errorMsg);
        return {
          success: false,
          error: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)
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
    if (!this.exchangeClient || !this.address) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    try {
      console.log('[HL Trading] Placing market order:', { coin, isBuy, size });

      // Get coin index
      const coinIndex = await this.getCoinIndex(coin);

      // For market orders, use a very high/low price with IOC
      // The SDK will handle it as a market order
      const order = {
        a: coinIndex,
        b: isBuy,
        p: isBuy ? '999999999' : '0.01', // Extreme price for market execution
        s: size.toString(),
        r: false,
        t: { limit: { tif: 'Ioc' } } // Immediate-Or-Cancel
      };

      // Place order using the SDK
      const result = await this.exchangeClient.order({
        orders: [order],
        grouping: 'na'
      });

      console.log('[HL Trading] Market order placed successfully:', result);

      if (result && result.status === 'ok') {
        const orderId = result.response?.statuses?.[0]?.resting?.oid || 
                       result.response?.statuses?.[0]?.filled?.oid;
        
        return {
          success: true,
          data: result.response,
          orderId: orderId
        };
      } else {
        const errorMsg = result?.response || result?.error || 'Market order placement failed';
        console.error('[HL Trading] Market order failed:', errorMsg);
        return {
          success: false,
          error: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)
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
    if (!this.exchangeClient || !this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      // Get coin index
      const coinIndex = await this.getCoinIndex(coin);

      // Cancel order using the SDK
      const result = await this.exchangeClient.cancel({
        cancels: [{
          a: coinIndex,
          o: orderId // order id
        }]
      });

      return {
        success: result?.status === 'ok',
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
    if (!this.exchangeClient || !this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      // Get coin index
      const coinIndex = await this.getCoinIndex(coin);

      // Cancel all orders using the SDK
      const result = await this.exchangeClient.cancel({
        cancels: [{
          a: coinIndex,
          cloid: null // null means cancel all
        }]
      });

      return {
        success: result?.status === 'ok',
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
      const infoClient = new hl.InfoClient({
        transport: new hl.HttpTransport({ isTestnet: IS_TESTNET })
      });
      
      const result = await infoClient.openOrders({ user: this.address });
      return result || [];
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
      const infoClient = new hl.InfoClient({
        transport: new hl.HttpTransport({ isTestnet: IS_TESTNET })
      });
      
      const result = await infoClient.clearinghouseState({ user: this.address });
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
    this.exchangeClient = null;
    console.log('[HL Trading] Disconnected');
  }
}

// Export singleton instance
const hyperliquidTrading = new HyperliquidTradingService();
export default hyperliquidTrading;
