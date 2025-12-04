/**
 * Componente para sincronizar Thirdweb con WalletContext
 * Debe estar dentro de ThirdwebProvider y WalletProvider
 * Soporta tanto MetaMask (window.ethereum) como wallets de email (embedded wallets)
 */
import { useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { ethers } from 'ethers';
import { useWallet } from './WalletContext';

const ThirdwebSync = () => {
  const account = useActiveAccount();
  const { address, setAddress, setProvider, setSigner } = useWallet();

  useEffect(() => {
    if (account?.address) {
      const thirdwebAddress = account.address;
      // Si Thirdweb tiene una cuenta pero WalletContext no está sincronizado, sincronizar
      if (thirdwebAddress.toLowerCase() !== address?.toLowerCase()) {
        // Siempre actualizar el address (necesario para leer NFTs)
        setAddress(thirdwebAddress);
        
        // Intentar crear provider/signer según el tipo de wallet
        if (typeof window.ethereum !== 'undefined') {
          // MetaMask o wallet externa: usar window.ethereum
          try {
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            const web3Signer = web3Provider.getSigner();
            setProvider(web3Provider);
            setSigner(web3Signer);
            console.log('[ThirdwebSync] Sincronizado con Thirdweb (MetaMask):', thirdwebAddress);
          } catch (error) {
            console.warn('[ThirdwebSync] Error creando provider desde window.ethereum:', error);
          }
        } else {
          // Embedded wallet (email): crear provider de BSC para lectura
          // getAllMyNFT usa su propio BSC provider, pero necesitamos uno para el contexto
          try {
            const BSC_MAINNET_RPC = process.env.REACT_APP_BSC_RPC_URL || 'https://bsc-dataseed1.binance.org/';
            const BSC_TESTNET_RPC = process.env.REACT_APP_BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
            const useTestnet = process.env.REACT_APP_USE_BSC_TESTNET === 'true';
            const rpcUrl = useTestnet ? BSC_TESTNET_RPC : BSC_MAINNET_RPC;
            const bscProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
            
            // Crear un signer personalizado que use el account de Thirdweb para firmar
            const customSigner = {
              getAddress: async () => thirdwebAddress,
              signMessage: async (message) => {
                // Usar el account de Thirdweb para firmar
                const { signMessage } = await import('thirdweb/wallets');
                return await signMessage({ account, message });
              },
              provider: bscProvider
            };
            
            setProvider(bscProvider);
            setSigner(customSigner);
            console.log('[ThirdwebSync] Sincronizado con Thirdweb (embedded wallet):', thirdwebAddress);
          } catch (error) {
            console.warn('[ThirdwebSync] Error configurando provider para embedded wallet:', error);
            // Al menos tenemos el address sincronizado, que es lo más importante para leer NFTs
          }
        }
      }
    } else if (account === null && address) {
      // Thirdweb se desconectó - no hacer nada, el usuario puede desconectar manualmente
      console.debug('[ThirdwebSync] Thirdweb desconectado, pero manteniendo estado local');
    }
  }, [account?.address, account, address, setAddress, setProvider, setSigner]);

  return null; // Este componente no renderiza nada
};

export default ThirdwebSync;

