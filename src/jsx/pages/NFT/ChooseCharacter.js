import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlatform } from '../../../context/PlatformContext';
import logo from "../../../images/logo-full.png";
import dogImage from "../../../images/nft/nftAleatorio.png";
import bullImage from "../../../images/nft/toroCompleto.png";

/**
 * Pantalla para elegir tipo de personaje/animal
 * Adaptada de DeFily para Fund8 - Diseño mejorado
 */
const ChooseCharacter = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const platformContext = usePlatform();
  const isFund8 = platformContext?.isFund8 ?? true;
  const isDefily = platformContext?.isDefily ?? false;
  const accentColor = isFund8 ? '#00c087' : '#00e5cc';

  useEffect(() => {
    console.log('[ChooseCharacter] Componente montado');
    console.log('[ChooseCharacter] Imágenes cargadas:', { dogImage, bullImage });
  }, []);

  const handleSelectAnimal = (animalType) => {
    console.log('[ChooseCharacter] Seleccionado animal:', animalType);
    navigate(`/nft/buy-pet?animalType=${animalType}&${searchParams.toString()}`);
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
      position: 'relative',
      overflow: 'auto'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {/* Card Principal */}
        <div style={{
          background: 'rgba(21, 26, 46, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px 25px',
          border: `1px solid rgba(0, 192, 135, 0.2)`,
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset`,
          color: '#ffffff',
          width: '100%',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Efecto de brillo sutil */}
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
            marginBottom: '28px',
            position: 'relative'
          }}>
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
                <p style={{ 
                  color: '#a0aec0', 
                  fontSize: '16px', 
                  margin: 0,
                  fontWeight: '500'
                }}>
                  {t('nft.choose_character', '¡Elige un Personaje!')}
                </p>
              </div>
            ) : (
              <div>
                <img 
                  src={logo} 
                  alt="DeFily" 
                  style={{ maxWidth: '160px', marginBottom: '16px' }} 
                />
                <h3 style={{ color: '#00e5cc', marginBottom: '8px', fontSize: '24px' }}>
                  ¡Elige un Personaje!
                </h3>
              </div>
            )}
          </div>

          {/* Character Grid */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            gap: '24px', 
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            {/* Dog Card */}
            <div 
              onClick={() => handleSelectAnimal('dog')}
              style={{
                background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
                border: '2px solid #1e2541',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                position: 'relative',
                padding: '8px',
                width: '280px',
                height: '280px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accentColor;
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = `0 10px 30px ${accentColor}30, 0 0 0 1px ${accentColor}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1e2541';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Efecto de brillo en hover */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '100%',
                background: `linear-gradient(135deg, ${accentColor}05, transparent)`,
                opacity: 0,
                transition: 'opacity 0.3s',
                pointerEvents: 'none'
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = 1;
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = 0;
              }}
              />
              
              <div style={{
                background: '#0a0e27',
                borderRadius: '12px',
                padding: '12px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                width: '100%'
              }}>
                <img
                  src={dogImage}
                  alt="Dog NFT"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    maxWidth: '264px',
                    maxHeight: '264px',
                    objectFit: 'contain', 
                    display: 'block',
                    filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.5))'
                  }}
                  onError={(e) => {
                    console.error('Error loading dog image:', dogImage);
                    e.target.style.display = 'none';
                    const parent = e.target.parentElement;
                    if (parent && !parent.querySelector('.placeholder')) {
                      const placeholder = document.createElement('div');
                      placeholder.className = 'placeholder';
                      placeholder.style.cssText = 'height: 160px; display: flex; align-items: center; justify-content: center; color: #718096; font-size: 14px; font-weight: 600;';
                      placeholder.textContent = t('nft.dog', 'Perro');
                      parent.appendChild(placeholder);
                    }
                  }}
                />
              </div>
            </div>

            {/* Bull Card */}
            <div 
              onClick={() => handleSelectAnimal('bull')}
              style={{
                background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
                border: '2px solid #1e2541',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                position: 'relative',
                padding: '8px',
                width: '280px',
                height: '280px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accentColor;
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = `0 10px 30px ${accentColor}30, 0 0 0 1px ${accentColor}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1e2541';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Efecto de brillo en hover */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '100%',
                background: `linear-gradient(135deg, ${accentColor}05, transparent)`,
                opacity: 0,
                transition: 'opacity 0.3s',
                pointerEvents: 'none'
              }}
              />
              
              <div style={{
                background: '#0a0e27',
                borderRadius: '12px',
                padding: '12px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                width: '100%'
              }}>
                <img
                  src={bullImage}
                  alt="Bull NFT"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    maxWidth: '264px',
                    maxHeight: '264px',
                    objectFit: 'contain', 
                    display: 'block',
                    filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.5))'
                  }}
                  onError={(e) => {
                    console.error('Error loading bull image:', bullImage);
                    e.target.style.display = 'none';
                    const parent = e.target.parentElement;
                    if (parent && !parent.querySelector('.placeholder')) {
                      const placeholder = document.createElement('div');
                      placeholder.className = 'placeholder';
                      placeholder.style.cssText = 'height: 160px; display: flex; align-items: center; justify-content: center; color: #718096; font-size: 14px; font-weight: 600;';
                      placeholder.textContent = t('nft.bull', 'Toro');
                      parent.appendChild(placeholder);
                    }
                  }}
                />
              </div>
            </div>

          </div>

          {/* Back Button */}
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: 'rgba(30, 37, 65, 0.5)',
                border: `1px solid rgba(0, 192, 135, 0.3)`,
                borderRadius: '12px',
                color: '#a0aec0',
                padding: '12px 32px',
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChooseCharacter;
