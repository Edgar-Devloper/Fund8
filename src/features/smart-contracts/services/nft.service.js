import { ethers } from 'ethers';
import { storageAdministratorAbi } from '../abis/storageAdministrator.abi';
import { nftManagerAbi } from '../abis/nftManager.abi';

const STORAGE_ADMINISTRATOR_BSC = 
  process.env.REACT_APP_STORAGE_ADMINISTRATOR_CONTRACT_ADDRESS || 
  process.env.REACT_APP_DEFILY_STORAGE_ADMINISTRATOR_ADDRESS;

const STORAGE_ADMINISTRATOR_ARBITRUM = 
  process.env.REACT_APP_STORAGE_ADMINISTRATOR_ARBITRUM ||
  process.env.REACT_APP_FUND8_STORAGE_ADMINISTRATOR_ADDRESS;

const NFT_CONTRACT_ADDRESS = 
  process.env.REACT_APP_NFT_CONTRACT_ADDRESS || 
  process.env.REACT_APP_DEFILY_NFT_CONTRACT_ADDRESS;

const CHAIN_IDS = {
  BSC_MAINNET: 56,
  BSC_TESTNET: 97,
  ARBITRUM_ONE: 42161,
  ARBITRUM_SEPOLIA: 421614,
  ARBITRUM_NOVA: 42170
};

const getStorageAdministratorAddress = (chainId) => {
  const chainIdNumber = Number(chainId);
  
  if (chainIdNumber === CHAIN_IDS.ARBITRUM_ONE || 
      chainIdNumber === CHAIN_IDS.ARBITRUM_SEPOLIA || 
      chainIdNumber === CHAIN_IDS.ARBITRUM_NOVA) {
    if (STORAGE_ADMINISTRATOR_ARBITRUM) {
      return STORAGE_ADMINISTRATOR_ARBITRUM;
    }
    throw new Error(
      `Estás conectado a Arbitrum (ChainID: ${chainIdNumber}) pero no hay dirección configurada.\n` +
      `Agrega REACT_APP_STORAGE_ADMINISTRATOR_ARBITRUM en tu archivo .env con la dirección del contrato en Arbitrum.`
    );
  }
  
  if (STORAGE_ADMINISTRATOR_BSC) {
    return STORAGE_ADMINISTRATOR_BSC;
  }
  
  throw new Error('No hay dirección de StorageAdministrator configurada para ninguna red');
};

const getBSCProvider = () => {
  const BSC_MAINNET_RPC = process.env.REACT_APP_BSC_RPC_URL || 'https://bsc-dataseed1.binance.org/';
  const BSC_TESTNET_RPC = process.env.REACT_APP_BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
  const useTestnet = process.env.REACT_APP_USE_BSC_TESTNET === 'true';
  const rpcUrl = useTestnet ? BSC_TESTNET_RPC : BSC_MAINNET_RPC;
  return new ethers.providers.JsonRpcProvider(rpcUrl);
};

export const getAllMyNFT = async (provider, walletAddress) => {
  if (!walletAddress) {
    throw new Error('walletAddress es requerido');
  }

  try {
    const bscProvider = getBSCProvider();
    const bscNetwork = await bscProvider.getNetwork();
    const STORAGE_ADMINISTRATOR_ADDRESS = STORAGE_ADMINISTRATOR_BSC;
    
    if (!STORAGE_ADMINISTRATOR_ADDRESS) {
      throw new Error(
        `No hay dirección de StorageAdministrator configurada para BSC.\n` +
        `Configura REACT_APP_STORAGE_ADMINISTRATOR_CONTRACT_ADDRESS en tu .env con la dirección del contrato en BSC.`
      );
    }

    if (!ethers.utils.isAddress(STORAGE_ADMINISTRATOR_ADDRESS)) {
      throw new Error(`Dirección de contrato inválida: ${STORAGE_ADMINISTRATOR_ADDRESS}`);
    }

    const code = await bscProvider.getCode(STORAGE_ADMINISTRATOR_ADDRESS);
    
    if (code === '0x' || code === '0x0' || !code || code.length < 10) {
      const networkName = bscNetwork.name || 'Unknown';
      throw new Error(
        `No se encontró contrato en la dirección ${STORAGE_ADMINISTRATOR_ADDRESS}\n` +
        `Red BSC: ${networkName} (ChainID: ${Number(bscNetwork.chainId)})\n\n` +
        `El StorageAdministrator debe estar desplegado en BSC.\n` +
        `Verifica que la dirección del contrato sea correcta para BSC.`
      );
    }

    const contract = new ethers.Contract(
      STORAGE_ADMINISTRATOR_ADDRESS,
      storageAdministratorAbi,
      bscProvider
    );

    let nftIds;
    try {
      nftIds = await contract.getMyNFTIds(walletAddress);
    } catch (callError) {
      if (callError.message && callError.message.includes('revert')) {
        throw new Error(
          `Error al llamar al contrato. Posibles causas:\n` +
          `1. El método getMyNFTIds no existe en este contrato\n` +
          `2. El contrato está pausado\n` +
          `3. No tienes permisos para llamar este método\n` +
          `4. La dirección del contrato es incorrecta\n\n` +
          `Dirección del contrato: ${STORAGE_ADMINISTRATOR_ADDRESS}\n` +
          `Red BSC: ${bscNetwork.name} (ChainID: ${Number(bscNetwork.chainId)})\n` +
          `Error original: ${callError.message}`
        );
      }
      throw callError;
    }
    
    const nftIdsArray = nftIds.map(id => Number(id.toString()));

    if (nftIdsArray.length === 0) {
      return [];
    }

    const nftData = await contract.getUserNftAccDataBulk(nftIds);
    const ipfsLinks = await contract.getNftIPFSLinkBulk(nftIds);

    const formattedNFTs = nftIdsArray.map((id, index) => {
      const data = nftData[index];
      const referralsLink = data.referralsLink;
      let ownerId = null;
      
      if (referralsLink) {
        if (!isNaN(Number(referralsLink)) && referralsLink.trim() !== '') {
          ownerId = Number(referralsLink);
        } else {
          const numericMatch = referralsLink.match(/\d+/);
          if (numericMatch && numericMatch[0].length >= 2) {
            ownerId = Number(numericMatch[0]);
          }
        }
      }
      
      return {
        id: Number(data.tokenId.toString()),
        name: data.name,
        nftImgId: Number(data.nftImgId.toString()),
        NFT_COLLECTION_ID: Number(data.NFT_COLLECTION_ID.toString()),
        tokenId: Number(data.tokenId.toString()),
        ownerAddress: data.ownerAddress,
        referralsLink: referralsLink,
        leftSide: data.leftSide.map(s => Number(s.toString())),
        rightSide: data.rightSide.map(s => Number(s.toString())),
        planId: Number(data.planId.toString()),
        createdAt: Number(data.createdAt.toString()),
        membershipPlanBoughtDate: Number(data.membershipPlanBoughtDate.toString()),
        ipfsLink: ipfsLinks[index] || null,
        type: Number(data.NFT_COLLECTION_ID.toString()) === 0 ? 'defily' : 'fund8',
        ownerId: ownerId,
      };
    });

    console.log('[Storage Administrator] Datos Recibidos', {
      contrato: STORAGE_ADMINISTRATOR_ADDRESS,
      cantidadNFTs: formattedNFTs.length,
      nfts: formattedNFTs.map(nft => ({
        ...nft,
        ownerInfo: {
          tieneReferralsLink: !!nft.referralsLink,
          referralsLink: nft.referralsLink || null,
          tieneOwnerId: !!nft.ownerId,
          ownerId: nft.ownerId || null
        }
      }))
    });

    return formattedNFTs;

  } catch (error) {
    console.error('[NFT Service] Error al obtener NFTs:', error);
    throw new Error(`Error al obtener NFTs: ${error.message}`);
  }
};

export const getNFTById = async (provider, tokenId) => {
  if (!tokenId) {
    throw new Error('tokenId es requerido');
  }

  try {
    const bscProvider = getBSCProvider();
    const STORAGE_ADMINISTRATOR_ADDRESS = STORAGE_ADMINISTRATOR_BSC;
    
    if (!STORAGE_ADMINISTRATOR_ADDRESS) {
      throw new Error('No hay dirección de StorageAdministrator configurada para BSC.');
    }

    const contract = new ethers.Contract(
      STORAGE_ADMINISTRATOR_ADDRESS,
      storageAdministratorAbi,
      bscProvider
    );

    const nftData = await contract.getUserNftAccDataBulk([tokenId]);
    const ipfsLinks = await contract.getNftIPFSLinkBulk([tokenId]);

    if (nftData.length === 0) {
      return null;
    }

    const data = nftData[0];
    const nft = {
      id: Number(data.tokenId.toString()),
      name: data.name,
      nftImgId: Number(data.nftImgId.toString()),
      NFT_COLLECTION_ID: Number(data.NFT_COLLECTION_ID.toString()),
      tokenId: Number(data.tokenId.toString()),
      ownerAddress: data.ownerAddress,
      referralsLink: data.referralsLink,
      leftSide: data.leftSide.map(s => Number(s.toString())),
      rightSide: data.rightSide.map(s => Number(s.toString())),
      planId: Number(data.planId.toString()),
      createdAt: Number(data.createdAt.toString()),
      membershipPlanBoughtDate: Number(data.membershipPlanBoughtDate.toString()),
      ipfsLink: ipfsLinks[0] || null,
      type: Number(data.NFT_COLLECTION_ID.toString()) === 0 ? 'defily' : 'fund8',
    };

    console.log('[Storage Administrator] Datos Recibidos', {
      contrato: STORAGE_ADMINISTRATOR_ADDRESS,
      nft: nft
    });

    return nft;
  } catch (error) {
    console.error('[NFT Service] Error al obtener NFT por ID:', error);
    throw new Error(`Error al obtener NFT: ${error.message}`);
  }
};

/**
 * Obtiene el referralLink (hash) de un NFT por su tokenId
 * Este hash es necesario para crear nuevos NFTs bajo este sponsor
 * @param {number} tokenId - ID del NFT (tokenId)
 * @returns {Promise<string|null>} referralLink (hash) o null si no se encuentra
 */
export const getReferralLinkFromTokenId = async (tokenId) => {
  if (!tokenId && tokenId !== 0) {
    return null;
  }

  try {
    const nft = await getNFTById(null, tokenId);
    if (!nft || !nft.referralsLink) {
      console.warn(`[getReferralLinkFromTokenId] NFT ${tokenId} no encontrado o sin referralsLink`);
      return null;
    }

    // El referralsLink ya viene como hash del contrato
    // Solo necesitamos normalizarlo (quitar 0x si existe, asegurar lowercase)
    let referralLink = nft.referralsLink;
    if (referralLink.startsWith('0x')) {
      referralLink = referralLink.slice(2);
    }
    referralLink = referralLink.toLowerCase();

    console.log(`[getReferralLinkFromTokenId] ReferralLink obtenido para NFT ${tokenId}:`, referralLink);
    return referralLink;
  } catch (error) {
    console.error(`[getReferralLinkFromTokenId] Error al obtener referralLink para NFT ${tokenId}:`, error);
    throw error;
  }
};

/**
 * Compra un NFT usando el contrato NFT Manager (mismo que DeFily)
 * @param {Object} signer - Signer de ethers.js (wallet conectada)
 * @param {Object} buyNftData - Datos para comprar el NFT
 * @param {string} buyNftData.name - Nombre del NFT
 * @param {number} buyNftData.nftImgId - ID de la imagen del NFT (uint96)
 * @param {number} buyNftData.NFT_COLLECTION_ID - ID de la colección (0 = DeFily, 1 = Fund8)
 * @param {string} buyNftData.referralLink - Hash del referral link (64 caracteres hex)
 * @param {number} buyNftData.side - Lado del árbol (0 = Left, 1 = Right)
 * @param {string} cid - CID de IPFS del NFT
 * @param {boolean} royaltyToken - Si el NFT tiene royalty
 * @returns {Promise<ethers.ContractTransaction>} Transacción de compra
 */
export const buyNft = async (signer, buyNftData, cid, royaltyToken = false) => {
  if (!signer) {
    throw new Error('Signer es requerido');
  }

  const NFT_CONTRACT_ADDRESS = 
    process.env.REACT_APP_NFT_CONTRACT_ADDRESS || 
    process.env.REACT_APP_DEFILY_NFT_CONTRACT_ADDRESS ||
    process.env.REACT_APP_NFT_MANAGER_ADDRESS;

  if (!NFT_CONTRACT_ADDRESS) {
    throw new Error(
      'No hay dirección de contrato NFT configurada.\n' +
      'Configura REACT_APP_NFT_CONTRACT_ADDRESS o REACT_APP_NFT_MANAGER_ADDRESS en tu .env'
    );
  }

  // Validar parámetros
  if (!buyNftData.name || !buyNftData.referralLink) {
    throw new Error('name y referralLink son requeridos');
  }

  if (buyNftData.nftImgId === undefined || buyNftData.nftImgId === null) {
    throw new Error('nftImgId es requerido');
  }

  if (buyNftData.side === undefined || buyNftData.side === null) {
    throw new Error('side es requerido');
  }

  // Normalizar referralLink (debe ser hex de 64 caracteres sin 0x)
  let referralLink = buyNftData.referralLink;
  if (referralLink.startsWith('0x')) {
    referralLink = referralLink.slice(2);
  }
  if (referralLink.length !== 64) {
    console.warn(`[buyNft] ReferralLink tiene longitud ${referralLink.length}, esperado 64`);
  }

  try {
    const bscProvider = getBSCProvider();
    const contract = new ethers.Contract(
      NFT_CONTRACT_ADDRESS,
      nftManagerAbi,
      signer
    );

    // Verificar que el contrato no esté pausado
    try {
      const isPaused = await contract.paused();
      if (isPaused) {
        throw new Error('El contrato NFT está pausado. Por favor intenta más tarde.');
      }
    } catch (pauseError) {
      console.warn('[buyNft] No se pudo verificar estado de pausa:', pauseError);
      // Continuar de todos modos
    }

    // Verificar que el NFT no esté ya minteado
    try {
      const owner = await contract.ownerOf(buyNftData.nftImgId);
      throw new Error(`NFT ${buyNftData.nftImgId} ya está minteado por ${owner}`);
    } catch (ownerError) {
      // Si ownerOf falla, significa que el NFT no existe (está disponible)
      if (ownerError.message && ownerError.message.includes('ya está minteado')) {
        throw ownerError;
      }
      // Si es otro error, continuar (el NFT está disponible)
    }

    // Preparar los datos del struct BuyNFT
    const buyNftStruct = [
      buyNftData.name,                    // name (string)
      buyNftData.nftImgId,                // nftImgId (uint96)
      buyNftData.NFT_COLLECTION_ID || 0,  // NFT_COLLECTION_ID (uint16) - 0 = DeFily
      referralLink,                       // referralLink (string)
      buyNftData.side                     // side (uint8)
    ];

    console.log('[buyNft] Comprando NFT con:', {
      contractAddress: NFT_CONTRACT_ADDRESS,
      name: buyNftData.name,
      nftImgId: buyNftData.nftImgId,
      NFT_COLLECTION_ID: buyNftData.NFT_COLLECTION_ID || 0,
      referralLink: referralLink.substring(0, 10) + '...',
      side: buyNftData.side,
      cid,
      royaltyToken
    });

    // Llamar al método buyNFT del contrato
    const tx = await contract.buyNFT(buyNftStruct, cid, royaltyToken, {
      gasLimit: 500000 // Límite de gas estimado
    });

    console.log('[buyNft] Transacción enviada:', tx.hash);
    return tx;
  } catch (error) {
    console.error('[buyNft] Error al comprar NFT:', error);
    
    // Extraer mensaje de error más descriptivo
    let errorMessage = error.message || 'Error desconocido al comprar NFT';
    
    // Si es un error de ethers.js con reason
    if (error.reason) {
      errorMessage = error.reason;
    }
    
    // Si es un error del contrato con data
    if (error.data) {
      if (error.data.message) {
        errorMessage = error.data.message;
      } else if (error.data.data) {
        // Intentar decodificar el error del contrato (ethers v5)
        try {
          if (ethers.utils && ethers.utils.AbiCoder) {
            const abiCoder = new ethers.utils.AbiCoder();
            const decoded = abiCoder.decode(['string'], error.data.data);
            if (decoded && decoded[0]) {
              errorMessage = decoded[0];
            }
          }
        } catch (decodeError) {
          console.warn('[buyNft] No se pudo decodificar el error:', decodeError);
          // Continuar con el mensaje de error original
        }
      }
    }
    
    // Decodificar errores comunes del contrato
    if (errorMessage.includes('SIDE_OCCUPIED') || errorMessage.includes('0xb22dd2ca')) {
      throw new Error('El lado seleccionado ya está ocupado. Por favor intenta con el otro lado.');
    }
    if (errorMessage.includes('V3') || errorMessage.includes('V2')) {
      throw new Error('Error del contrato: El NFT ya existe o hay un problema con el referral link.');
    }
    if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient balance')) {
      throw new Error('Fondos insuficientes. Asegúrate de tener suficiente BNB para el gas y USDC si es Premium.');
    }
    if (errorMessage.includes('user rejected') || errorMessage.includes('User denied') || errorMessage.includes('rejected')) {
      throw new Error('Transacción cancelada por el usuario');
    }
    if (errorMessage.includes('pausado') || errorMessage.includes('paused')) {
      throw new Error('El contrato está pausado temporalmente. Por favor intenta más tarde.');
    }
    
    // Si no se pudo decodificar, lanzar el error original con mensaje mejorado
    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    throw enhancedError;
  }
};

export default {
  getAllMyNFT,
  getNFTById,
  getReferralLinkFromTokenId,
  buyNft,
};

