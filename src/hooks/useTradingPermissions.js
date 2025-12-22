import { useSelector } from 'react-redux';
import { useWallet } from '../context/WalletContext';
import { useNFT } from '../context/NFTContext';

/**
 * Hook para verificar permisos de trading
 * Retorna información sobre qué puede y no puede hacer el usuario
 */
export const useTradingPermissions = () => {
  const { isConnected, address } = useWallet();
  const { selectedNFT, hasNFTs } = useNFT();
  const { tradingPortal } = useSelector(state => state.auth);

  const hasWallet = isConnected && !!address;
  const hasNFT = !!selectedNFT || hasNFTs;
  const hasPortalAccount = tradingPortal?.hasPortalAccount || false;
  const isPortalVerified = tradingPortal?.isVerified || false;

  // Puede ver (solo lectura)
  const canView = true; // Siempre puede ver terminal, charts, order book

  // Puede tradear (requiere wallet/NFT + portal account)
  const canTrade = hasWallet && (hasNFT || hasWallet) && hasPortalAccount && isPortalVerified;

  // Puede comprar (requiere wallet/NFT + portal account)
  const canPurchase = hasWallet && (hasNFT || hasWallet) && hasPortalAccount && isPortalVerified;

  // Puede ver referral link (requiere wallet/NFT + portal account)
  const canViewReferral = hasWallet && (hasNFT || hasWallet) && hasPortalAccount && isPortalVerified;

  // Estado completo de acceso
  const hasFullAccess = canTrade && canPurchase && canViewReferral;

  // Mensajes informativos
  const getRestrictionMessage = () => {
    if (!hasWallet) {
      return 'Connect your Web3 wallet to start trading';
    }
    if (!hasPortalAccount) {
      return 'Create a Trading Portal account to access trading features';
    }
    if (!isPortalVerified) {
      return 'Verify your Trading Portal account to access trading features';
    }
    return null;
  };

  return {
    // Estado
    hasWallet,
    hasNFT,
    hasPortalAccount,
    isPortalVerified,
    
    // Permisos
    canView,
    canTrade,
    canPurchase,
    canViewReferral,
    hasFullAccess,
    
    // Utilidades
    getRestrictionMessage,
  };
};

export default useTradingPermissions;







