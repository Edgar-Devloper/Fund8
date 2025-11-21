/**
 * useWalletNotifications - Hook para integrar notificaciones con wallet
 * Se debe usar en componentes que estén dentro de ambos providers
 */

import { useEffect, useRef } from 'react';
import { useWallet } from '../context/WalletContext.js';
import { useNotifications } from '../context/NotificationContext.js';

export const useWalletNotifications = () => {
  const { address, isConnected } = useWallet();
  const { addNotification } = useNotifications();
  const prevAddressRef = useRef(null);

  useEffect(() => {
    // Notificar cuando se conecta la wallet
    if (isConnected && address && prevAddressRef.current !== address) {
      addNotification({
        type: 'success',
        title: 'Wallet Connected',
        message: `Successfully connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
      prevAddressRef.current = address;
    }
    
    // Notificar cuando se desconecta
    if (!isConnected && prevAddressRef.current) {
      addNotification({
        type: 'info',
        title: 'Wallet Disconnected',
        message: 'Your wallet has been disconnected. Please reconnect to continue trading.',
      });
      prevAddressRef.current = null;
    }
  }, [isConnected, address, addNotification]);
};

