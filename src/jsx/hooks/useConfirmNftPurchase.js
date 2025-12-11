import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../../context/WalletContext';
import { usePlatform } from '../../context/PlatformContext';
import { convertNftIdToReferralLink, normalizeReferralLink } from '../../utils/nftReferralHelper';
import { getReferralParamsWithFallback } from '../../utils/urlParams';
import { buyNft } from '../../features/smart-contracts/services/nft.service';
import { isOnBSC, ensureBSCNetwork, getCurrentChainId } from '../../utils/networkHelper';

/**
 * Hook para manejar la compra de NFT
 * Adaptado de DeFily para Fund8
 * Soporta NFT Básico (gratis) y Premium ($30)
 */
export const useConfirmNftPurchase = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { address, provider, signer } = useWallet();
  const { isFund8, referralParams } = usePlatform();
  
  const [nftName, setNftName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [referralLink, setReferralLink] = useState(null);
  const [characterParts, setCharacterParts] = useState(null);
  
  const mode = searchParams.get('mode');
  const animalType = searchParams.get('animalType');
  const characterId = searchParams.get('characterId');

  // Cargar referralLink desde nftId
  useEffect(() => {
    const loadReferralLink = async () => {
      if (referralParams.nftId !== null && referralParams.nftId !== undefined) {
        try {
          const link = await convertNftIdToReferralLink(referralParams.nftId);
          if (link) {
            setReferralLink(normalizeReferralLink(link));
            console.log('[useConfirmNftPurchase] ReferralLink cargado:', link);
          }
        } catch (error) {
          console.error('[useConfirmNftPurchase] Error al cargar referralLink:', error);
        }
      }
    };
    
    loadReferralLink();
  }, [referralParams.nftId]);

  // Cargar characterParts desde characterId (simplificado)
  useEffect(() => {
    if (characterId) {
      // En producción, aquí se decodificaría el characterId
      // Por ahora, crear un objeto básico
      setCharacterParts({
        type: animalType || 'dog',
        mode: mode || 'random',
        characterId: characterId
      });
    }
  }, [characterId, animalType, mode]);

  /**
   * Preflight: Validar antes de comprar
   * @param {string} nftType - 'basic' o 'premium'
   */
  const preflightPurchase = async (nftType = 'premium') => {
    if (!address || !signer) {
      throw new Error('Wallet no conectada');
    }

    if (!nftName.trim()) {
      throw new Error('El nombre del NFT es requerido');
    }

    if (!referralLink) {
      throw new Error('Referral link no disponible');
    }

    // Validar que esté en BSC (requerido para crear NFTs)
    const onBSC = await isOnBSC();
    if (!onBSC) {
      const currentChainId = await getCurrentChainId();
      let networkName = '';
      if (currentChainId === 998) {
        networkName = t('network.hyperliquid', 'Hyperliquid');
      } else if (currentChainId === 42161) {
        networkName = t('network.arbitrum', 'Arbitrum');
      } else {
        networkName = t('network.unknown_network', 'Red {{chainId}}', { chainId: currentChainId });
      }
      
      const errorMessage = t('nft.switch_to_bsc_message', 'Para crear NFTs, necesitas estar en Binance Smart Chain (BSC). Actualmente estás en {{network}}.', { network: networkName });
      
      // Intentar cambiar automáticamente a BSC
      const switchResult = await ensureBSCNetwork(true);
      if (!switchResult.success) {
        throw new Error(`${errorMessage}\n\n${t('nft.switch_network_error', 'Error: {{message}}', { message: switchResult.message })}`);
      }
      
      // Esperar un momento para que MetaMask procese el cambio
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar nuevamente después del cambio
      const stillOnBSC = await isOnBSC();
      if (!stillOnBSC) {
        throw new Error(`${errorMessage}\n\n${t('nft.switch_to_bsc_manual', 'Por favor, cambia manualmente a BSC en MetaMask y vuelve a intentar.')}`);
      }
    }

    if (nftType === 'premium') {
      // Validar balance de USDC (30 USDC)
      // TODO: Implementar validación de balance
      console.log('[preflightPurchase] Validando balance para Premium NFT...');
    }

    // Continuar con la compra
    return handlePurchase(nftType);
  };

  /**
   * Obtener el siguiente ID de imagen disponible para el NFT
   * Similar a getLastImageId en DeFily
   */
  const getNextAvailableImageId = async () => {
    // TODO: Implementar lógica para obtener el último ID de imagen
    // Por ahora, usar un ID temporal basado en timestamp
    // En producción, esto debería consultar el contrato StorageAdministrator
    const baseId = Math.floor(Date.now() / 1000) % 1000000;
    return baseId + 9; // Similar a DeFily que usa lastImageId + 9
  };

  /**
   * Subir character a IPFS y obtener CID
   * TODO: Implementar subida real a IPFS
   */
  const uploadCharacterToIPFS = async () => {
    // Por ahora, retornar un CID temporal
    // En producción, esto debería subir el characterParts a IPFS
    const tempCid = `Qm${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`;
    return tempCid;
  };

  /**
   * Manejar la compra del NFT usando el contrato NFT Manager
   * @param {string} nftType - 'basic' o 'premium'
   */
  const handlePurchase = async (nftType = 'premium') => {
    setIsLoading(true);
    
    try {
      console.log('[handlePurchase] Iniciando compra de NFT:', {
        type: nftType,
        name: nftName,
        referralLink,
        side: referralParams.side,
        address
      });

      // 1. Obtener ID de imagen disponible
      const nftImgId = await getNextAvailableImageId();
      console.log('[handlePurchase] NFT Image ID:', nftImgId);

      // 2. Subir character a IPFS (obtener CID)
      const cid = await uploadCharacterToIPFS();
      console.log('[handlePurchase] IPFS CID:', cid);

      // 3. Para Premium: Aprobar USDC antes de comprar
      if (nftType === 'premium') {
        // TODO: Implementar aprobación de USDC
        // await approveUSDC(30000000); // 30 USDC (6 decimales)
        console.log('[handlePurchase] Aprobando 30 USDC para Premium NFT...');
      }

      // 4. Preparar datos para buyNFT
      const buyNftData = {
        name: nftName.trim(),
        nftImgId: nftImgId,
        NFT_COLLECTION_ID: 0, // 0 = DeFily (todos los NFTs se crean en el árbol de DeFily)
        referralLink: referralLink,
        side: referralParams.side || 0
      };

      // 5. Llamar al contrato buyNFT
      console.log('[handlePurchase] Llamando a buyNFT del contrato NFT Manager...');
      const tx = await buyNft(signer, buyNftData, cid, false); // royaltyToken = false por defecto

      console.log('[handlePurchase] Transacción enviada:', tx.hash);

      // 6. Esperar confirmación
      console.log('[handlePurchase] Esperando confirmación...');
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log('[handlePurchase] NFT comprado exitosamente!', receipt);
        
        // 7. TODO: Sincronizar con backend
        // await syncNFTWithBackend(receipt.transactionHash, nftImgId);
        
        setIsLoading(false);
        return { 
          success: true, 
          transactionHash: receipt.transactionHash,
          nftImgId: nftImgId
        };
      } else {
        throw new Error('La transacción falló');
      }
    } catch (error) {
      console.error('[handlePurchase] Error completo:', error);
      setIsLoading(false);
      
      // Mejorar mensajes de error
      let errorMessage = error.message || 'Error desconocido al comprar NFT';
      
      // Si es un error de ethers.js, extraer el mensaje real
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.data && error.data.message) {
        errorMessage = error.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Crear nuevo error con mensaje mejorado
      const enhancedError = new Error(errorMessage);
      enhancedError.originalError = error;
      throw enhancedError;
    }
  };

  return {
    nftName,
    setNftName,
    isLoading,
    characterParts,
    mode,
    characterId,
    referralLink,
    preflightPurchase,
    handlePurchase
  };
};

