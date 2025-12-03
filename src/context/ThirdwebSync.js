/**
 * Componente para sincronizar Thirdweb con WalletContext
 * Debe estar dentro de ThirdwebProvider y WalletProvider
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
        if (typeof window.ethereum !== 'undefined') {
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
          const web3Signer = web3Provider.getSigner();
          setAddress(thirdwebAddress);
          setProvider(web3Provider);
          setSigner(web3Signer);
          console.log('[ThirdwebSync] Sincronizado con Thirdweb:', thirdwebAddress);
        }
      }
    } else if (account === null && address) {
      // Thirdweb se desconectó - no hacer nada, el usuario puede desconectar manualmente
      console.debug('[ThirdwebSync] Thirdweb desconectado, pero manteniendo estado local');
    }
  }, [account?.address, address, setAddress, setProvider, setSigner]);

  return null; // Este componente no renderiza nada
};

export default ThirdwebSync;

