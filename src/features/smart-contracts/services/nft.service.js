import { ethers } from 'ethers';
import { storageAdministratorAbi } from '../abis/storageAdministrator.abi';

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

export default {
  getAllMyNFT,
  getNFTById,
};

