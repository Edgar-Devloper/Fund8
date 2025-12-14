import React, { createContext, useState, useContext, useCallback, useEffect, useRef, useMemo } from 'react';
import { useWallet } from './WalletContext';
import { getAllMyNFT } from '../features/smart-contracts/services/nft.service';

const NFTContext = createContext(undefined);

const STORAGE_KEY_PREFIX = 'selectedNFTId_';

const getStorageKey = (address) => {
  return address ? `${STORAGE_KEY_PREFIX}${address.toLowerCase()}` : null;
};

export const useNFT = () => {
  const context = useContext(NFTContext);
  if (!context) {
    console.warn('[useNFT] Contexto no disponible, usando valores por defecto');
    // Retornar valores por defecto en lugar de lanzar error
    return {
      nfts: [],
      selectedNFT: null,
      isLoading: false,
      error: null,
      hasNFTs: false,
      defilyNFTs: [],
      fund8NFTs: [],
      hasDefilyNFTs: false,
      hasFund8NFTs: false,
      selectNFT: () => {
        console.warn('[useNFT] selectNFT no disponible');
      },
      deselectNFT: () => {
        console.warn('[useNFT] deselectNFT no disponible');
      },
      loadNFTs: () => {
        console.warn('[useNFT] loadNFTs no disponible');
      },
      getNFTsByType: () => []
    };
  }
  return context;
};

export const NFTProvider = ({ children }) => {
  const { provider, address, isConnected } = useWallet();
  
  const [nfts, setNfts] = useState([]);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const prevAddressRef = useRef(null);
  const loadingRef = useRef(false);

  const loadNFTs = useCallback(async () => {
    if (!address) {
      setNfts([]);
      setSelectedNFT(null);
      prevAddressRef.current = null;
      loadingRef.current = false;
      return;
    }

    if (!isConnected && !address) {
      setNfts([]);
      setSelectedNFT(null);
      prevAddressRef.current = null;
      loadingRef.current = false;
      return;
    }

    if (loadingRef.current) {
      return;
    }

    const addressChanged = prevAddressRef.current && 
      prevAddressRef.current.toLowerCase() !== address.toLowerCase();

    if (addressChanged) {
      setSelectedNFT(null);
      const oldStorageKey = getStorageKey(prevAddressRef.current);
      if (oldStorageKey) {
        localStorage.removeItem(oldStorageKey);
      }
    }

    prevAddressRef.current = address;
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // getAllMyNFT usa su propio BSC provider, así que el provider pasado es opcional
      // Para embedded wallets, podemos pasar null o el provider si está disponible
          const nftsData = await getAllMyNFT(provider || null, address);
          setNfts(nftsData);
      
      if (nftsData.length === 0) {
        setSelectedNFT(null);
        const storageKey = getStorageKey(address);
        if (storageKey) {
          localStorage.removeItem(storageKey);
        }
      } else {
        const storageKey = getStorageKey(address);
        const savedNFTId = storageKey ? localStorage.getItem(storageKey) : null;
        
        // Verificar si el modal se mostró antes para esta wallet
        const modalShownKey = `nftModalShownOnce_${address.toLowerCase()}`;
        const modalShownBefore = localStorage.getItem(modalShownKey) === 'true';
        
        let nftToSelect = null;
        
        if (savedNFTId && modalShownBefore) {
          const savedNFT = nftsData.find(nft => nft.id === Number(savedNFTId));
          if (savedNFT && savedNFT.ownerAddress.toLowerCase() === address.toLowerCase()) {
            nftToSelect = savedNFT;
          } else {
            if (storageKey) {
              localStorage.removeItem(storageKey);
            }
          }
        } else if (savedNFTId && !modalShownBefore) {
          if (storageKey) {
            localStorage.removeItem(storageKey);
          }
        }
        
        setSelectedNFT(nftToSelect);
      }
    } catch (err) {
      console.error('[NFT Context] Error al cargar NFTs:', err);
      setError(err.message || 'Error desconocido al cargar NFTs');
      setNfts([]);
      setSelectedNFT(null);
      const storageKey = getStorageKey(address);
      if (storageKey) {
        localStorage.removeItem(storageKey);
      }
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [provider, address, isConnected]);

  const selectNFT = useCallback((nft) => {
    if (!nft || !address) {
      setSelectedNFT(null);
      const storageKey = getStorageKey(address);
      if (storageKey) {
        localStorage.removeItem(storageKey);
      }
      return;
    }

    const nftExists = nfts.find(n => n.id === nft.id);
    if (!nftExists) {
      return;
    }

    if (nftExists.ownerAddress && nftExists.ownerAddress.toLowerCase() !== address.toLowerCase()) {
      setSelectedNFT(null);
      const storageKey = getStorageKey(address);
      if (storageKey) {
        localStorage.removeItem(storageKey);
      }
      return;
    }

    setSelectedNFT(nft);
    const storageKey = getStorageKey(address);
    if (storageKey) {
      localStorage.setItem(storageKey, nft.id.toString());
    }
  }, [nfts, address]);

  const deselectNFT = useCallback(() => {
    setSelectedNFT(null);
    const storageKey = getStorageKey(address);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  }, [address]);

  const getNFTsByType = useCallback((type) => {
    return nfts.filter(nft => nft.type === type);
  }, [nfts]);

  const defilyNFTs = useMemo(() => getNFTsByType('defily'), [getNFTsByType]);
  const fund8NFTs = useMemo(() => getNFTsByType('fund8'), [getNFTsByType]);

  useEffect(() => {
    // Para wallets de email (embedded wallets), solo necesitamos address
    // Para MetaMask, necesitamos provider también
    if (address) {
        const isEmbeddedWallet = typeof window.ethereum === 'undefined';
        if (isEmbeddedWallet || provider) {
          loadNFTs();
        }
    } else {
      setNfts([]);
      setSelectedNFT(null);
      prevAddressRef.current = null;
      loadingRef.current = false;
    }
  }, [isConnected, provider, address, loadNFTs]);

  useEffect(() => {
    if (selectedNFT && address && nfts.length > 0) {
      const nftInList = nfts.find(nft => nft.id === selectedNFT.id);
      if (!nftInList || (nftInList.ownerAddress && nftInList.ownerAddress.toLowerCase() !== address.toLowerCase())) {
        setSelectedNFT(null);
        const storageKey = getStorageKey(address);
        if (storageKey) {
          localStorage.removeItem(storageKey);
        }
      }
    }
  }, [nfts, address, selectedNFT]);

  const value = useMemo(() => ({
    // Estado
    nfts,
    selectedNFT,
    isLoading,
    error,
    
    // Acciones
    selectNFT,
    deselectNFT,
    loadNFTs,
    getNFTsByType,
    
    // Helpers
    hasNFTs: nfts.length > 0,
    defilyNFTs,
    fund8NFTs,
    hasDefilyNFTs: defilyNFTs.length > 0,
    hasFund8NFTs: fund8NFTs.length > 0,
  }), [nfts, selectedNFT, isLoading, error, selectNFT, deselectNFT, loadNFTs, getNFTsByType, defilyNFTs, fund8NFTs]);

  return (
    <NFTContext.Provider value={value}>
      {children}
    </NFTContext.Provider>
  );
};

