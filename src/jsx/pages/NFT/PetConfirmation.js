import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlatform } from '../../../context/PlatformContext';
import { useConfirmNftPurchase } from '../../hooks/useConfirmNftPurchase';
import logo from "../../../images/logo-full.png";
import dogImage from "../../../images/nft/nftAleatorio.png";
import bullImage from "../../../images/nft/toroCompleto.png";

/**
 * Pantalla de confirmación antes de comprar el NFT
 * Adaptada de DeFily para Fund8
 */
const PetConfirmation = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isFund8, isDefily } = usePlatform();
  const accentColor = isFund8 ? '#00c087' : '#00e5cc';
  const animalType = searchParams.get('animalType');
  // Obtener el tipo de NFT desde los parámetros de URL (seleccionado en la primera pantalla)
  const nftType = searchParams.get('nftType') || 'premium'; // Default a 'premium' si no viene
  
  const { 
    nftName, 
    setNftName, 
    isLoading, 
    characterParts, 
    mode,
    characterId,
    preflightPurchase 
  } = useConfirmNftPurchase();

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Función para obtener la imagen según el tipo
  const getImageByType = (type) => {
    return type === 'bull' ? bullImage : dogImage;
  };

  const handleConfirmPurchase = async () => {
    if (!nftName.trim()) {
      setError(t('nft.name_required', 'Por favor ingresa un nombre para tu NFT'));
      return;
    }

    setError(null);
    setSuccessMessage(null);
    
    try {
      console.log('[PetConfirmation] Iniciando compra...', { nftType, nftName });
      // Usar el tipo de NFT seleccionado en la primera pantalla
      const result = await preflightPurchase(nftType);
      
      if (result && result.success) {
        setSuccessMessage(t('nft.created_success', '¡NFT creado exitosamente!'));
        
        setTimeout(() => {
          navigate('/trading');
        }, 2000);
      } else {
        navigate('/trading');
      }
    } catch (err) {
      console.error('[PetConfirmation] Error completo:', err);
      
      let errorMessage = t('nft.purchase_error', 'Error al procesar la compra');
      
      if (err.message) {
        errorMessage = err.message;
        
        if (err.message.includes('BSC') || err.message.includes('Binance Smart Chain') || err.message.includes('cambia a BSC')) {
          // Ya tiene el mensaje de red, mantenerlo
        } else if (err.message.includes('No hay dirección de contrato NFT')) {
          errorMessage = t('nft.contract_error', 'Error de configuración: No se encontró la dirección del contrato NFT.');
        } else if (err.message.includes('insufficient funds')) {
          errorMessage = t('nft.insufficient_funds', 'Fondos insuficientes.');
        } else if (err.message.includes('user rejected') || err.message.includes('User denied')) {
          errorMessage = t('nft.transaction_cancelled', 'Transacción cancelada por el usuario');
        } else if (err.message.includes('SIDE_OCCUPIED')) {
          errorMessage = t('nft.side_occupied', 'El lado seleccionado ya está ocupado.');
        } else if (err.message.includes('pausado') || err.message.includes('paused')) {
          errorMessage = t('nft.contract_paused', 'El contrato está pausado temporalmente.');
        } else if (err.message.includes('Referral link no disponible')) {
          errorMessage = t('nft.referral_error', 'Error: No se pudo obtener el enlace de referido.');
        }
      }
      
      setError(errorMessage);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #0a0e27 0%, #151a2e 100%)', 
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '30px 20px',
      position: 'relative'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '500px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          {isFund8 ? (
            <div>
              <h2 style={{ 
                color: accentColor, 
                fontWeight: '800', 
                marginBottom: '8px', 
                fontSize: '28px',
                textShadow: `0 0 20px ${accentColor}40`,
                letterSpacing: '1px'
              }}>
                Fund8
              </h2>
            </div>
          ) : (
            <div>
              <img 
                src={logo} 
                alt="DeFily" 
                style={{ maxWidth: '160px', marginBottom: '16px' }} 
              />
            </div>
          )}
          <div style={{ 
            color: '#ffffff', 
            fontSize: '16px', 
            fontWeight: '600',
            marginBottom: '6px'
          }}>
            {t('nft.confirmation', 'Confirmación de NFT')}
          </div>
          <div style={{ 
            color: '#a0aec0', 
            fontSize: '11px', 
            fontWeight: '600'
          }}>
            {t('nft.congratulations', '¡Felicitaciones por tu obra de arte!')}
          </div>
        </div>

        {/* NFT Preview */}
        {characterParts && (
          <div style={{
            background: 'rgba(21, 26, 46, 0.95)',
            backdropFilter: 'blur(10px)',
            border: `1px solid rgba(0, 192, 135, 0.2)`,
            borderRadius: '16px',
            padding: '6px',
            textAlign: 'center',
            position: 'relative',
            boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            width: 'fit-content',
            minWidth: '220px',
            minHeight: '220px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              borderRadius: '10px',
              position: 'relative',
              width: '100%',
              height: '100%',
              minHeight: '208px'
            }}>
              <img
                src={getImageByType(characterParts.type || animalType)}
                alt={`${characterParts.type || animalType || 'dog'} NFT`}
                style={{
                  width: '100%',
                  height: '100%',
                  maxWidth: '208px',
                  maxHeight: '208px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 15px 40px rgba(0, 0, 0, 0.6))',
                  display: 'block'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  const previewText = t('nft.nft_preview', 'Vista Previa del NFT');
                  e.currentTarget.innerHTML = `
                    <div style="
                      height: 208px; 
                      display: flex; 
                      align-items: center; 
                      justify-content: center; 
                      color: #718096;
                      font-size: 14px;
                    ">
                      ${previewText}
                    </div>
                  `;
                }}
              />
            </div>
            {/* Price Badge */}
            <div style={{
              position: 'absolute',
              bottom: '6px',
              right: '6px',
              background: 'rgba(10, 14, 39, 0.95)',
              backdropFilter: 'blur(10px)',
              padding: '6px 12px',
              borderRadius: '6px',
              border: `1px solid ${accentColor}40`
            }}>
              <span style={{ 
                color: '#ffffff', 
                fontSize: '12px', 
                fontWeight: '600' 
              }}>
                {isFund8 && nftType === 'premium' ? '30 USDC' : t('nft.free', 'Gratis')}
              </span>
            </div>
          </div>
        )}

        {/* NFT Name Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
          <p style={{ color: '#ffffff', fontSize: '13px', fontWeight: '600', margin: 0 }}>
            {t('nft.account_username', 'Nombre de la Cuenta NFT')}
          </p>
          <input
            type="text"
            value={nftName}
            onChange={(e) => setNftName(e.target.value)}
            disabled={isLoading}
            placeholder={t('nft.enter_name', 'Ingresa el nombre de tu NFT')}
            style={{
              background: 'rgba(10, 14, 39, 0.5)',
              border: `1px solid rgba(0, 192, 135, 0.3)`,
              borderRadius: '10px',
              color: '#ffffff',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: '600',
              width: '100%',
              outline: 'none',
              transition: 'all 0.3s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = accentColor;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(0, 192, 135, 0.3)';
            }}
          />
        </div>

        {/* NFT Type Display (Solo para Fund8) - Solo muestra el tipo seleccionado, no permite cambiar */}
        {isFund8 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <p style={{ color: '#ffffff', fontSize: '13px', fontWeight: '600', margin: 0 }}>
              {t('nft.nft_type', 'Tipo de NFT')}
            </p>
            <div style={{
              background: 'rgba(10, 14, 39, 0.5)',
              border: `2px solid ${accentColor}`,
              borderRadius: '10px',
              padding: '14px',
              textAlign: 'center',
              position: 'relative'
            }}>
              {nftType === 'premium' && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: accentColor,
                  color: '#ffffff',
                  padding: '3px 10px',
                  borderRadius: '0 0 6px 6px',
                  fontSize: '10px',
                  fontWeight: '600'
                }}>
                  {t('nft.recommended', 'RECOMENDADO')}
                </div>
              )}
              <div style={{ marginTop: nftType === 'premium' ? '16px' : '0' }}>
                <h5 style={{ 
                  color: nftType === 'premium' ? accentColor : '#ffffff', 
                  marginBottom: '6px', 
                  fontSize: '16px', 
                  fontWeight: '600' 
                }}>
                  {nftType === 'premium' ? '30 USDC' : t('nft.free', 'Gratis')}
                </h5>
                <p style={{ color: '#718096', fontSize: '11px', margin: 0 }}>
                  {nftType === 'premium' ? t('nft.premium_nft', 'NFT Premium') : t('nft.basic_nft', 'NFT Básico')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div style={{
            background: `rgba(0, 192, 135, 0.1)`,
            border: `1px solid ${accentColor}`,
            borderRadius: '10px',
            padding: '12px',
            color: accentColor,
            fontSize: '13px'
          }}>
            <strong>✓ {t('nft.success', 'Éxito')}:</strong> {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(255, 92, 92, 0.1)',
            border: '1px solid #ff5c5c',
            borderRadius: '10px',
            padding: '12px',
            color: '#ff5c5c',
            fontSize: '13px'
          }}>
            <strong>✗ {t('nft.error', 'Error')}:</strong> {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
          <button
            onClick={handleBack}
            disabled={isLoading}
            style={{
              background: 'rgba(30, 37, 65, 0.5)',
              border: `1px solid rgba(0, 192, 135, 0.3)`,
              borderRadius: '10px',
              color: '#a0aec0',
              padding: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 192, 135, 0.1)';
              e.currentTarget.style.borderColor = accentColor;
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(30, 37, 65, 0.5)';
              e.currentTarget.style.borderColor = 'rgba(0, 192, 135, 0.3)';
              e.currentTarget.style.color = '#a0aec0';
            }}
          >
            {t('common.back', 'Volver')}
          </button>
          <button
            onClick={handleConfirmPurchase}
            disabled={!nftName.trim() || isLoading}
            style={{
              background: `linear-gradient(135deg, ${accentColor} 0%, ${isFund8 ? '#00a872' : '#00c4b3'} 100%)`,
              border: 'none',
              borderRadius: '10px',
              color: '#ffffff',
              padding: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: (!nftName.trim() || isLoading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: (!nftName.trim() || isLoading) ? 0.5 : 1,
              boxShadow: `0 4px 20px ${accentColor}40`
            }}
            onMouseEnter={(e) => {
              if (!(!nftName.trim() || isLoading)) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 6px 30px ${accentColor}60`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 20px ${accentColor}40`;
            }}
          >
            {isLoading 
              ? t('nft.processing', 'Procesando...') 
              : (isFund8 && nftType === 'basic' 
                  ? t('nft.register_free', 'Registrar Gratis') 
                  : t('nft.confirm_purchase', 'Confirmar Compra'))}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PetConfirmation;
