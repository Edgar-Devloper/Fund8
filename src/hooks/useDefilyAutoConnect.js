/**
 * Hook personalizado para manejar auto-conexión de wallet cuando viene desde DeFily
 * 
 * Este hook detecta cuando el usuario viene desde DeFily (mediante parámetros de URL o sessionStorage)
 * y maneja la auto-conexión usando thirdweb si está disponible, o MetaMask como fallback.
 * 
 * @returns {Object} Objeto con estado y funciones relacionadas con auto-conexión desde DeFily
 */

import { useEffect, useRef } from 'react';
import { getDefilyRedirectData, validateDefilyRedirectData } from '../utils/defilyIntegration';

const AUTO_CONNECT_ATTEMPTED_KEY = 'defily_auto_connect_attempted';
const MAX_AUTO_CONNECT_AGE = 5 * 60 * 1000; // 5 minutos

/**
 * Hook para auto-conectar wallet cuando viene desde DeFily
 * 
 * @param {Object} params - Parámetros del hook
 * @param {boolean} params.isConnected - Si la wallet ya está conectada
 * @param {string|null} params.address - Dirección de la wallet actual
 * @param {Function} params.connectWalletSilently - Función para conectar wallet silenciosamente
 * @param {Function} params.setAddress - Función para establecer la dirección
 * @param {Function} params.setProvider - Función para establecer el provider
 * @param {Function} params.setSigner - Función para establecer el signer
 * @param {Object|null} params.thirdwebAccount - Cuenta activa de thirdweb (opcional)
 * @returns {Object} Estado y controladores de auto-conexión
 */
export const useDefilyAutoConnect = ({ 
  isConnected, 
  address, 
  connectWalletSilently,
  setAddress,
  setProvider,
  setSigner,
  thirdwebAccount = null
}) => {
  const autoConnectAttemptedRef = useRef(false);
  const validationCheckedRef = useRef(false);

  /**
   * Verifica si ya se intentó auto-conectar en esta sesión
   * Esto previene múltiples intentos de auto-conexión
   */
  const hasAttemptedAutoConnect = () => {
    try {
      const attempted = sessionStorage.getItem(AUTO_CONNECT_ATTEMPTED_KEY);
      if (attempted) {
        const timestamp = parseInt(attempted, 10);
        const age = Date.now() - timestamp;
        // Si pasaron más de 5 minutos, permitir nuevo intento
        return age < MAX_AUTO_CONNECT_AGE;
      }
      return false;
    } catch (error) {
      console.warn('[DefilyAutoConnect] Error verificando intento previo:', error);
      return false;
    }
  };

  /**
   * Marca que se intentó auto-conectar
   */
  const markAutoConnectAttempted = () => {
    try {
      sessionStorage.setItem(AUTO_CONNECT_ATTEMPTED_KEY, Date.now().toString());
      autoConnectAttemptedRef.current = true;
    } catch (error) {
      console.warn('[DefilyAutoConnect] Error marcando intento:', error);
    }
  };

  /**
   * Limpia la marca de intento de auto-conexión
   * Útil cuando el usuario se conecta manualmente después
   */
  const clearAutoConnectAttempted = () => {
    try {
      sessionStorage.removeItem(AUTO_CONNECT_ATTEMPTED_KEY);
      autoConnectAttemptedRef.current = false;
    } catch (error) {
      console.warn('[DefilyAutoConnect] Error limpiando intento:', error);
    }
  };

  /**
   * Efecto principal: detecta y maneja auto-conexión cuando viene de DeFily
   */
  useEffect(() => {
    console.log('[DefilyAutoConnect] useEffect ejecutado. isConnected:', isConnected, 'address:', address);
    
    // Si ya está conectado, verificar si coincide con DeFily y limpiar marca si es necesario
    if (isConnected && address) {
      const defilyData = getDefilyRedirectData();
      console.log('[DefilyAutoConnect] Wallet ya conectada. Datos de DeFily:', defilyData);
      
      if (defilyData.isFromDefily && defilyData.walletAddress) {
        if (address.toLowerCase() === defilyData.walletAddress.toLowerCase()) {
          console.log('[DefilyAutoConnect] ✅ Wallet ya conectada y coincide con DeFily, limpiando marca de intento');
          clearAutoConnectAttempted();
        } else {
          console.log('[DefilyAutoConnect] ⚠️ Wallet conectada pero no coincide con DeFily');
        }
      }
      return;
    }

    // Validar datos de DeFily PRIMERO (antes de verificar marca)
    // Esto permite que si los datos siguen siendo válidos después de recargar, se pueda intentar de nuevo
    const validation = validateDefilyRedirectData(MAX_AUTO_CONNECT_AGE);
    console.log('[DefilyAutoConnect] Validación de datos DeFily:', validation);
    
    // Si no viene de DeFily o los datos son inválidos, limpiar marca y salir
    if (!validation.isValid) {
      if (validation.reason !== 'not_from_defily') {
        console.log('[DefilyAutoConnect] ❌ Datos de DeFily inválidos o expirados:', validation.reason, '- Limpiando marca');
        clearAutoConnectAttempted();
      } else {
        console.log('[DefilyAutoConnect] No viene de DeFily, no es necesario auto-conectar');
        clearAutoConnectAttempted(); // Limpiar también si no viene de DeFily
      }
      return;
    }

    // Si los datos son válidos pero ya intentamos conectar, verificar si deberíamos permitir reintento
    // Solo permitir reintento si los datos tienen un timestamp diferente (nueva redirección)
    const hasAttempted = hasAttemptedAutoConnect();
    if (hasAttempted || autoConnectAttemptedRef.current) {
      // Verificar si los datos de DeFily tienen un timestamp nuevo (nueva redirección)
      const defilyData = getDefilyRedirectData();
      const attemptedTimestamp = sessionStorage.getItem(AUTO_CONNECT_ATTEMPTED_KEY);
      
      if (attemptedTimestamp && defilyData.timestamp) {
        const attemptedTime = parseInt(attemptedTimestamp, 10);
        const defilyTime = defilyData.timestamp;
        
        // Si el timestamp de DeFily es más reciente que el intento anterior, permitir reintento
        if (defilyTime > attemptedTime) {
          console.log('[DefilyAutoConnect] Nueva redirección detectada (timestamp más reciente), permitiendo reintento');
          clearAutoConnectAttempted();
          // Continuar con el flujo de auto-conexión
        } else {
          console.log('[DefilyAutoConnect] ⚠️ Ya se intentó auto-conectar previamente en esta sesión, saltando');
          console.log('[DefilyAutoConnect] Si MetaMask no está autorizado para Fund8, el usuario debe hacer clic en "Connect Wallet" manualmente');
          return;
        }
      } else {
        console.log('[DefilyAutoConnect] ⚠️ Ya se intentó auto-conectar previamente, saltando');
        return;
      }
    }

    // Validar y procesar auto-conexión
    if (!validationCheckedRef.current) {
      validationCheckedRef.current = true;
      
      console.log('[DefilyAutoConnect] ✅ Datos válidos de DeFily detectados, iniciando auto-conexión');
      console.log('[DefilyAutoConnect] Wallet esperada:', validation.data.walletAddress);
      
      // Marcar que intentaremos auto-conectar
      markAutoConnectAttempted();

      // Intentar conectar silenciosamente
      const attemptAutoConnect = async () => {
        try {
          const defilyData = validation.data;
          
          if (!defilyData?.walletAddress) {
            console.warn('[DefilyAutoConnect] ❌ No hay wallet address en datos de DeFily');
            return;
          }

          const expectedAddress = defilyData.walletAddress.toLowerCase();
          console.log('[DefilyAutoConnect] 🔄 Intentando auto-conectar wallet desde DeFily:', expectedAddress);
          
          // PRIORIDAD 1: Verificar si thirdweb tiene esa wallet conectada (embedded wallet)
          if (thirdwebAccount?.address) {
            const thirdwebAddress = thirdwebAccount.address.toLowerCase();
            console.log('[DefilyAutoConnect] Thirdweb tiene cuenta activa:', thirdwebAddress);
            
            if (thirdwebAddress === expectedAddress) {
              console.log('[DefilyAutoConnect] ✅ Thirdweb tiene la misma wallet que DeFily, sincronizando...');
              
              // Sincronizar con WalletContext usando thirdweb
              if (setAddress && setProvider && setSigner) {
                setAddress(thirdwebAccount.address);
                
                // Crear provider/signer desde thirdweb
                const { ethers } = await import('ethers');
                
                if (typeof window.ethereum !== 'undefined') {
                  // Si hay window.ethereum, usar ese provider
                  const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
                  const web3Signer = web3Provider.getSigner();
                  setProvider(web3Provider);
                  setSigner(web3Signer);
                  console.log('[DefilyAutoConnect] ✅ Sincronizado con thirdweb (MetaMask provider)');
                } else {
                  // Embedded wallet: crear provider y signer personalizado
                  const BSC_MAINNET_RPC = process.env.REACT_APP_BSC_RPC_URL || 'https://bsc-dataseed1.binance.org/';
                  const BSC_TESTNET_RPC = process.env.REACT_APP_BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/';
                  const useTestnet = process.env.REACT_APP_USE_BSC_TESTNET === 'true';
                  const rpcUrl = useTestnet ? BSC_TESTNET_RPC : BSC_MAINNET_RPC;
                  const bscProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
                  
                  // Crear signer personalizado que use thirdweb para firmar
                  const { signMessage: thirdwebSignMessage } = await import('thirdweb/wallets');
                  const customSigner = {
                    getAddress: async () => thirdwebAccount.address,
                    signMessage: async (message) => {
                      return await thirdwebSignMessage({ account: thirdwebAccount, message });
                    },
                    provider: bscProvider
                  };
                  
                  setProvider(bscProvider);
                  setSigner(customSigner);
                  console.log('[DefilyAutoConnect] ✅ Sincronizado con thirdweb (embedded wallet)');
                }
                
                clearAutoConnectAttempted();
                return;
              }
            } else {
              console.log('[DefilyAutoConnect] ⚠️ Thirdweb tiene una wallet diferente, intentando con MetaMask...');
            }
          }
          
          // PRIORIDAD 2: Intentar conectar con MetaMask (puede fallar si no está autorizado)
          console.log('[DefilyAutoConnect] Intentando auto-conectar con MetaMask...');
          const success = await connectWalletSilently(defilyData.walletAddress);
          
          if (success) {
            console.log('[DefilyAutoConnect] ✅ Auto-conexión exitosa con MetaMask');
            clearAutoConnectAttempted();
          } else {
            console.log('[DefilyAutoConnect] ⚠️ Auto-conexión falló - MetaMask no tiene la wallet autorizada o no coincide');
            console.log('[DefilyAutoConnect] El usuario deberá hacer clic en "Connect Wallet" manualmente');
          }
          
        } catch (error) {
          console.error('[DefilyAutoConnect] ❌ Error en auto-conexión:', error);
        }
      };

      // Pequeño delay para asegurar que todos los contextos estén inicializados
      // Aumentado a 500ms para dar tiempo a que ThirdwebSync se ejecute primero si está activo
      const timer = setTimeout(() => {
        console.log('[DefilyAutoConnect] ⏱️ Ejecutando attemptAutoConnect después del delay');
        attemptAutoConnect();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, address, connectWalletSilently]);

  return {
    hasAttemptedAutoConnect: hasAttemptedAutoConnect(),
    clearAutoConnectAttempted,
  };
};

