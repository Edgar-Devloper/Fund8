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

  const connectWallet = useCallback(async () => {
    // connects wallet and requires message signature for authentication
    setIsConnecting(true);
    setError(null);

    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask no está instalado. Por favor instala MetaMask para continuar.');
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts',
        params: []
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('Usuario rechazó la conexión');
      }

      const userAddress = accounts[0];
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const web3Signer = web3Provider.getSigner();

      const message = `Por favor, firma este mensaje para autenticarte en Fund8 Trading Panel.\n\nDirección: ${userAddress}\nTiempo: ${new Date().toISOString()}`;
      
      const signature = await web3Signer.signMessage(message);
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      
      // verifies signature matches connected address
      if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) {
        throw new Error('La firma no es válida');
      }

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAddress(userAddress);

      console.log('[Wallet] Conectado y autenticado con firma:', userAddress);
    } catch (err) {
      console.error('[Wallet] Error al conectar:', err);
      
      let errorMessage = err.message || 'Error al conectar la wallet';
      
      if (err.code === 4001) {
        errorMessage = 'Firma cancelada. Por favor, firma el mensaje para conectar tu wallet.';
      } else if (err.message?.includes('reject') || err.message?.includes('denied')) {
        errorMessage = 'Firma rechazada. Por favor, firma el mensaje para conectar tu wallet.';
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
  }, []);

  useEffect(() => {
    // listens for account/chain changes in metamask
    if (typeof window.ethereum !== 'undefined' && address) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== address) {
          // updates wallet when user switches account in metamask
          if (!window.ethereum) return;
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
          const web3Signer = web3Provider.getSigner();
          web3Signer.getAddress().then(newAddress => {
            setAddress(newAddress);
            setProvider(web3Provider);
            setSigner(web3Signer);
            console.log('[Wallet] Cuenta cambiada a:', newAddress);
          });
        }
      };

      const handleChainChanged = () => {
        // reloads page when network changes
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
  }, [address, disconnectWallet]);

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
