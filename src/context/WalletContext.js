import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet debe usarse dentro de WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  
  // Don't check for MetaMask on mount - only when user clicks connect

  const connectWallet = useCallback(async () => {
    // Always show MetaMask popup when user clicks connect
    setIsConnecting(true);
    setError(null);

    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask no está instalado. Por favor instala MetaMask para continuar.');
      }

      // If already connected, disconnect first to force reconnection with popup
      if (address) {
        disconnectWallet();
        // Small delay to ensure state is cleared
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // First, try to use wallet_requestPermissions which should show popup
      // This method can show popup even if already authorized
      let accounts;
      try {
        // Request permissions explicitly - this may show popup
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        
        // After requesting permissions, get accounts
        accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts',
          params: []
        });
      } catch (permError) {
        // If wallet_requestPermissions fails or is denied, check error code
        if (permError.code === 4001) {
          throw new Error('Conexión cancelada. Por favor, autoriza la conexión en MetaMask.');
        }
        
        // If method not supported or other error, fallback to eth_requestAccounts
        console.log('[Wallet] wallet_requestPermissions no disponible o error, usando eth_requestAccounts');
        accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts',
          params: []
        });
      }

      if (!accounts || accounts.length === 0) {
        throw new Error('Usuario rechazó la conexión');
      }

      const userAddress = accounts[0];
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const web3Signer = web3Provider.getSigner();

      // Connect wallet without requiring signature authentication
      // The actual signing will happen when placing orders
      setProvider(web3Provider);
      setSigner(web3Signer);
      setAddress(userAddress);

      console.log('[Wallet] Conectado:', userAddress);
    } catch (err) {
      console.error('[Wallet] Error al conectar:', err);
      
      let errorMessage = err.message || 'Error al conectar la wallet';
      
      if (err.code === 4001) {
        errorMessage = 'Conexión cancelada. Por favor, autoriza la conexión en MetaMask.';
      } else if (err.message?.includes('reject') || err.message?.includes('denied')) {
        errorMessage = 'Conexión rechazada. Por favor, autoriza la conexión en MetaMask.';
      } else if (err.message?.includes('MetaMask')) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      if (err.code === 4001 || err.message?.includes('reject') || err.message?.includes('denied')) {
        setAddress(null);
        setProvider(null);
        setSigner(null);
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
    console.log('[Wallet] Desconectado');
  }, [address]);

  useEffect(() => {
    // Only listen for account/chain changes if wallet is already connected
    // This prevents automatic reconnection on page load
    if (typeof window.ethereum !== 'undefined' && address && provider && signer) {
      const handleAccountsChanged = (accounts) => {
        // If accounts array is empty, user disconnected in MetaMask
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0].toLowerCase() !== address.toLowerCase()) {
          // User switched account in MetaMask - update to new account
          // Use existing provider/signer to avoid triggering MetaMask popup
          if (!provider || !signer) return;
          
          // Just update the address from the accounts array
          setAddress(accounts[0]);
          console.log('[Wallet] Cuenta cambiada a:', accounts[0]);
        }
      };

      const handleChainChanged = () => {
        // Reload page when network changes
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [address, provider, signer, disconnectWallet]);

  const value = {
    address,
    provider,
    signer,
    isConnected: !!address,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
