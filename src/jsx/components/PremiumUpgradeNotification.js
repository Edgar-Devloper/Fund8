import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNFT } from '../../context/NFTContext';
import { useWallet } from '../../context/WalletContext';
import { usePlatform } from '../../context/PlatformContext';

/**
 * Componente de notificación para actualizar a Premium NFT
 * Se muestra cuando:
 * 1. Usuario tiene NFT Básico (planId === 0) y hace login
 * 2. Usuario sin NFT conecta su wallet
 */
const PremiumUpgradeNotification = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected, address } = useWallet();
  const { selectedNFT, nfts, isLoading, hasNFTs } = useNFT();
  const { isFund8 } = usePlatform();
  const [showNotification, setShowNotification] = useState(false);
  const hasShownRef = useRef(false);
  const prevAddressRef = useRef(null);

  // Rutas donde NO debe mostrarse la notificación
  const excludedRoutes = [
    '/register',
    '/nft/register',
    '/nft/select-nft-collection',
    '/nft/choose-character',
    '/nft/buy-pet',
    '/nft/pet-confirmation'
  ];
  const isExcludedRoute = excludedRoutes.some(route => location.pathname.startsWith(route));

  // Función para verificar si el NFT es Básico (planId === 0)
  const isBasicNFT = (nft) => {
    return nft && nft.planId !== undefined && nft.planId === 0;
  };

  // Obtener clave de localStorage para esta wallet
  const getNotificationShownKey = (walletAddress) => {
    return walletAddress ? `premiumUpgradeShown_${walletAddress.toLowerCase()}` : 'premiumUpgradeShown';
  };

  useEffect(() => {
    if (!isConnected || !address || isExcludedRoute) {
      setShowNotification(false);
      return;
    }

    // Resetear si cambió la wallet
    const walletChanged = prevAddressRef.current && 
      prevAddressRef.current.toLowerCase() !== address.toLowerCase();
    
    if (walletChanged) {
      hasShownRef.current = false;
      prevAddressRef.current = address;
    } else {
      prevAddressRef.current = address;
    }

    // Verificar si el usuario descartó la notificación (por 24 horas)
    const storageKey = getNotificationShownKey(address);
    const dismissed24h = localStorage.getItem(`${storageKey}_24h`);
    const dismissedTime = localStorage.getItem(`${storageKey}_time`);
    
    if (dismissed24h === 'true' && dismissedTime) {
      const dismissUntil = parseInt(dismissedTime, 10);
      const now = Date.now();
      if (now < dismissUntil) {
        // Aún está en el período de "no molestar" (24 horas)
        setShowNotification(false);
        return;
      } else {
        // Ya pasaron las 24 horas, limpiar
        localStorage.removeItem(`${storageKey}_24h`);
        localStorage.removeItem(`${storageKey}_time`);
      }
    }

    // Esperar a que termine de cargar los NFTs
    if (isLoading) {
      return;
    }

    // Caso 1: Usuario sin NFT
    if (!hasNFTs || nfts.length === 0) {
      setShowNotification(true);
      return;
    }

    // Caso 2: Usuario con NFT Básico (planId === 0)
    const hasBasicNFT = nfts.some(nft => isBasicNFT(nft));
    const selectedIsBasic = selectedNFT && isBasicNFT(selectedNFT);

    if (hasBasicNFT && (selectedIsBasic || !selectedNFT)) {
      setShowNotification(true);
    } else {
      setShowNotification(false);
    }
  }, [isConnected, address, hasNFTs, nfts, selectedNFT, isLoading, isExcludedRoute, location.pathname]);

  const handleClose = () => {
    setShowNotification(false);
    // No guardar nada aquí, queremos que aparezca cada vez que hacen login
  };

  const handleUpgrade = () => {
    handleClose();
    // Redirigir a la página de registro con tipo premium
    navigate('/register');
  };

  const handleDismiss = () => {
    handleClose();
    // Marcar como "no molestar" por 24 horas
    if (address) {
      const storageKey = getNotificationShownKey(address);
      const dismissUntil = Date.now() + (24 * 60 * 60 * 1000); // 24 horas
      localStorage.setItem(`${storageKey}_24h`, 'true');
      localStorage.setItem(`${storageKey}_time`, dismissUntil.toString());
    }
  };

  if (!showNotification || !isConnected || !address || isExcludedRoute) {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        maxWidth: '400px',
        background: '#151a2e',
        border: '2px solid #00c087',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
        zIndex: 1050,
        animation: 'slideInUp 0.3s ease-out'
      }}
    >
      <style>{`
        @keyframes slideInUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <h5 style={{ 
            color: '#00c087', 
            margin: 0, 
            marginBottom: '8px',
            fontSize: '18px',
            fontWeight: '700'
          }}>
            {t('nft.upgrade_to_premium', 'Actualiza a Premium')}
          </h5>
          <p style={{ 
            color: '#a0aec0', 
            margin: 0,
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            {hasNFTs && selectedNFT && isBasicNFT(selectedNFT)
              ? t('nft.upgrade_basic_message', 'Tu NFT Básico tiene beneficios limitados. Actualiza a Premium por $30 USDC para acceder a todas las comisiones (CV/RV), Binary, Matching y LP Subscriptions.')
              : t('nft.upgrade_no_nft_message', 'Crea un NFT Premium por $30 USDC y obtén acceso completo a todas las funcionalidades, incluyendo comisiones (CV/RV), Binary, Matching y LP Subscriptions.')
            }
          </p>
        </div>
        <button
          onClick={handleClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#718096',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '0',
            marginLeft: '12px',
            lineHeight: '1',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#718096';
          }}
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>

      <div style={{ 
        background: 'rgba(0, 192, 135, 0.1)', 
        border: '1px solid rgba(0, 192, 135, 0.2)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ color: '#00c087', fontSize: '16px' }}>✓</span>
          <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: '600' }}>
            {t('nft.premium_benefits_title', 'Beneficios Premium:')}
          </span>
        </div>
        <ul style={{ 
          margin: 0, 
          paddingLeft: '24px', 
          color: '#a0aec0',
          fontSize: '12px',
          lineHeight: '1.8'
        }}>
          <li>{t('nft.full_access_all_products', 'Acceso completo a todos los productos')}</li>
          <li>{t('nft.earn_all_commissions', 'Ganas todas las comisiones (CV/RV)')}</li>
          <li>{t('nft.binary_matching_bonuses', 'Binary y Matching bonuses')}</li>
          <li>{t('nft.can_buy_lp_subscriptions', 'Puedes comprar LP Subscriptions')}</li>
        </ul>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleDismiss}
          style={{
            flex: 1,
            background: 'transparent',
            border: '1px solid #1e2541',
            color: '#718096',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1f2640';
            e.currentTarget.style.borderColor = '#1e2541';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = '#1e2541';
          }}
        >
          {t('nft.dismiss', 'Descartar')}
        </button>
        <button
          onClick={handleUpgrade}
          style={{
            flex: 2,
            background: '#00c087',
            border: 'none',
            color: '#ffffff',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#00b079';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#00c087';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {t('nft.upgrade_now', 'Actualizar Ahora')} - $30 USDC
        </button>
      </div>
    </div>
  );
};

export default PremiumUpgradeNotification;
