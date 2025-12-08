import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlatform } from '../../../context/PlatformContext';
import logo from "../../../images/logo-full.png";
import toroRojo from "../../../images/nft/toroRojo.png";
import perro from "../../../images/nft/perro.png";
import toroPurpura from "../../../images/nft/toroPurpura.png";

/**
 * Pantalla para seleccionar colección de NFT
 * Adaptada de DeFily para Fund8
 */
const SelectNFTCollection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const platformContext = usePlatform();
  
  // Extraer valores con fallbacks seguros
  const isFund8 = platformContext?.isFund8 ?? true;
  const isDefily = platformContext?.isDefily ?? false;

  const handleChooseCharacter = (mode) => {
    navigate(`/nft/choose-character?mode=${mode}&${searchParams.toString()}`);
  };

  return (
    <div style={{ 
      background: '#0a0e27', 
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      overflowY: 'auto',
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
              boxSizing: 'border-box'
            }}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                {isFund8 ? (
                  <div>
                    <h2 style={{ color: '#00c087', fontWeight: '700', marginBottom: '8px', fontSize: '28px' }}>
                      Fund8
                    </h2>
                    <p style={{ color: '#718096', fontSize: '14px', margin: 0 }}>
                      {t('nft.select_nft_collection', 'Selecciona una Colección de NFT')}
                    </p>
                  </div>
                ) : (
                  <div>
                    <img 
                      src={logo} 
                      alt="DeFily" 
                      style={{ maxWidth: '200px', marginBottom: '20px' }} 
                    />
                    <h3 style={{ color: '#00e5cc', marginBottom: '8px', fontSize: '24px' }}>
                      {t('nft.select_nft_collection', 'Selecciona una Colección de NFT')}
                    </h3>
                  </div>
                )}
              </div>

              {/* Banner Corporativo y Elegante */}
              <div style={{
                background: 'linear-gradient(135deg, #0a0e27 0%, #151a2e 50%, #0a0e27 100%)',
                border: `1px solid ${isFund8 ? 'rgba(0, 192, 135, 0.3)' : 'rgba(0, 229, 204, 0.3)'}`,
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '24px',
                position: 'relative',
                boxShadow: `0 10px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05) inset`
              }}>
                {/* Efecto de brillo superior */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: `linear-gradient(90deg, transparent, ${isFund8 ? '#00c087' : '#00e5cc'}, transparent)`,
                  opacity: 0.6
                }} />
                
                {/* Contenido del Banner */}
                <div style={{
                  padding: '40px 32px',
                  position: 'relative',
                  background: 'linear-gradient(135deg, rgba(0, 192, 135, 0.05) 0%, rgba(21, 26, 46, 0.8) 100%)'
                }}>
                  {/* Patrón de fondo sutil */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    opacity: 0.03,
                    backgroundImage: `radial-gradient(circle at 2px 2px, ${isFund8 ? '#00c087' : '#00e5cc'} 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                  }} />
                  
                  <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    {/* Título Principal */}
                    <h3 style={{
                      color: '#ffffff',
                      fontSize: '32px',
                      fontWeight: '700',
                      marginBottom: '20px',
                      textShadow: `0 0 20px ${isFund8 ? 'rgba(0, 192, 135, 0.3)' : 'rgba(0, 229, 204, 0.3)'}`,
                      letterSpacing: '1px'
                    }}>
                      {t('nft.create_your_nft', 'Crea Tu NFT')}
                    </h3>
                    
                    {/* Imágenes organizadas */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '24px',
                      marginBottom: '24px',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{
                        background: 'rgba(10, 14, 39, 0.6)',
                        borderRadius: '12px',
                        padding: '12px',
                        border: `1px solid ${isFund8 ? 'rgba(0, 192, 135, 0.2)' : 'rgba(0, 229, 204, 0.2)'}`,
                        boxShadow: `0 4px 15px rgba(0, 0, 0, 0.3)`,
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = `0 8px 25px ${isFund8 ? 'rgba(0, 192, 135, 0.4)' : 'rgba(0, 229, 204, 0.4)'}`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = `0 4px 15px rgba(0, 0, 0, 0.3)`;
                      }}
                      >
                        <img 
                          src={toroRojo} 
                          alt="Toro Rojo" 
                          style={{ 
                            width: '120px', 
                            height: '120px', 
                            objectFit: 'contain',
                            display: 'block'
                          }} 
                        />
                      </div>
                      <div style={{
                        background: 'rgba(10, 14, 39, 0.6)',
                        borderRadius: '12px',
                        padding: '12px',
                        border: `1px solid ${isFund8 ? 'rgba(0, 192, 135, 0.2)' : 'rgba(0, 229, 204, 0.2)'}`,
                        boxShadow: `0 4px 15px rgba(0, 0, 0, 0.3)`,
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = `0 8px 25px ${isFund8 ? 'rgba(0, 192, 135, 0.4)' : 'rgba(0, 229, 204, 0.4)'}`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = `0 4px 15px rgba(0, 0, 0, 0.3)`;
                      }}
                      >
                        <img 
                          src={perro} 
                          alt="Perro" 
                          style={{ 
                            width: '120px', 
                            height: '120px', 
                            objectFit: 'contain',
                            display: 'block'
                          }} 
                        />
                      </div>
                      <div style={{
                        background: 'rgba(10, 14, 39, 0.6)',
                        borderRadius: '12px',
                        padding: '12px',
                        border: `1px solid ${isFund8 ? 'rgba(0, 192, 135, 0.2)' : 'rgba(0, 229, 204, 0.2)'}`,
                        boxShadow: `0 4px 15px rgba(0, 0, 0, 0.3)`,
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = `0 8px 25px ${isFund8 ? 'rgba(0, 192, 135, 0.4)' : 'rgba(0, 229, 204, 0.4)'}`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = `0 4px 15px rgba(0, 0, 0, 0.3)`;
                      }}
                      >
                        <img 
                          src={toroPurpura} 
                          alt="Toro Púrpura" 
                          style={{ 
                            width: '120px', 
                            height: '120px', 
                            objectFit: 'contain',
                            display: 'block'
                          }} 
                        />
                      </div>
                    </div>
                    
                    {/* Subtítulo */}
                    <p style={{
                      color: '#a0aec0',
                      fontSize: '16px',
                      marginBottom: '20px',
                      fontWeight: '400',
                      lineHeight: '1.6'
                    }}>
                      {t('nft.choose_creation_mode', 'Elige cómo deseas crear tu NFT único y personalizado')}
                    </p>
                    
                    {/* Línea decorativa */}
                    <div style={{
                      width: '80px',
                      height: '3px',
                      background: `linear-gradient(90deg, transparent, ${isFund8 ? '#00c087' : '#00e5cc'}, transparent)`,
                      margin: '0 auto',
                      borderRadius: '2px'
                    }} />
                  </div>
                </div>
                
                {/* Sección de Botones */}
                <div style={{
                  padding: '24px 32px 32px',
                  background: 'rgba(10, 14, 39, 0.6)'
                }}>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      onClick={() => handleChooseCharacter('buildable')}
                      style={{
                        flex: '1',
                        minWidth: '240px',
                        background: `linear-gradient(135deg, ${isFund8 ? '#00c087' : '#00e5cc'} 0%, ${isFund8 ? '#00a872' : '#00c4b3'} 100%)`,
                        border: 'none',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontWeight: '600',
                        padding: '16px 24px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontSize: '15px',
                        boxShadow: `0 4px 20px ${isFund8 ? 'rgba(0, 192, 135, 0.3)' : 'rgba(0, 229, 204, 0.3)'}`,
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = `0 6px 30px ${isFund8 ? 'rgba(0, 192, 135, 0.5)' : 'rgba(0, 229, 204, 0.5)'}`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = `0 4px 20px ${isFund8 ? 'rgba(0, 192, 135, 0.3)' : 'rgba(0, 229, 204, 0.3)'}`;
                      }}
                    >
                      {t('nft.create_my_own_nft', 'Crear Mi Propio NFT')}
                    </button>
                    <button
                      onClick={() => handleChooseCharacter('random')}
                      style={{
                        flex: '1',
                        minWidth: '240px',
                        background: `linear-gradient(135deg, ${isFund8 ? '#00c087' : '#00e5cc'} 0%, ${isFund8 ? '#00a872' : '#00c4b3'} 100%)`,
                        border: 'none',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontWeight: '600',
                        padding: '16px 24px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontSize: '15px',
                        boxShadow: `0 4px 20px ${isFund8 ? 'rgba(0, 192, 135, 0.3)' : 'rgba(0, 229, 204, 0.3)'}`,
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = `0 6px 30px ${isFund8 ? 'rgba(0, 192, 135, 0.5)' : 'rgba(0, 229, 204, 0.5)'}`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = `0 4px 20px ${isFund8 ? 'rgba(0, 192, 135, 0.3)' : 'rgba(0, 229, 204, 0.3)'}`;
                      }}
                    >
                      {t('nft.create_it_for_me', 'Crear por Mí')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Futuristic Art Collection (Sold Out) - Temporalmente deshabilitado */}
              {/* <div style={{
                background: '#0a0e27',
                border: '1px solid #1e2541',
                borderRadius: '8px',
                overflow: 'hidden',
                opacity: 0.6,
                marginBottom: '24px'
              }}>
                <img 
                  src={futuristicArtBanner} 
                  alt={t('nft.futuristic_art_banner', 'Futuristic Art')}
                  style={{ 
                    width: '100%',
                    maxHeight: '200px', 
                    objectFit: 'cover',
                    display: 'block'
                  }}
                  onError={(e) => {
                    // Fallback a placeholder si la imagen falla
                    e.target.style.display = 'none';
                    const placeholder = e.target.parentElement.querySelector('.placeholder');
                    if (placeholder) placeholder.style.display = 'flex';
                  }}
                />
                <div 
                  className="placeholder"
                  style={{
                    width: '100%',
                    height: '200px',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '24px',
                    fontWeight: '700'
                  }}
                >
                  {t('nft.futuristic_art_banner', 'Futuristic Art')}
                </div>
                <div style={{ padding: '24px' }}>
                  <h5 style={{ color: '#ffffff', marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                    {t('nft.futuristic_art', 'Futuristic Art')}
                  </h5>
                  <button
                    disabled
                    style={{
                      width: '100%',
                      background: '#718096',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontWeight: '600',
                      padding: '12px',
                      cursor: 'not-allowed',
                      fontSize: '14px'
                    }}
                  >
                    {t('nft.sold_out', 'Agotado')}
                  </button>
                </div>
              </div> */}

              {/* Back Button */}
              <div style={{ textAlign: 'center', marginTop: '32px' }}>
                <button
                  onClick={() => navigate(-1)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #1e2541',
                    borderRadius: '6px',
                    color: '#718096',
                    padding: '10px 30px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1f2640';
                    e.currentTarget.style.borderColor = '#1e2541';
                    e.currentTarget.style.color = '#a0aec0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = '#1e2541';
                    e.currentTarget.style.color = '#718096';
                  }}
                >
                  {t('common.back', 'Volver')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectNFTCollection;
