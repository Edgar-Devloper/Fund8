/**
 * Utilidades para validar y cambiar de red
 */

const BSC_MAINNET_CHAIN_ID = 56;
const BSC_TESTNET_CHAIN_ID = 97;

/**
 * Verifica si la wallet está conectada a BSC (Mainnet o Testnet)
 */
export const isOnBSC = async () => {
  if (typeof window.ethereum === 'undefined') {
    return false;
  }

  try {
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    const chainId = parseInt(chainIdHex, 16);
    return chainId === BSC_MAINNET_CHAIN_ID || chainId === BSC_TESTNET_CHAIN_ID;
  } catch (error) {
    console.error('[networkHelper] Error verificando red:', error);
    return false;
  }
};

/**
 * Obtiene el chainId actual
 */
export const getCurrentChainId = async () => {
  if (typeof window.ethereum === 'undefined') {
    return null;
  }

  try {
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    return parseInt(chainIdHex, 16);
  } catch (error) {
    console.error('[networkHelper] Error obteniendo chainId:', error);
    return null;
  }
};

/**
 * Cambia la red a BSC Testnet
 */
export const switchToBSCTestnet = async () => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask no está instalado');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${BSC_TESTNET_CHAIN_ID.toString(16)}` }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      // La red no está agregada, agregarla
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${BSC_TESTNET_CHAIN_ID.toString(16)}`,
            chainName: 'BSC Testnet',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
            blockExplorerUrls: ['https://testnet.bscscan.com'],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
};

/**
 * Cambia la red a BSC Mainnet
 */
export const switchToBSCMainnet = async () => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask no está instalado');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${BSC_MAINNET_CHAIN_ID.toString(16)}` }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      // La red no está agregada, agregarla
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${BSC_MAINNET_CHAIN_ID.toString(16)}`,
            chainName: 'Binance Smart Chain',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpcUrls: ['https://bsc-dataseed1.binance.org/'],
            blockExplorerUrls: ['https://bscscan.com'],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
};

/**
 * Valida y cambia a BSC si es necesario
 * @param {boolean} preferTestnet - Si true, usa testnet; si false, usa mainnet
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const ensureBSCNetwork = async (preferTestnet = true) => {
  const isOnBSCNetwork = await isOnBSC();
  
  if (isOnBSCNetwork) {
    return { success: true, message: 'Ya estás en BSC' };
  }

  try {
    if (preferTestnet) {
      await switchToBSCTestnet();
    } else {
      await switchToBSCMainnet();
    }
    return { success: true, message: 'Red cambiada a BSC exitosamente' };
  } catch (error) {
    console.error('[networkHelper] Error cambiando a BSC:', error);
    
    let errorMessage = 'Error al cambiar de red';
    if (error.code === 4001) {
      errorMessage = 'Cambio de red cancelado. Por favor, cambia manualmente a BSC en MetaMask.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { success: false, message: errorMessage, error };
  }
};








