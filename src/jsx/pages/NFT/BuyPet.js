import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlatform } from '../../../context/PlatformContext';
import logo from "../../../images/logo-full.png";
import dogImage from "../../../images/nft/nftAleatorio.png";
import bullImage from "../../../images/nft/toroCompleto.png";

/**
 * Pantalla para ensamblar/ver el NFT
 * Diseño mejorado y elegante
 */
const BuyPet = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isFund8, isDefily } = usePlatform();
  const accentColor = isFund8 ? '#00c087' : '#00e5cc';
  
  const mode = searchParams.get('mode'); // 'buildable' o 'random'
  const animalType = searchParams.get('animalType'); // 'dog' o 'bull'
  const characterId = searchParams.get('characterId');

  // Función para obtener la imagen según el tipo
  const getImageByType = (type) => {
    return type === 'bull' ? bullImage : dogImage;
  };

  const [characterParts, setCharacterParts] = useState(null);

  useEffect(() => {
    if (characterId) {
      setCharacterParts({
        type: animalType || 'dog',
        mode: mode || 'random'
      });
    } else if (mode === 'random') {
      setCharacterParts({
        type: animalType || 'dog',
        mode: 'random'
      });
    } else {
      setCharacterParts({
        type: animalType || 'dog',
        mode: 'buildable'
      });
    }
  }, [mode, animalType, characterId]);

  const handleContinue = () => {
    const newCharacterId = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    navigate(`/nft/pet-confirmation?characterId=${newCharacterId}&${searchParams.toString()}`);
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
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Card Principal */}
        <div style={{
          background: 'rgba(21, 26, 46, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '50px 40px',
          border: `1px solid rgba(0, 192, 135, 0.2)`,
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset`,
          color: '#ffffff',
          width: '100%',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Efecto de brillo superior */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            opacity: 0.6
          }} />

          {/* Header */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '40px'
          }}>
            {isFund8 ? (
              <div>
                <h2 style={{ 
                  color: accentColor, 
                  fontWeight: '800', 
                  marginBottom: '12px', 
                  fontSize: '36px',
                  textShadow: `0 0 20px ${accentColor}40`,
                  letterSpacing: '1px'
                }}>
                  Fund8
                </h2>
                <p style={{ 
                  color: '#a0aec0', 
                  fontSize: '18px', 
                  margin: 0,
                  fontWeight: '500'
                }}>
                  {mode === 'random' ? t('nft.here_is_your_nft', '¡Aquí está tu NFT!') : t('nft.customize_your_nft', 'Personaliza tu NFT')}
                </p>
              </div>
            ) : (
              <div>
                <img 
                  src={logo} 
                  alt="DeFily" 
                  style={{ maxWidth: '200px', marginBottom: '20px' }} 
                />
                <h3 style={{ color: '#00e5cc', marginBottom: '8px', fontSize: '28px' }}>
                  {mode === 'random' ? t('nft.here_is_your_nft', '¡Aquí está tu NFT!') : t('nft.customize_your_nft', 'Personaliza tu NFT')}
                </h3>
              </div>
            )}
          </div>

          {/* NFT Preview Card */}
          <div style={{
            background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
            border: `2px solid rgba(0, 192, 135, 0.3)`,
            borderRadius: '20px',
            padding: '8px',
            marginBottom: '32px',
            textAlign: 'center',
            position: 'relative',
            boxShadow: `0 10px 40px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.05)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 32px auto',
            width: 'fit-content',
            minWidth: '300px',
            minHeight: '300px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              borderRadius: '12px',
              position: 'relative',
              width: '100%',
              height: '100%',
              minHeight: '284px'
            }}>
              {characterParts && (
                <img
                  src={getImageByType(characterParts.type)}
                  alt={`${characterParts.type || 'dog'} NFT`}
                  style={{
                    width: '100%',
                    height: '100%',
                    maxWidth: '284px',
                    maxHeight: '284px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 15px 40px rgba(0, 0, 0, 0.6))',
                    animation: 'fadeIn 0.5s ease-in',
                    display: 'block'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const previewText = t('nft.nft_preview', 'Vista Previa del NFT');
                    e.currentTarget.innerHTML = `
                      <div style="
                        height: 350px; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        color: #718096;
                        font-size: 18px;
                      ">
                        ${previewText}
                      </div>
                    `;
                  }}
                />
              )}
            </div>
          </div>


          {/* Action Buttons */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '16px' 
          }}>
            <button
              onClick={handleBack}
              style={{
                background: 'rgba(30, 37, 65, 0.5)',
                border: `1px solid rgba(0, 192, 135, 0.3)`,
                borderRadius: '12px',
                color: '#a0aec0',
                padding: '16px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 192, 135, 0.1)';
                e.currentTarget.style.borderColor = accentColor;
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(30, 37, 65, 0.5)';
                e.currentTarget.style.borderColor = 'rgba(0, 192, 135, 0.3)';
                e.currentTarget.style.color = '#a0aec0';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {t('common.back', 'Volver')}
            </button>
            <button
              onClick={handleContinue}
              style={{
                background: `linear-gradient(135deg, ${accentColor} 0%, ${isFund8 ? '#00a872' : '#00c4b3'} 100%)`,
                border: 'none',
                borderRadius: '12px',
                color: '#ffffff',
                padding: '16px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: `0 4px 20px ${accentColor}40`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 6px 30px ${accentColor}60`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 20px ${accentColor}40`;
              }}
            >
              {t('nft.continue', 'Continuar')}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default BuyPet;
