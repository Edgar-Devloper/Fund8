import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '../../../context/WalletContext.js';
import { useTradingData } from './context/HyperliquidTradingProvider.js';
import { ethers } from 'ethers';
import { getMetaAndAssetCtxs } from '../../../api/apiService.js';
import EstablishConnectionModal from './EstablishConnectionModal';
import hyperliquidTrading from '../../../services/hyperliquidTrading.js';
import { useNotifications } from '../../../context/NotificationContext.js';
import './DepositModal.css';

// Import crypto icons
import usdcIcon from '../../../images/icons/USDC.png';
import btcIcon from '../../../images/icons/btc.png';
import ethIcon from '../../../images/icons/eth.png';
import solIcon from '../../../images/icons/sol.png';
import adaIcon from '../../../images/icons/ada.png';
import dogeIcon from '../../../images/icons/doge.png';
import ltcIcon from '../../../images/icons/ltc.png';
import moneroIcon from '../../../images/icons/monero.png';
import bnbIcon from '../../../images/icons/bnb.png';
import maticIcon from '../../../images/icons/matic.png';
import avaxIcon from '../../../images/icons/avax.png';
import atomIcon from '../../../images/icons/atom.png';

// Icon mapping
const iconMap = {
  'USDC': usdcIcon,
  'BTC': btcIcon,
  'ETH': ethIcon,
  'SOL': solIcon,
  'ADA': adaIcon,
  'DOGE': dogeIcon,
  'LTC': ltcIcon,
  'XMR': moneroIcon,
  'BNB': bnbIcon,
  'MATIC': maticIcon,
  'AVAX': avaxIcon,
  'ATOM': atomIcon,
};

// Arbitrum chain IDs
const ARBITRUM_MAINNET_CHAIN_ID = '0xa4b1'; // 42161
const ARBITRUM_SEPOLIA_CHAIN_ID = '0x66eee'; // 421614
const ARBITRUM_MAINNET_HEX = '0xa4b1';
const ARBITRUM_SEPOLIA_HEX = '0x66eee';

// USDC contract address on Arbitrum
const USDC_ARBITRUM_MAINNET = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
const USDC_ARBITRUM_SEPOLIA = '0x75faf114eafb1BDbe2F0316DF893fd58Ce45AF4F';

// ABI mínimo para USDC (balanceOf, decimals)
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const DepositModal = ({ onClose }) => {
  const { address, isConnected, provider, signer } = useWallet();
  const { tradingInitialized } = useTradingData();
  const [currentChainId, setCurrentChainId] = useState(null);
  const [isArbitrum, setIsArbitrum] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState('0.00');
  const [amount, setAmount] = useState('');
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [showEstablishConnection, setShowEstablishConnection] = useState(true);
  const [agentApproved, setAgentApproved] = useState(false);
  const [approvingAgent, setApprovingAgent] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState('USDC');
  const [selectedChain, setSelectedChain] = useState('Arbitrum');
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);
  const [showChainDropdown, setShowChainDropdown] = useState(false);
  const [availableAssets, setAvailableAssets] = useState(['USDC', 'USDT', 'BTC', 'ETH', 'SOL']);
  const [depositing, setDepositing] = useState(false);
  const assetDropdownRef = useRef(null);
  const chainDropdownRef = useRef(null);
  const { addNotification } = useNotifications();

  const IS_TESTNET = process.env.REACT_APP_HYPERLIQUID_ENV === 'testnet';
  const targetChainId = IS_TESTNET ? ARBITRUM_SEPOLIA_CHAIN_ID : ARBITRUM_MAINNET_CHAIN_ID;
  const usdcAddress = IS_TESTNET ? USDC_ARBITRUM_SEPOLIA : USDC_ARBITRUM_MAINNET;

  // Deposit chain options
  const depositChains = [
    { value: 'Arbitrum', label: 'Arbitrum', note: 'Swap USDT for USDC' }
  ];

  // Fetch available assets from Hyperliquid API
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await getMetaAndAssetCtxs();
        const universe = Array.isArray(response) ? response[0]?.universe : response?.universe || [];
        
        if (universe && universe.length > 0) {
          // Extract asset names from universe
          const assets = universe
            .map(coin => coin?.name)
            .filter(Boolean)
            .sort();
          
          // Ensure USDC is first
          const sortedAssets = ['USDC', ...assets.filter(a => a !== 'USDC')];
          setAvailableAssets(sortedAssets);
        }
      } catch (err) {
        console.error('[DepositModal] Error fetching assets:', err);
        // Use default assets on error
      }
    };

    fetchAssets();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (assetDropdownRef.current && !assetDropdownRef.current.contains(event.target)) {
        setShowAssetDropdown(false);
      }
      if (chainDropdownRef.current && !chainDropdownRef.current.contains(event.target)) {
        setShowChainDropdown(false);
      }
    };

    if (showAssetDropdown || showChainDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAssetDropdown, showChainDropdown]);

  // Check current network
  useEffect(() => {
    const checkNetwork = async () => {
      if (!provider || !window.ethereum) return;

      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setCurrentChainId(chainId);
        setIsArbitrum(
          chainId === ARBITRUM_MAINNET_HEX || 
          chainId === ARBITRUM_SEPOLIA_HEX ||
          chainId === ARBITRUM_MAINNET_CHAIN_ID ||
          chainId === ARBITRUM_SEPOLIA_CHAIN_ID ||
          parseInt(chainId, 16) === 42161 ||
          parseInt(chainId, 16) === 421614
        );
      } catch (err) {
        console.error('[DepositModal] Error checking network:', err);
      }
    };

    checkNetwork();

    // Listen for chain changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', (chainId) => {
        setCurrentChainId(chainId);
        setIsArbitrum(
          chainId === ARBITRUM_MAINNET_HEX || 
          chainId === ARBITRUM_SEPOLIA_HEX ||
          chainId === ARBITRUM_MAINNET_CHAIN_ID ||
          chainId === ARBITRUM_SEPOLIA_CHAIN_ID ||
          parseInt(chainId, 16) === 42161 ||
          parseInt(chainId, 16) === 421614
        );
        // Reload balance when chain changes
        if (address && isArbitrum) {
          fetchUsdcBalance();
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, [provider, address]);

  // Fetch USDC balance on Arbitrum
  const fetchUsdcBalance = async () => {
    if (!provider || !address || !isArbitrum) {
      setUsdcBalance('0.00');
      return;
    }

    try {
      setLoadingBalance(true);
      const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, provider);
      const balance = await usdcContract.balanceOf(address);
      const decimals = await usdcContract.decimals();
      const formattedBalance = ethers.utils.formatUnits(balance, decimals);
      setUsdcBalance(parseFloat(formattedBalance).toFixed(2));
    } catch (err) {
      console.error('[DepositModal] Error fetching USDC balance:', err);
      setUsdcBalance('0.00');
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    if (isArbitrum && address && provider) {
      fetchUsdcBalance();
    }
  }, [isArbitrum, address, provider]);

  // Switch to Arbitrum network
  const switchToArbitrum = async () => {
    if (!window.ethereum) {
      addNotification({
        type: 'error',
        message: 'MetaMask is not installed',
        duration: 3000
      });
      return;
    }

    try {
      const chainIdHex = IS_TESTNET 
        ? ARBITRUM_SEPOLIA_HEX 
        : ARBITRUM_MAINNET_HEX;

      // Try to switch to Arbitrum
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          const chainConfig = IS_TESTNET
            ? {
                chainId: ARBITRUM_SEPOLIA_HEX,
                chainName: 'Arbitrum Sepolia',
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
                blockExplorerUrls: ['https://sepolia.arbiscan.io']
              }
            : {
                chainId: ARBITRUM_MAINNET_HEX,
                chainName: 'Arbitrum One',
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://arb1.arbitrum.io/rpc'],
                blockExplorerUrls: ['https://arbiscan.io']
              };

          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [chainConfig],
          });
        } catch (addError) {
          console.error('[DepositModal] Error adding Arbitrum chain:', addError);
          addNotification({
            type: 'error',
            message: 'Failed to add Arbitrum network to MetaMask',
            duration: 5000
          });
        }
      } else {
        console.error('[DepositModal] Error switching to Arbitrum:', switchError);
        addNotification({
          type: 'error',
          message: 'Failed to switch to Arbitrum network',
          duration: 5000
        });
      }
    }
  };

  // Check if agent is already approved
  useEffect(() => {
    const checkAgentStatus = async () => {
      const stored = localStorage.getItem('hyperliquid_agent_approved');
      if (stored === 'true') {
        setAgentApproved(true);
        setShowEstablishConnection(false);
      }
    };
    checkAgentStatus();
  }, []);

  const handleEstablishConnection = async (stayConnected) => {
    if (!isConnected || !address) {
      addNotification({
        type: 'error',
        message: 'Please connect your wallet first',
        duration: 3000
      });
      return;
    }

    if (!provider || !signer) {
      addNotification({
        type: 'error',
        message: 'Wallet provider and signer are required. Please reconnect your wallet.',
        duration: 3000
      });
      return;
    }

    setApprovingAgent(true);

    try {
      if (!tradingInitialized) {
        console.log('[DepositModal] Initializing trading service...');
        const initialized = await hyperliquidTrading.initialize(provider, signer);
        if (!initialized) {
          throw new Error('Failed to initialize trading service. Please try again.');
        }
      } else {
        const currentAddress = await signer.getAddress();
        if (currentAddress !== address) {
          console.log('[DepositModal] Wallet address changed, reinitializing service...');
          await hyperliquidTrading.initialize(provider, signer);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('[DepositModal] Calling approveAgent with address:', address);
      const result = await hyperliquidTrading.approveAgent(stayConnected, address);

      if (result.success) {
        setAgentApproved(true);
        setShowEstablishConnection(false);
        if (stayConnected) {
          localStorage.setItem('hyperliquid_agent_approved', 'true');
        }
        addNotification({
          type: 'success',
          message: 'Connection established successfully',
          duration: 3000
        });
      } else {
        if (result.needsDeposit) {
          setShowEstablishConnection(false);
          addNotification({
            type: 'info',
            message: 'Please make a deposit first, then establish connection',
            duration: 4000
          });
        } else {
          addNotification({
            type: 'error',
            message: result.error || 'Failed to establish connection',
            duration: 5000
          });
        }
      }
    } catch (error) {
      console.error('[DepositModal] Error approving agent:', error);
      addNotification({
        type: 'error',
        message: error.message || 'An error occurred while establishing connection',
        duration: 5000
      });
    } finally {
      setApprovingAgent(false);
    }
  };

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !approvingAgent) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, approvingAgent]);

  const handleMaxAmount = () => {
    setAmount(usdcBalance);
  };

  const handleDeposit = async () => {
    // TODO: Implementación de depósito comentada por seguridad
    // Necesita pruebas exhaustivas antes de habilitarse
    // La funcionalidad está implementada en hyperliquidTrading.js pero no activa
    
    addNotification({
      type: 'info',
      message: 'Deposit functionality is under development and testing. Coming soon.',
      duration: 4000
    });
    
    // CÓDIGO COMENTADO - Descomentar cuando se esté listo para probar
    /*
    if (!isConnected || !address) {
      addNotification({
        type: 'error',
        message: 'Please connect your wallet first',
        duration: 3000
      });
      return;
    }

    if (!isArbitrum) {
      addNotification({
        type: 'error',
        message: 'Please switch to Arbitrum network first',
        duration: 3000
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      addNotification({
        type: 'error',
        message: 'Please enter a valid amount',
        duration: 3000
      });
      return;
    }

    if (parseFloat(amount) > parseFloat(usdcBalance)) {
      addNotification({
        type: 'error',
        message: `Amount exceeds available balance (${usdcBalance} ${selectedAsset})`,
        duration: 3000
      });
      return;
    }

    setDepositing(true);

    try {
      // Ensure trading service is initialized
      if (!tradingInitialized && provider && signer) {
        await hyperliquidTrading.initialize(provider, signer);
      }

      const result = await hyperliquidTrading.deposit({
        coin: selectedAsset,
        amount: parseFloat(amount)
      });

      if (result.success) {
        addNotification({
          type: 'success',
          message: `Deposit successful! Transaction: ${result.transactionHash?.slice(0, 10)}...`,
          duration: 5000
        });
        
        // Refresh balance
        await fetchUsdcBalance();
        
        // Clear amount
        setAmount('');
        
        // Close modal after a delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        addNotification({
          type: 'error',
          message: result.error || 'Deposit failed. Please try again.',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('[DepositModal] Error depositing:', error);
      addNotification({
        type: 'error',
        message: error.message || 'An error occurred during deposit',
        duration: 5000
      });
    } finally {
      setDepositing(false);
    }
    */
  };

  // Show Establish Connection modal first
  if (showEstablishConnection && !agentApproved) {
    return (
      <EstablishConnectionModal
        onClose={onClose}
        onConfirm={handleEstablishConnection}
        isApproving={approvingAgent}
      />
    );
  }

  return (
    <div 
      className="deposit-modal-overlay" 
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="deposit-modal-content-new">
        <div className="deposit-modal-header-new">
          <div className="asset-icon-container">
            <img 
              src={iconMap[selectedAsset] || usdcIcon} 
              alt={selectedAsset}
              className="asset-icon"
            />
          </div>
          <h5>Deposit {selectedAsset} from Arbitrum</h5>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="deposit-modal-body-new">
          <div className="deposit-field" ref={assetDropdownRef}>
            <label>Asset</label>
            <div 
              className="deposit-input-select"
              onClick={() => {
                setShowAssetDropdown(!showAssetDropdown);
                setShowChainDropdown(false);
              }}
            >
              <span>{selectedAsset}</span>
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 12 12" 
                fill="none"
                style={{ transform: showAssetDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
              >
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {showAssetDropdown && (
              <div className="deposit-dropdown-menu">
                {availableAssets.map((asset) => (
                  <div
                    key={asset}
                    className={`deposit-dropdown-item ${selectedAsset === asset ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedAsset(asset);
                      setShowAssetDropdown(false);
                    }}
                  >
                    {asset}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="deposit-field" ref={chainDropdownRef}>
            <label>Deposit Chain</label>
            <div 
              className="deposit-input-select"
              onClick={() => {
                setShowChainDropdown(!showChainDropdown);
                setShowAssetDropdown(false);
              }}
            >
              <div className="chain-select-content">
                {selectedChain === 'Arbitrum' ? (
                  <>
                    <span className="chain-name-in-select">Arbitrum</span>
                    <span className="chain-note-in-select">({depositChains[0].note})</span>
                  </>
                ) : (
                  <span>{selectedChain}</span>
                )}
              </div>
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 12 12" 
                fill="none"
                style={{ transform: showChainDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
              >
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {showChainDropdown && (
              <div className="deposit-dropdown-menu">
                {depositChains.map((chain) => (
                  <div
                    key={chain.value}
                    className={`deposit-dropdown-item ${selectedChain === chain.value ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedChain(chain.value);
                      setShowChainDropdown(false);
                    }}
                  >
                    <div className="chain-option">
                      <span className="chain-name">{chain.label}</span>
                      {chain.note && <span className="chain-note-small">{chain.note}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="deposit-field">
            <label>Amount</label>
            <div className="deposit-amount-input-group">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="deposit-amount-input"
                disabled={!isArbitrum || loadingBalance}
              />
              <button
                className="max-button"
                onClick={handleMaxAmount}
                disabled={!isArbitrum || loadingBalance || parseFloat(usdcBalance) === 0}
              >
                MAX: {loadingBalance ? '...' : usdcBalance}
              </button>
            </div>
          </div>
        </div>
        
        <div className="deposit-modal-footer-new">
          {!isArbitrum ? (
            <button 
              className="btn-switch-arbitrum"
              onClick={switchToArbitrum}
            >
              Switch to Arbitrum to Deposit
            </button>
          ) : (
            <button 
              className="btn-deposit"
              onClick={() => {
                addNotification({
                  type: 'info',
                  message: 'Deposit functionality is under development and testing. Coming soon.',
                  duration: 4000
                });
              }}
              disabled={true}
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            >
              Deposit (Coming Soon)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepositModal;
