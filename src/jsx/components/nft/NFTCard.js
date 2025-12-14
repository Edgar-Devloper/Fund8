import React, { useState, useEffect, useRef, memo } from 'react';
import { getNftMetadata, getImageUrl, extractOwnerId } from '../../../utils/nftUtils';
import { copyToClipboard } from '../../../utils/clipboard';
import { generateDefilyReferralLink, generateFund8ReferralLink } from '../../../utils/referralLinks';
import { usePlatform } from '../../../context/PlatformContext';

const NFTCard = memo(({ nft, isSelected, onSelect, onDeselect, t }) => {
  const { isFund8, isDefily } = usePlatform();
  const [metadata, setMetadata] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(null); // 'left' o 'right' (según plataforma actual)
  const processedRef = useRef(false);

  useEffect(() => {
    const currentIpfsLink = nft.ipfsLink;
    const currentTokenId = nft.tokenId;
    const lastProcessed = processedRef.current;

    if (lastProcessed && lastProcessed.ipfsLink === currentIpfsLink && lastProcessed.tokenId === currentTokenId) {
      return;
    }

    processedRef.current = { ipfsLink: currentIpfsLink, tokenId: currentTokenId };
    setMetadata(null);
    setImageUrl(null);
    setLoadingImage(false);

    if (!currentIpfsLink) {
      return;
    }

    if (currentIpfsLink.includes('.json')) {
      setLoadingImage(true);
      getNftMetadata(currentIpfsLink).then(meta => {
        if (meta && meta.image) {
          setMetadata(meta);
          setImageUrl(meta.image);
        } else {
          setImageUrl(getImageUrl(currentIpfsLink, currentTokenId));
        }
        setLoadingImage(false);
      }).catch(err => {
        console.error('[NFTCard] Error loading metadata:', err);
        setImageUrl(getImageUrl(currentIpfsLink, currentTokenId));
        setLoadingImage(false);
      });
    } else {
      setImageUrl(getImageUrl(currentIpfsLink, currentTokenId));
    }
  }, [nft.ipfsLink, nft.tokenId]);

  /**
   * Maneja el clic en un enlace de referido
   * Genera enlace según la plataforma actual (no muestra la otra plataforma)
   * SOLO COPIA al portapapeles, NO navega
   * @param {number|string} side - 0 (Left) o 1 (Right)
   */
  const handleReferralClick = async (e, side) => {
    // Prevenir cualquier navegación o comportamiento por defecto
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!nft.tokenId && nft.tokenId !== 0) {
      alert(t('nft.error_copying_link') || 'Error: NFT ID no disponible');
      return;
    }

    // Generar enlace según la plataforma actual
    // Usar URL relativa para que funcione en localhost y producción
    const link = isFund8
      ? generateFund8ReferralLink(nft.tokenId, side, true) // useRelativeUrl = true
      : generateDefilyReferralLink(nft.tokenId, side, true); // useRelativeUrl = true

    if (!link) {
      alert(t('nft.error_copying_link') || 'Error al generar enlace');
      return;
    }

    // Construir URL completa para copiar (pero usar relativa para navegación local)
    const currentOrigin = window.location.origin;
    const fullLink = `${currentOrigin}${link}`;

    const linkKey = side === 0 || side === 'left' || side === 'L' ? 'left' : 'right';

    try {
      // Copiar la URL completa al portapapeles
      await copyToClipboard(
        fullLink,
        () => {
          setCopiedLink(linkKey);
          setTimeout(() => setCopiedLink(null), 2000);
          console.log('[NFTCard] Enlace copiado:', fullLink);
        },
        (err) => {
          console.error('[NFTCard] Error copying link:', err);
          alert(t('nft.error_copying_link') || 'Error al copiar enlace');
        }
      );
    } catch (err) {
      console.error('[NFTCard] Error in handleReferralClick:', err);
      alert(t('nft.error_copying_link') || 'Error al copiar enlace');
    }
  };

  const ownerId = extractOwnerId(nft.referralsLink);

  // Función para verificar si el NFT es Básico (planId === 0)
  const isBasicNFT = (nft) => {
    return nft && nft.planId !== undefined && nft.planId === 0;
  };

  const handleCardClick = (e) => {
    // El ribbon tiene pointer-events: none, así que no debería interferir
    // Pero por si acaso, verificar que no sea el ribbon
    if (e.target && e.target.classList && e.target.classList.contains('ribbon')) {
      return; // Ignorar clics directos en el ribbon (aunque no debería pasar)
    }
    
    e.stopPropagation();
    
    if (onSelect) {
      onSelect();
    }
  };

  return (
    <div className="col-md-6 col-lg-4 mb-3" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10, overflow: 'visible' }}>
      {/* Ribbon para NFT Básico - Fuera del card para no bloquear clics */}
      {isBasicNFT(nft) && (
        <div 
          className="ribbon ribbon__one"
          style={{ 
            pointerEvents: 'none',
            zIndex: 11,
            userSelect: 'none'
          }}
        >
          {t('nft.basic', 'Básico')}
        </div>
      )}
      <div
        className={`card nft-card ${isSelected ? 'border-success shadow-lg' : 'border-secondary'}`}
        style={{ 
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          borderRadius: '8px',
          overflow: 'visible',
          borderWidth: isSelected ? '1px' : '1px',
          background: isSelected ? '#1f2640' : '#151a2e',
          borderColor: isSelected ? '#00c087' : '#1e2541',
          color: '#ffffff',
          position: 'relative',
          pointerEvents: 'auto',
          zIndex: 10
        }}
        onClick={handleCardClick}
        onMouseDown={(e) => {
          // No detener propagación para permitir que el clic funcione correctamente
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = '#1f2640';
            e.currentTarget.style.borderColor = '#1e2541';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = '#151a2e';
            e.currentTarget.style.borderColor = '#1e2541';
          }
        }}
      >
        <div className="card-body" style={{ padding: '16px' }}>
          {imageUrl ? (
            <div className="text-center mb-3">
              <img
                src={imageUrl}
                alt={nft.name || `NFT #${nft.tokenId}`}
                style={{
                  width: '120px',
                  height: '120px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: isSelected ? '1px solid #00c087' : '1px solid #1e2541',
                  boxShadow: isSelected ? '0 0 0 2px rgba(0, 192, 135, 0.2)' : 'none',
                  transition: 'all 0.3s ease',
                  backgroundColor: '#1a1a2e'
                }}
                onError={(e) => {
                  console.error('[NFTCard] Error loading image:', imageUrl);
                  e.target.style.display = 'none';
                }}
              />
            </div>
          ) : loadingImage ? (
            <div className="text-center mb-3">
              <div style={{
                width: '120px',
                height: '120px',
                background: '#0a0e27',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                border: '1px solid #1e2541'
              }}>
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center mb-3">
              <div style={{
                width: '120px',
                height: '120px',
                background: '#0a0e27',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#718096',
                fontSize: '32px',
                margin: '0 auto',
                border: isSelected ? '1px solid #00c087' : '1px solid #1e2541',
                boxShadow: isSelected ? '0 0 0 2px rgba(0, 192, 135, 0.2)' : 'none'
              }}>
                <i className="fa fa-image"></i>
              </div>
            </div>
          )}
          
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className="flex-grow-1">
              <h6 className="card-title mb-2" style={{ 
                fontSize: '14px', 
                fontWeight: '600',
                color: '#ffffff',
                textAlign: 'center'
              }}>
                {nft.name || `NFT #${nft.id}`}
              </h6>
              <div className="text-center">
                <span className="badge" style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  background: nft.type === 'defily' ? 'rgba(0, 229, 204, 0.1)' : 'rgba(0, 192, 135, 0.1)',
                  color: nft.type === 'defily' ? '#00e5cc' : '#00c087',
                  border: `1px solid ${nft.type === 'defily' ? 'rgba(0, 229, 204, 0.2)' : 'rgba(0, 192, 135, 0.2)'}`,
                  borderRadius: '6px'
                }}>
                  {nft.type === 'defily' ? 'Trader' : 'Fund8'}
                </span>
              </div>
            </div>
            {isSelected && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeselect();
                }}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#00c087',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'absolute',
                  top: '12px',
                  right: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#00b079';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#00c087';
                }}
                title={t('nft.deselect')}
              >
                <i className="fa fa-check" style={{ color: '#fff', fontSize: '12px' }}></i>
              </button>
            )}
          </div>
          
          <div className="nft-details small" style={{ 
            color: '#a0aec0',
            lineHeight: '1.8',
            background: '#0a0e27',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '12px',
            border: '1px solid #1e2541',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div className="d-flex justify-content-between mb-1">
                <span style={{ color: '#718096', fontSize: '11px' }}><strong>{t('nft.nft_id')}:</strong></span>
                <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '11px', fontFamily: 'monospace' }}>#{nft.tokenId}</span>
              </div>
              <div className="d-flex flex-column gap-1">
                <div className="d-flex justify-content-between">
                  <span style={{ color: '#718096', fontSize: '11px' }}><strong>{t('nft.left')}:</strong></span>
                  <span style={{ color: '#00e5cc', fontWeight: '600', fontSize: '11px' }}>{nft.leftSide.length}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span style={{ color: '#718096', fontSize: '11px' }}><strong>{t('nft.right')}:</strong></span>
                  <span style={{ color: '#00c087', fontWeight: '600', fontSize: '11px' }}>{nft.rightSide.length}</span>
                </div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #1e2541', paddingTop: '8px', marginTop: '8px' }}>
              <div className="d-flex justify-content-between">
                <span style={{ color: '#718096', fontSize: '11px' }}><strong>{t('nft.owner_id')}:</strong></span>
                <span style={{ color: ownerId ? '#00e5cc' : '#718096', fontWeight: '600', fontSize: '11px' }}>
                  {ownerId || '-'}
                </span>
              </div>
            </div>
          </div>
          
          {nft.tokenId !== undefined && nft.tokenId !== null && (
            <div className="referral-links-section mt-3" style={{
              background: '#0a0e27',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #1e2541'
            }}>
              <div className="mb-2" style={{ 
                fontSize: '11px', 
                color: '#a0aec0', 
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {t('nft.referral_links') || 'Enlaces de Referido'}
              </div>
              
              {/* Solo mostrar enlaces de la plataforma actual (2 enlaces: Left y Right) */}
              <div className="d-flex flex-column gap-2">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleReferralClick(e, 0);
                  }}
                  style={{
                    width: '100%',
                    minHeight: '32px',
                    background: copiedLink === 'left' ? '#00c087' : 'transparent',
                    color: copiedLink === 'left' ? '#fff' : (isFund8 ? '#00c087' : '#00e5cc'),
                    border: `1px solid ${copiedLink === 'left' ? '#00c087' : (isFund8 ? 'rgba(0, 192, 135, 0.3)' : 'rgba(0, 229, 204, 0.3)')}`,
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    if (copiedLink !== 'left') {
                      e.currentTarget.style.background = isFund8 
                        ? 'rgba(0, 192, 135, 0.1)' 
                        : 'rgba(0, 229, 204, 0.1)';
                      e.currentTarget.style.borderColor = isFund8 
                        ? 'rgba(0, 192, 135, 0.5)' 
                        : 'rgba(0, 229, 204, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (copiedLink !== 'left') {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = isFund8 
                        ? 'rgba(0, 192, 135, 0.3)' 
                        : 'rgba(0, 229, 204, 0.3)';
                    }
                  }}
                  title={t('nft.copy_left_referral_link') || 'Copiar enlace Izquierdo'}
                >
                  {copiedLink === 'left' ? (
                    <>
                      <i className="fa fa-check"></i>
                      <span>{t('nft.copied') || 'Copiado'}</span>
                    </>
                  ) : (
                    <>
                      <i className="fa fa-link"></i>
                      <span>{t('nft.left') || 'Izquierdo'}</span>
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleReferralClick(e, 1);
                  }}
                  style={{
                    width: '100%',
                    minHeight: '32px',
                    background: copiedLink === 'right' ? '#00c087' : 'transparent',
                    color: copiedLink === 'right' ? '#fff' : (isFund8 ? '#00c087' : '#00e5cc'),
                    border: `1px solid ${copiedLink === 'right' ? '#00c087' : (isFund8 ? 'rgba(0, 192, 135, 0.3)' : 'rgba(0, 229, 204, 0.3)')}`,
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    if (copiedLink !== 'right') {
                      e.currentTarget.style.background = isFund8 
                        ? 'rgba(0, 192, 135, 0.1)' 
                        : 'rgba(0, 229, 204, 0.1)';
                      e.currentTarget.style.borderColor = isFund8 
                        ? 'rgba(0, 192, 135, 0.5)' 
                        : 'rgba(0, 229, 204, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (copiedLink !== 'right') {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = isFund8 
                        ? 'rgba(0, 192, 135, 0.3)' 
                        : 'rgba(0, 229, 204, 0.3)';
                    }
                  }}
                  title={t('nft.copy_right_referral_link') || 'Copiar enlace Derecho'}
                >
                  {copiedLink === 'right' ? (
                    <>
                      <i className="fa fa-check"></i>
                      <span>{t('nft.copied') || 'Copiado'}</span>
                    </>
                  ) : (
                    <>
                      <i className="fa fa-link"></i>
                      <span>{t('nft.right') || 'Derecho'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

NFTCard.displayName = 'NFTCard';

export default NFTCard;

