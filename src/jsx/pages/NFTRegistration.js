import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlatform } from '../../context/PlatformContext';
import { useWallet } from '../../context/WalletContext';
import { useNFT } from '../../context/NFTContext';
import logo from "../../images/logo-full.png";

/**
 * Página de registro de NFT que detecta la plataforma y muestra contenido apropiado
 * - Si viene de Fund8: muestra opciones de registro gratuito o Premium
 * - Si viene de DeFily: muestra solo opción Premium
 * 
 * IMPORTANTE: Ambos crean el mismo NFT en el árbol de DeFily, pero la experiencia es diferente
 */
const NFTRegistration = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showError, setShowError] = useState(false);
  
  // Los hooks deben llamarse siempre (reglas de React)
  // Los contextos ya retornan valores por defecto si no están disponibles
  const platformContext = usePlatform();
  const walletContext = useWallet();
  const nftContext = useNFT();
  
  // Extraer valores con fallbacks seguros usando nullish coalescing (??)
  const platform = platformContext?.platform;
  const isFund8 = platformContext?.isFund8 ?? true; // Default a Fund8 si no se puede determinar
  const isDefily = platformContext?.isDefily ?? false;
  const referralParams = platformContext?.referralParams || { 
    hasReferral: false, 
    requiresReferral: false,
    nftId: null,
    side: null,
    isCorporate: false
  };
  
  const isConnected = walletContext?.isConnected ?? false;
  const address = walletContext?.address ?? null;
  const connectWallet = walletContext?.connectWallet ?? (() => {
    console.warn('[NFTRegistration] connectWallet no disponible');
  });
  
  const hasNFTs = nftContext?.hasNFTs ?? false;
  const selectedNFT = nftContext?.selectedNFT ?? null;

  useEffect(() => {
    // Si es DeFily y no tiene enlace de referido, mostrar error
    if (isDefily && referralParams?.requiresReferral) {
      setShowError(true);
    }
  }, [isDefily, referralParams]);

  // NO redirigir automáticamente - permitir crear nuevos NFTs incluso si ya tiene uno
  // El usuario puede querer crear múltiples NFTs
  // useEffect(() => {
  //   if (isConnected && hasNFTs && selectedNFT) {
  //     navigate('/trading');
  //   }
  // }, [isConnected, hasNFTs, selectedNFT, navigate]);

  const handleConnectWallet = () => {
    if (!isConnected) {
      connectWallet();
    }
  };

  // Si es DeFily sin enlace, mostrar error
  if (isDefily && referralParams?.requiresReferral) {
    return (
      <div style={{ 
        background: '#0a0e27', 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
      <div style={{ width: '100%', maxWidth: '1200px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div style={{ width: '100%', maxWidth: '500px' }}>
            <div style={{
              background: '#151a2e',
              borderRadius: '12px',
              padding: '40px',
              border: '1px solid #1e2541',
              width: '100%',
              boxSizing: 'border-box'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <img src={logo} alt="DeFily" style={{ maxWidth: '200px' }} />
                </div>
                <div style={{
                  background: 'rgba(255, 92, 92, 0.1)',
                  border: '1px solid #ff5c5c',
                  color: '#ff5c5c',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <h5 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: '600' }}>
                    {t('nft.referral_link_required', 'Enlace de Referido Requerido')}
                  </h5>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    {t('nft.defily_requires_referral', 'Para registrarte en DeFily necesitas un enlace de referido válido. Por favor, usa un enlace compartido por un miembro existente.')}
                  </p>
                </div>
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button
                    onClick={() => window.location.href = 'https://app.defily.ai'}
                    style={{
                      background: '#00e5cc',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 30px',
                      color: '#ffffff',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {t('nft.back_to_defily', 'Volver a DeFily')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar información del referido si está disponible
  const referralInfo = referralParams?.hasReferral 
    ? `#${referralParams.nftId} - ${referralParams.side === 0 ? t('nft.left', 'Izquierdo') : t('nft.right', 'Derecho')}`
    : referralParams?.isCorporate 
      ? t('nft.corporate_account_fund8', 'Cuenta Corporativa de Fund8')
      : null;

  return (
    <div style={{ 
      background: '#0a0e27', 
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'flex-start', // Cambiar a flex-start para que el contenido comience arriba
      justifyContent: 'center',
      padding: '40px 20px', // Más padding vertical
      overflowY: 'auto', // Permitir scroll vertical
      position: 'relative'
    }}>
      <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div style={{ width: '100%', maxWidth: '800px' }}>
            <div style={{
              background: '#151a2e',
              borderRadius: '12px',
              padding: '40px',
              border: '1px solid #1e2541',
              color: '#ffffff',
              width: '100%',
              boxSizing: 'border-box',
              marginBottom: '40px' // Espacio al final para scroll
            }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                {isFund8 ? (
                  <div>
                    <h2 style={{ color: '#00c087', fontWeight: '700', marginBottom: '8px', fontSize: '28px' }}>
                      Fund8
                    </h2>
                    <p style={{ color: '#718096', fontSize: '14px', margin: 0 }}>
                      {t('nft.trading_platform', 'Trading Platform')}
                    </p>
                  </div>
                ) : (
                  <div>
                    <img 
                      src={logo} 
                      alt="DeFily" 
                      style={{ maxWidth: '200px', marginBottom: '12px' }} 
                    />
                    <h3 style={{ color: '#00e5cc', marginTop: '12px', marginBottom: '8px', fontSize: '24px' }}>
                      DeFily
                    </h3>
                  </div>
                )}
                {referralInfo && (
                  <p style={{ color: '#718096', fontSize: '14px', marginTop: '12px', marginBottom: 0 }}>
                    {t('nft.referred_by', 'Referido por')}: {referralInfo}
                  </p>
                )}
              </div>

              {!isConnected ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#a0aec0', fontSize: '16px', marginBottom: '24px' }}>
                    {isFund8 
                      ? t('nft.connect_wallet_fund8_message', 'Conecta tu wallet para comenzar. Puedes registrarte gratis (NFT Básico) o comprar un NFT Premium ($30 USDC).')
                      : t('nft.connect_wallet_defily_message', 'Conecta tu wallet para comprar un NFT Premium ($30 USDC) y comenzar en DeFily.')
                    }
                  </p>
                  <button
                    onClick={handleConnectWallet}
                    style={{
                      background: isFund8 ? '#00c087' : '#00e5cc',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 40px',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {t('nft.connect_wallet', 'Conectar Wallet')}
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{
                    background: 'rgba(0, 192, 135, 0.1)',
                    border: '1px solid #00c087',
                    color: '#00c087',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '24px'
                  }}>
                    <strong>{t('nft.wallet_connected', 'Wallet Conectada')}:</strong> {address?.slice(0, 6)}...{address?.slice(-4)}
                  </div>

                  {isFund8 ? (
                    <div>
                      <h5 style={{ color: '#ffffff', marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                        {t('nft.choose_registration_option', 'Elige tu opción de registro')}:
                      </h5>
                      
                      <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {/* Opción 1: Registro Gratuito (NFT Básico) */}
                        <div style={{ flex: '1', minWidth: '280px', maxWidth: '400px' }}>
                          <div style={{
                            background: '#0a0e27',
                            border: '1px solid #1e2541',
                            borderRadius: '8px',
                            padding: '24px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#00c087';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#1e2541';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                          onClick={() => {
                            // Redirigir al flujo completo de compra con tipo básico
                            navigate(`/nft/select-nft-collection?nftType=basic&${new URLSearchParams({
                              nftId: referralParams?.nftId || '',
                              side: referralParams?.side !== null && referralParams?.side !== undefined ? String(referralParams.side) : ''
                            }).toString()}`);
                          }}
                          >
                            <div style={{ textAlign: 'center' }}>
                              <h4 style={{ color: '#00c087', marginBottom: '12px', fontSize: '24px', fontWeight: '700' }}>
                                {t('nft.free', 'Gratis')}
                              </h4>
                              <h5 style={{ color: '#ffffff', marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                                {t('nft.basic_nft', 'NFT Básico')}
                              </h5>
                              <ul style={{ 
                                listStyle: 'none', 
                                padding: 0, 
                                textAlign: 'left', 
                                color: '#a0aec0', 
                                fontSize: '14px',
                                marginBottom: '20px'
                              }}>
                                <li style={{ marginBottom: '8px' }}>✓ {t('nft.free_registration', 'Registro gratuito')}</li>
                                <li style={{ marginBottom: '8px' }}>✓ {t('nft.can_buy_trading_accounts', 'Puedes comprar Trading Accounts')}</li>
                                <li style={{ marginBottom: '8px' }}>✓ {t('nft.earn_direct_bonus', 'Ganas Direct Bonus (10%)')}</li>
                                <li style={{ marginBottom: '8px' }}>✗ {t('nft.no_cv_rv_downline', 'No ganas CV/RV del downline')}</li>
                                <li style={{ marginBottom: '8px' }}>✗ {t('nft.no_lp_subscriptions', 'No puedes comprar LP Subscriptions')}</li>
                              </ul>
                              <button 
                                style={{
                                  border: '1px solid #00c087',
                                  color: '#00c087',
                                  borderRadius: '6px',
                                  background: 'transparent',
                                  width: '100%',
                                  padding: '10px',
                                  marginTop: '12px',
                                  cursor: 'pointer',
                                  fontWeight: '600',
                                  transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(0, 192, 135, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                {t('nft.register_free', 'Registrar Gratis')}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Opción 2: Premium ($30) */}
                        <div style={{ flex: '1', minWidth: '280px', maxWidth: '400px' }}>
                          <div style={{
                            background: '#0a0e27',
                            border: '2px solid #00c087',
                            borderRadius: '8px',
                            padding: '24px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            position: 'relative'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#00b079';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#00c087';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                          onClick={() => {
                            // Redirigir al flujo completo de compra con tipo premium
                            navigate(`/nft/select-nft-collection?nftType=premium&${new URLSearchParams({
                              nftId: referralParams?.nftId || '',
                              side: referralParams?.side !== null && referralParams?.side !== undefined ? String(referralParams.side) : ''
                            }).toString()}`);
                          }}
                          >
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: '#00c087',
                              color: '#ffffff',
                              padding: '4px 12px',
                              borderRadius: '0 0 8px 8px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              {t('nft.recommended', 'RECOMENDADO')}
                            </div>
                            <div style={{ textAlign: 'center', marginTop: '24px' }}>
                              <h4 style={{ color: '#00c087', marginBottom: '12px', fontSize: '24px', fontWeight: '700' }}>
                                30 USDC
                              </h4>
                              <h5 style={{ color: '#ffffff', marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                                {t('nft.premium_nft', 'NFT Premium')}
                              </h5>
                              <ul style={{ 
                                listStyle: 'none', 
                                padding: 0, 
                                textAlign: 'left', 
                                color: '#a0aec0', 
                                fontSize: '14px',
                                marginBottom: '20px'
                              }}>
                                <li style={{ marginBottom: '8px' }}>✓ {t('nft.full_access_all_products', 'Acceso completo a todos los productos')}</li>
                                <li style={{ marginBottom: '8px' }}>✓ {t('nft.earn_all_commissions', 'Ganas todas las comisiones (CV/RV)')}</li>
                                <li style={{ marginBottom: '8px' }}>✓ {t('nft.binary_matching_bonuses', 'Binary y Matching bonuses')}</li>
                                <li style={{ marginBottom: '8px' }}>✓ {t('nft.direct_bonus_all_purchases', 'Direct Bonus en todas las compras')}</li>
                                <li style={{ marginBottom: '8px' }}>✓ {t('nft.can_buy_lp_subscriptions', 'Puedes comprar LP Subscriptions')}</li>
                              </ul>
                              <button 
                                style={{
                                  background: '#00c087',
                                  border: 'none',
                                  borderRadius: '6px',
                                  color: '#ffffff',
                                  fontWeight: '600',
                                  width: '100%',
                                  padding: '10px',
                                  marginTop: '12px',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#00b079';
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#00c087';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                }}
                              >
                                {t('nft.buy_premium', 'Comprar Premium')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h5 style={{ color: '#ffffff', marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                        {t('nft.buy_premium_nft', 'Compra tu NFT Premium')}
                      </h5>
                      <p style={{ color: '#718096', fontSize: '14px', marginBottom: '24px', fontStyle: 'italic' }}>
                        {t('nft.defily_full_access', 'El NFT se creará en el árbol de DeFily con acceso completo a todas las funcionalidades.')}
                      </p>
                      <div style={{
                        background: '#0a0e27',
                        border: '1px solid #1e2541',
                        borderRadius: '8px',
                        padding: '24px',
                        width: '100%',
                        maxWidth: '500px',
                        margin: '0 auto'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <h4 style={{ color: '#00e5cc', marginBottom: '12px', fontSize: '24px', fontWeight: '700' }}>30 USDC</h4>
                          <h5 style={{ color: '#ffffff', marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                            {t('nft.premium_nft', 'NFT Premium')}
                          </h5>
                          <p style={{ color: '#a0aec0', marginBottom: '20px', fontSize: '14px' }}>
                            {t('nft.full_access_defily', 'Acceso completo a todas las funcionalidades de DeFily')}
                          </p>
                          <button 
                            style={{
                              background: '#00e5cc',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '12px 40px',
                              color: '#ffffff',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#00d4b8';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#00e5cc';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                            onClick={() => {
                              // Redirigir al flujo completo de compra (solo premium para DeFily)
                              navigate(`/nft/select-nft-collection?nftType=premium&${new URLSearchParams({
                                nftId: referralParams?.nftId || '',
                                side: referralParams?.side !== null && referralParams?.side !== undefined ? String(referralParams.side) : ''
                              }).toString()}`);
                            }}
                          >
                            {t('nft.buy_premium_nft', 'Comprar NFT Premium')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTRegistration;
