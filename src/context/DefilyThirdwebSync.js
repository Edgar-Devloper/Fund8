/**
 * Componente para sincronizar wallet de thirdweb cuando viene desde DeFily
 * Este componente se ejecuta ANTES que ThirdwebSync para priorizar la wallet de DeFily
 * 
 * IMPORTANTE: Este componente intenta activar la sesión de thirdweb cuando viene desde DeFily
 * Si thirdweb tiene una sesión guardada (embedded wallet por email), la activará automáticamente
 */
import { useEffect, useRef } from 'react';
import { useActiveAccount, useAutoConnect } from 'thirdweb/react';
import { ethers } from 'ethers';
import { useWallet } from './WalletContext';
import { getDefilyRedirectData, validateDefilyRedirectData } from '../utils/defilyIntegration';

const MAX_AUTO_CONNECT_AGE = 5 * 60 * 1000; // 5 minutos

const DefilyThirdwebSync = () => {
  const account = useActiveAccount();
  const { address, setAddress, setProvider, setSigner } = useWallet();
  const processedRef = useRef(false);
  
  // Importar client y wallets de forma segura
  let client = null;
  let wallets = [];
  try {
    client = require('../features/third-web/libs/client.lib').client;
    wallets = require('../features/third-web/constants/connect-button-config.constant').wallets;
  } catch (error) {
    console.warn('[DefilyThirdwebSync] Error importando client/wallets:', error);
  }
  
  // IMPORTANTE: useAutoConnect intenta reconectar la última wallet conectada
  // Esto funciona si hay una sesión guardada en localStorage del mismo dominio
  // Si ambos proyectos (DeFily y Fund8) están en el mismo dominio base, esto funcionará
  const shouldAutoConnect = client && wallets && wallets.length > 0;
  const { data: autoConnectData } = useAutoConnect(
    shouldAutoConnect
      ? {
          client: client,
          wallets: wallets,
        }
      : { client: null, wallets: [] }
  );
  
  // Log para debugging
  useEffect(() => {
    if (shouldAutoConnect) {
      if (autoConnectData) {
        console.log('[DefilyThirdwebSync] useAutoConnect activó una wallet:', autoConnectData);
      } else {
        console.log('[DefilyThirdwebSync] useAutoConnect no encontró sesión guardada');
      }
    }
  }, [autoConnectData, shouldAutoConnect]);

  useEffect(() => {
    // Solo procesar una vez cuando el componente se monta
    if (processedRef.current) {
      return;
    }

    // Verificar si viene de DeFily
    const validation = validateDefilyRedirectData(MAX_AUTO_CONNECT_AGE);
    
    if (!validation.isValid || !validation.data?.walletAddress) {
      // No viene de DeFily o datos inválidos
      return;
    }

    const expectedAddress = validation.data.walletAddress.toLowerCase();
    console.log('[DefilyThirdwebSync] Viene de DeFily, wallet esperada:', expectedAddress);

    // Función para sincronizar la wallet
    const syncWallet = () => {
      if (!account?.address) {
        return false;
      }

      const thirdwebAddress = account.address.toLowerCase();
      console.log('[DefilyThirdwebSync] Thirdweb tiene cuenta activa:', thirdwebAddress);

      // Verificar si coincide con la wallet esperada de DeFily
      if (thirdwebAddress === expectedAddress) {
        console.log('[DefilyThirdwebSync] ✅ Wallet de thirdweb coincide con DeFily, sincronizando...');
        processedRef.current = true;

        // Sincronizar con WalletContext
        if (setAddress && address?.toLowerCase() !== thirdwebAddress) {
          setAddress(account.address);

          // Crear provider/signer desde thirdweb
          if (typeof window.ethereum !== 'undefined') {
            // Si hay window.ethereum, usar ese provider
            try {
              const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
              const web3Signer = web3Provider.getSigner();
              setProvider(web3Provider);
              setSigner(web3Signer);
              console.log('[DefilyThirdwebSync] ✅ Sincronizado con thirdweb (MetaMask provider)');
              return true;
            } catch (error) {
              console.warn('[DefilyThirdwebSync] Error creando provider desde window.ethereum:', error);
            }
          } else {
            // Embedded wallet: crear provider y signer personalizado
            try {
              const BSC_MAINNET_RPC = process.env.REACT_APP_BSC_RPC_URL || 'https://bsc-dataseed1.binance.org/';
              const BSC_TESTNET_RPC = process.env.REACT_APP_BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
              const useTestnet = process.env.REACT_APP_USE_BSC_TESTNET === 'true';
              const rpcUrl = useTestnet ? BSC_TESTNET_RPC : BSC_MAINNET_RPC;
              const bscProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
              
              // Crear signer personalizado que use thirdweb para firmar
              const customSigner = {
                getAddress: async () => account.address,
                signMessage: async (message) => {
                  const { signMessage } = await import('thirdweb/wallets');
                  return await signMessage({ account, message });
                },
                provider: bscProvider
              };
              
              setProvider(bscProvider);
              setSigner(customSigner);
              console.log('[DefilyThirdwebSync] ✅ Sincronizado con thirdweb (embedded wallet)');
              return true;
            } catch (error) {
              console.warn('[DefilyThirdwebSync] Error configurando provider para embedded wallet:', error);
            }
          }
        }
        return true;
      } else {
        console.log('[DefilyThirdwebSync] ⚠️ Wallet de thirdweb no coincide con la esperada de DeFily');
        console.log('[DefilyThirdwebSync] Thirdweb:', thirdwebAddress, 'DeFily esperada:', expectedAddress);
        return false;
      }
    };

    // Intentar sincronizar inmediatamente si thirdweb ya tiene cuenta
    if (syncWallet()) {
      return;
    }

    // Si thirdweb no tiene cuenta activa, esperar un poco y reintentar
    // useAutoConnect debería activar la sesión automáticamente si hay una guardada en localStorage
    // NOTA: Esto solo funciona si ambos proyectos están en el mismo dominio base o subdominios
    if (!account?.address) {
      console.log('[DefilyThirdwebSync] Thirdweb no tiene cuenta activa, esperando que useAutoConnect la active...');
      console.log('[DefilyThirdwebSync] Wallet esperada de DeFily:', expectedAddress);
      
      // Reintentar hasta 5 veces con delays crecientes (dar más tiempo a useAutoConnect)
      let attempts = 0;
      const maxAttempts = 5;
      const delays = [500, 1000, 1500, 2000, 3000]; // 0.5s, 1s, 1.5s, 2s, 3s
      
      const retrySync = () => {
        if (processedRef.current || attempts >= maxAttempts) {
          if (attempts >= maxAttempts) {
            console.log('[DefilyThirdwebSync] ⚠️ Máximo de reintentos alcanzado');
            console.log('[DefilyThirdwebSync] ⚠️ Thirdweb no tiene la wallet de DeFily conectada');
            console.log('[DefilyThirdwebSync] ⚠️ LIMITACIÓN IMPORTANTE: thirdweb NO comparte sesiones entre dominios diferentes');
            console.log('[DefilyThirdwebSync] ⚠️ Para auto-conexión automática, DeFily y Fund8 deben estar en el mismo dominio base (ej: app.defily.ai y fund8.defily.ai)');
            console.log('[DefilyThirdwebSync] ⚠️ Si están en dominios diferentes, el usuario necesitará conectarse manualmente la primera vez');
          }
          return;
        }
        
        attempts++;
        const delay = delays[attempts - 1] || 3000;
        
        setTimeout(() => {
          if (!processedRef.current && account?.address) {
            console.log(`[DefilyThirdwebSync] Reintento ${attempts}/${maxAttempts}... Thirdweb ahora tiene cuenta activa: ${account.address}`);
            if (!syncWallet()) {
              retrySync();
            }
          } else if (!account?.address) {
            retrySync();
          }
        }, delay);
      };
      
      retrySync();
    }
  }, [account, address, setAddress, setProvider, setSigner, autoConnectData]);

  return null; // Este componente no renderiza nada
};

export default DefilyThirdwebSync;

