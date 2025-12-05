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
  
  // Verificar si hay una cuenta conectada al montar (puede ser de Thirdweb)
  useEffect(() => {
    const checkInitialConnection = async () => {
      try {
        if (typeof window.ethereum !== 'undefined') {
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts',
            params: []
          });
          
          if (accounts && accounts.length > 0) {
            const connectedAddress = accounts[0];
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            const web3Signer = web3Provider.getSigner();
            setAddress(connectedAddress);
            setProvider(web3Provider);
            setSigner(web3Signer);
            console.log('[Wallet] Cuenta detectada al iniciar:', connectedAddress);
          }
        }
      } catch (err) {
        console.debug('[Wallet] Error al verificar cuenta inicial:', err);
      }
    };

    // Delay para permitir que Thirdweb se conecte primero
    const timeoutId = setTimeout(() => {
      checkInitialConnection();
    }, 1000); // Aumentado a 1 segundo para dar tiempo a Thirdweb

    return () => clearTimeout(timeoutId);
  }, []); // Solo ejecutar una vez al montar
  
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
  }, [address]);

  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setError(null);
    console.log('[Wallet] Desconectado');
  }, []);

  // Escuchar cambios de cuenta/chain (incluyendo cuando Thirdweb conecta)
  useEffect(() => {
    if (typeof window.ethereum === 'undefined') {
      return;
    }

      const handleAccountsChanged = (accounts) => {
      if (accounts && accounts.length > 0) {
        const newAddress = accounts[0];
        // Si la dirección cambió, actualizar (puede ser por Thirdweb o cambio manual)
        setAddress((currentAddress) => {
          if (newAddress.toLowerCase() !== currentAddress?.toLowerCase()) {
            // Actualizar provider/signer
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            const web3Signer = web3Provider.getSigner();
            setProvider(web3Provider);
            setSigner(web3Signer);
            console.log('[Wallet] Cuenta sincronizada:', newAddress);
            return newAddress;
          }
          return currentAddress;
        });
      } else {
        // Desconectado
        setAddress(null);
        setProvider(null);
        setSigner(null);
        setError(null);
        }
      };

      const handleChainChanged = () => {
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
  }, []); // Sin dependencias para evitar bucles infinitos

  const value = {
    address,
    provider,
    signer,
    isConnected: !!address,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    // Exponer setters para sincronización con Thirdweb
    setAddress,
    setProvider,
    setSigner
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
