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
      
      this.provider = provider;
      this.signer = signer;
      this.address = await signer.getAddress();
      
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

  async getCoinIndex(coinSymbol) {
    try {
      const infoClient = new hl.InfoClient({
        transport: new hl.HttpTransport({ isTestnet: IS_TESTNET })
      });
      
      const meta = await infoClient.metaAndAssetCtxs();
      
      // La respuesta puede venir en diferentes formatos:
      // 1. { universe: [...], assetCtxs: {...} }
      // 2. [universe, assetCtxs] (array)
      // 3. Solo universe (array directo)
      let universe = [];
      
      if (Array.isArray(meta)) {
        if (meta.length > 0 && Array.isArray(meta[0])) {
          // Formato: [universe, assetCtxs] donde universe es un array
          universe = meta[0] || [];
        } else if (meta.length > 0 && typeof meta[0] === 'object' && meta[0] !== null) {
          // El primer elemento es un objeto
          if (Array.isArray(meta[0].universe)) {
            // Formato: [{universe: [...], assetCtxs: {...}}]
            universe = meta[0].universe;
          } else if (meta[0].name) {
            // Formato: array directo de coins [{name: 'BTC', ...}, ...]
            universe = meta.filter(item => item && typeof item === 'object' && item.name);
          } else {
            // Intentar buscar universe en el objeto
            const possibleUniverse = meta[0].universe || meta[0][0] || meta[0];
            if (Array.isArray(possibleUniverse)) {
              universe = possibleUniverse;
            } else {
              universe = [];
            }
          }
        } else if (meta.length > 0 && meta[0]?.name) {
          // Formato: array directo de coins
          universe = meta;
        } else {
          // Fallback: intentar usar el array completo si tiene elementos que parecen coins
          universe = meta.filter(item => item && typeof item === 'object' && (item.name || Array.isArray(item)));
        }
      } else if (meta?.universe) {
        // Formato: { universe: [...], assetCtxs: {...} }
        universe = Array.isArray(meta.universe) ? meta.universe : [];
      } else {
        universe = [];
      }
      
      // Asegurar que universe es siempre un array
      if (!Array.isArray(universe)) {
        universe = [];
      }
      
      // Log final para identificar el universo
      console.log('[HL Trading] Universe:', {
        length: universe.length,
        coins: Array.isArray(universe) ? universe.map(c => c?.name || c).filter(Boolean) : 'NOT AN ARRAY',
        sample: Array.isArray(universe) && universe.length > 0 ? universe.slice(0, 3) : []
      });
      
      // Normalizar el símbolo buscado (quitar sufijos como USDT, USDC, etc.)
      const normalizedSymbol = coinSymbol.toUpperCase().replace(/USDT|USDC|PERP/gi, '').trim();
      
      // Buscar por nombre exacto primero
      let coinIndex = universe.findIndex(coin => 
        coin?.name?.toUpperCase() === coinSymbol.toUpperCase()
      );
      
      // Si no se encuentra, buscar por nombre normalizado (sin sufijos)
      if (coinIndex === -1) {
        coinIndex = universe.findIndex(coin => {
          const coinName = coin?.name?.toUpperCase() || '';
          const normalizedCoinName = coinName.replace(/USDT|USDC|PERP/gi, '').trim();
          return normalizedCoinName === normalizedSymbol || coinName === normalizedSymbol;
        });
      }
      
      // Si aún no se encuentra, buscar por coincidencia parcial
      if (coinIndex === -1) {
        coinIndex = universe.findIndex(coin => {
          const coinName = coin?.name?.toUpperCase() || '';
          return coinName.includes(normalizedSymbol) || normalizedSymbol.includes(coinName);
        });
      }
      
      if (coinIndex === -1) {
        const availableCoins = Array.isArray(universe) 
          ? universe.map(c => c?.name).filter(Boolean).join(', ')
          : 'universe is not an array';
        const errorMsg = !Array.isArray(universe) || universe.length === 0 
          ? `Hyperliquid universe is empty or invalid. Check if you're using the correct environment (testnet/mainnet). Current: ${IS_TESTNET ? 'testnet' : 'mainnet'}. Universe type: ${typeof universe}`
          : `Coin ${coinSymbol} not found in Hyperliquid universe. Available coins: ${availableCoins || 'none'}`;
        throw new Error(errorMsg);
      }
      
      return coinIndex;
    } catch (error) {
      console.error('[HL Trading] Error getting coin index:', error.message);
      throw error;
    }
  }

  async placeOrder({ coin, isBuy, price, size, orderType = 'limit', nftId = null, stopPrice = null, trailingPercent = null, postOnly = false, reduceOnly = false, timeInForce = 'GTC', hidden = false }) {
    if (!this.exchangeClient || !this.address) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    try {
      const coinIndex = await this.getCoinIndex(coin);

      // Build order object based on order type
      let order = {
        a: coinIndex,
        b: isBuy,
        p: price.toString(),
        s: size.toString(),
        r: reduceOnly || false
      };

      // Handle different order types
      if (orderType === 'market') {
        // Market order: use IOC (Immediate or Cancel)
        order.t = { limit: { tif: 'Ioc' } };
        // For market orders, use extreme price to ensure execution
        order.p = isBuy ? '999999999' : '0.01';
      } else if (orderType === 'stop-limit' || orderType === 'stop-market') {
        // Stop orders require stop price
        if (!stopPrice) {
          throw new Error('Stop price is required for stop orders');
        }
        
        if (orderType === 'stop-limit') {
          // Stop Limit: trigger at stopPrice, execute at limit price
          order.t = {
            trigger: {
              triggerPx: stopPrice.toString(),
              isMarket: false,
              tpsl: null
            }
          };
        } else {
          // Stop Market: trigger at stopPrice, execute at market
          order.t = {
            trigger: {
              triggerPx: stopPrice.toString(),
              isMarket: true,
              tpsl: null
            }
          };
        }
      } else if (orderType === 'trailing-stop') {
        // Trailing stop: requires trailing distance
        if (!trailingPercent) {
          throw new Error('Trailing percent is required for trailing stop orders');
        }
        
        // Convert percentage to basis points (1% = 100 bps)
        const trailingBps = Math.round(parseFloat(trailingPercent) * 100);
        
        order.t = {
          trigger: {
            triggerPx: null, // Will be calculated dynamically
            isMarket: true,
            tpsl: 'sl', // Stop loss
            trailingPercent: trailingBps
          }
        };
      } else if (orderType === 'post-only') {
        // Post Only: must be maker, reject if would be taker
        order.t = { limit: { tif: 'Gtc', postOnly: true } };
      } else {
        // Default: Limit order
        const tifMap = {
          'GTC': 'Gtc',
          'IOC': 'Ioc',
          'FOK': 'Fok'
        };
        order.t = { limit: { tif: tifMap[timeInForce] || 'Gtc' } };
      }

      // Add hidden order flag if specified
      if (hidden) {
        order.hidden = true;
      }

      const result = await this.exchangeClient.order({
        orders: [order],
        grouping: 'na'
      });

      if (result && result.status === 'ok') {
        const orderId = result.response?.statuses?.[0]?.resting?.oid || 
                       result.response?.statuses?.[0]?.filled?.oid ||
                       result.response?.statuses?.[0]?.triggered?.oid;
        
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
  async placeMarketOrder({ coin, isBuy, size, nftId = null }) {
    if (!this.exchangeClient || !this.address) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    try {
      if (nftId) {
        console.log('[HL Trading] Market order linked to NFT ID:', nftId);
      }

      const coinIndex = await this.getCoinIndex(coin);

      const order = {
        a: coinIndex,
        b: isBuy,
        p: isBuy ? '999999999' : '0.01',
        s: size.toString(),
        r: false,
        t: { limit: { tif: 'Ioc' } }
      };

      const result = await this.exchangeClient.order({
        orders: [order],
        grouping: 'na'
      });

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

  async cancelOrder({ coin, orderId }) {
    if (!this.exchangeClient || !this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const coinIndex = await this.getCoinIndex(coin);

      const result = await this.exchangeClient.cancel({
        cancels: [{
          a: coinIndex,
          o: orderId
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

  async cancelAllOrders(coin) {
    if (!this.exchangeClient || !this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const coinIndex = await this.getCoinIndex(coin);

      const result = await this.exchangeClient.cancel({
        cancels: [{
          a: coinIndex,
          cloid: null
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

  async deposit({ coin, amount, clearinghouseAddress }) {
    throw new Error('Deposit functionality is under development and not yet activated');
    
    /*
    if (!this.provider || !this.signer || !this.address) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    try {
      console.log('[HL Trading] Depositing:', { coin, amount, clearinghouseAddress });

      // Get clearinghouse address if not provided
      let depositAddress = clearinghouseAddress;
      
      if (!depositAddress) {
        // Try to get from API
        const infoClient = new hl.InfoClient({
          transport: new hl.HttpTransport({ isTestnet: IS_TESTNET })
        });
        
        const metaAndAsset = await infoClient.metaAndAssetCtxs();
        depositAddress = metaAndAsset?.clearinghouseAddress || metaAndAsset?.vaultAddress;
        
        if (!depositAddress || depositAddress === '0x0000000000000000000000000000000000000000') {
          // Fallback to known addresses
          depositAddress = IS_TESTNET
            ? '0x0000000000000000000000000000000000000000' // TODO: Get testnet address
            : '0x5E7D83dA751F4C9694b13aF351B30aC108f32C38'; // Mainnet clearinghouse
        }
      }

      // Get token contract address based on coin
      // For now, we'll support USDC on Arbitrum
      const tokenAddresses = {
        'USDC': IS_TESTNET 
          ? '0x75faf114eafb1BDbe2F0316DF893fd58Ce45AF4F' // Arbitrum Sepolia USDC
          : '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' // Arbitrum Mainnet USDC
      };

      const tokenAddress = tokenAddresses[coin.toUpperCase()];
      if (!tokenAddress) {
        throw new Error(`Token ${coin} not supported for deposits. Currently only USDC is supported.`);
      }

      // ERC20 ABI for transfer
      const erc20Abi = [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function decimals() view returns (uint8)",
        "function balanceOf(address owner) view returns (uint256)"
      ];

      const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, this.signer);
      
      // Get decimals
      const decimals = await tokenContract.decimals();
      
      // Convert amount to wei/smallest unit
      const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);
      
      // Check balance
      const balance = await tokenContract.balanceOf(this.address);
      if (balance.lt(amountInWei)) {
        throw new Error(`Insufficient balance. You have ${ethers.utils.formatUnits(balance, decimals)} ${coin}, but trying to deposit ${amount} ${coin}.`);
      }

      // Execute transfer
      console.log('[HL Trading] Sending deposit transaction...', {
        token: coin,
        tokenAddress,
        depositAddress,
        amount: amount.toString(),
        amountInWei: amountInWei.toString()
      });

      const tx = await tokenContract.transfer(depositAddress, amountInWei);
      console.log('[HL Trading] Deposit transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('[HL Trading] Deposit transaction confirmed:', receipt.transactionHash);

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        data: receipt
      };
    } catch (error) {
      console.error('[HL Trading] Error depositing:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
    */
  }

  async withdraw({ coin, amount, destination }) {
    if (!this.exchangeClient || !this.address) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    try {
      console.log('[HL Trading] Withdrawing:', { coin, amount, destination });

      const destAddress = destination || this.address;

      const result = await this.exchangeClient.withdraw3({
        destination: destAddress,
        amount: amount.toString(),
        coin: coin
      });

      console.log('[HL Trading] Withdraw result:', result);

      if (result && result.status === 'ok') {
        return {
          success: true,
          data: result.response || result
        };
      } else {
        const errorMsg = result?.response || result?.error || 'Withdrawal failed';
        console.error('[HL Trading] Withdraw failed:', errorMsg);
        return {
          success: false,
          error: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)
        };
      }
    } catch (error) {
      console.error('[HL Trading] Error withdrawing:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  async approveAgent(stayConnected = false, agentAddress = null) {
    if (!this.address) {
      throw new Error('Trading service not initialized. Please connect your wallet first.');
    }

    if (!this.exchangeClient && this.provider && this.signer) {
      console.log('[HL Trading] ExchangeClient not initialized, initializing now...');
      await this.initialize(this.provider, this.signer);
    }

    if (!this.exchangeClient) {
      throw new Error('ExchangeClient not available. Please ensure wallet is properly connected.');
    }

    try {
      const finalAgentAddress = agentAddress || this.address;
      
      console.log('[HL Trading] Approving agent...', { 
        stayConnected, 
        agentAddress: finalAgentAddress,
        userAddress: this.address
      });

      const result = await this.exchangeClient.approveAgent({
        agentAddress: finalAgentAddress,
        agentName: stayConnected ? 'Persistent Connection' : null
      });

      console.log('[HL Trading] Agent approval result:', result);

      if (result && result.status === 'ok') {
        return {
          success: true,
          data: result.response || result
        };
      } else {
        const errorMsg = result?.response || result?.error || 'Agent approval failed';
        console.error('[HL Trading] Agent approval failed:', errorMsg);
        return {
          success: false,
          error: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)
        };
      }
    } catch (error) {
      console.error('[HL Trading] Error approving agent:', error);
      
      const errorMessage = error.message || '';
      const needsDeposit = errorMessage.includes('Must deposit') || 
                          errorMessage.includes('must deposit') ||
                          errorMessage.includes('deposit before');
      
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        needsDeposit: needsDeposit
      };
    }
  }

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
