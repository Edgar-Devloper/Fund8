import React, { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { useNFT } from '../../context/NFTContext';
import { useTranslation } from 'react-i18next';

const getNftMetadata = async (ipfsLink) => {
  if (!ipfsLink || !ipfsLink.includes('.json')) {
    return null;
  }

  try {
    const ipfsCid = ipfsLink.split('//')[1];
    const metadataUrl = `https://ipfs.io/ipfs/${ipfsCid}`;
    
    const response = await fetch(metadataUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch NFT metadata');
    }
    
    const metadata = await response.json();
    
    if (metadata.image) {
      metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    return metadata;
  } catch (error) {
    console.error('[NFT Metadata] Error fetching metadata:', error);
    return null;
  }
};

const getImageUrl = (ipfsLink, tokenId = null, metadata = null) => {
  if (!ipfsLink || ipfsLink.trim() === '') {
    return null;
  }
  
  if (metadata && metadata.image) {
    return metadata.image;
  }
  
  let cleanLink = ipfsLink.trim();
  
  if (cleanLink.startsWith('http://') || cleanLink.startsWith('https://')) {
    return cleanLink;
  }
  
  if (cleanLink.startsWith('ipfs://')) {
    let cid = cleanLink.replace('ipfs://', '').trim();
    
    if (cleanLink.includes('.json')) {
      const parts = cid.split('/');
      cid = parts[0];
      if (tokenId) {
        return `https://ipfs.io/ipfs/${cid}/${tokenId}.png`;
      }
      return `https://ipfs.io/ipfs/${cid}`;
    }
    
    return `https://ipfs.io/ipfs/${cid}`;
  }
  
  if (cleanLink.match(/^[a-zA-Z0-9]{46,59}$/) || cleanLink.startsWith('Qm') || cleanLink.startsWith('bafy')) {
    return `https://ipfs.io/ipfs/${cleanLink}${tokenId ? `/${tokenId}.png` : ''}`;
  }
  
  return `https://ipfs.io/ipfs/${cleanLink}`;
};

const generateReferralLink = (referralsLink, side) => {
  if (!referralsLink) {
    return null;
  }
  
  const sideValue = side === 'left' ? '0' : '1';
  const baseUrl = window.location.origin;
  
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('ref', referralsLink);
    url.searchParams.set('side', sideValue);
    return url.toString();
  } catch {
    return `${baseUrl}?ref=${encodeURIComponent(referralsLink)}&side=${sideValue}`;
  }
};

const copyToClipboard = async (text, onSuccess, onError) => {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      if (onSuccess) onSuccess();
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (onSuccess) onSuccess();
    }
  } catch (err) {
    console.error('Error copying to clipboard:', err);
    if (onError) onError(err);
  }
};

const NFTCard = memo(({ nft, isSelected, onSelect, onDeselect, t }) => {
  const [metadata, setMetadata] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(null);
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

  return (
    <div className="col-md-6 col-lg-4 mb-3">
      <div
        className={`card nft-card ${isSelected ? 'border-success shadow-lg' : 'border-secondary'}`}
        style={{ 
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          borderRadius: '8px',
          overflow: 'hidden',
          borderWidth: isSelected ? '1px' : '1px',
          background: isSelected ? '#1f2640' : '#151a2e',
          borderColor: isSelected ? '#00c087' : '#1e2541',
          color: '#ffffff',
          position: 'relative'
        }}
        onClick={onSelect}
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
                  {nft.type === 'defily' ? 'Defily' : 'Fund8'}
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
              {(() => {
                let ownerId = null;
                if (nft.referralsLink) {
                  if (!isNaN(Number(nft.referralsLink)) && nft.referralsLink.trim() !== '') {
                    ownerId = Number(nft.referralsLink);
                  } else {
                    const numericMatch = nft.referralsLink.match(/\d+/);
                    if (numericMatch && numericMatch[0].length >= 2) {
                      ownerId = Number(numericMatch[0]);
                    }
                  }
                }
                
                return (
                  <div className="d-flex justify-content-between">
                    <span style={{ color: '#718096', fontSize: '11px' }}><strong>{t('nft.owner_id')}:</strong></span>
                    <span style={{ color: ownerId ? '#00e5cc' : '#718096', fontWeight: '600', fontSize: '11px' }}>
                      {ownerId || '-'}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>
          
          {nft.referralsLink && (
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
                {t('nft.referral_links')}
              </div>
              <div className="d-flex flex-column gap-2">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    const leftLink = generateReferralLink(nft.referralsLink, 'left');
                    if (leftLink) {
                      copyToClipboard(
                        leftLink,
                        () => {
                          setCopiedLink('left');
                          setTimeout(() => setCopiedLink(null), 2000);
                        },
                        () => {
                          alert(t('nft.error_copying_link'));
                        }
                      );
                    }
                  }}
                  style={{
                    width: '100%',
                    minHeight: '32px',
                    background: copiedLink === 'left' ? '#00c087' : 'transparent',
                    color: copiedLink === 'left' ? '#fff' : '#00e5cc',
                    border: `1px solid ${copiedLink === 'left' ? '#00c087' : 'rgba(0, 229, 204, 0.3)'}`,
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
                      e.currentTarget.style.background = 'rgba(0, 229, 204, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(0, 229, 204, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (copiedLink !== 'left') {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'rgba(0, 229, 204, 0.3)';
                    }
                  }}
                  title={t('nft.copy_left_referral_link')}
                >
                  {copiedLink === 'left' ? (
                    <>
                      <i className="fa fa-check"></i>
                      <span>{t('nft.copied')}</span>
                    </>
                  ) : (
                    <>
                      <i className="fa fa-link"></i>
                      <span>{t('nft.left')}</span>
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rightLink = generateReferralLink(nft.referralsLink, 'right');
                    if (rightLink) {
                      copyToClipboard(
                        rightLink,
                        () => {
                          setCopiedLink('right');
                          setTimeout(() => setCopiedLink(null), 2000);
                        },
                        () => {
                          alert(t('nft.error_copying_link'));
                        }
                      );
                    }
                  }}
                  style={{
                    width: '100%',
                    minHeight: '32px',
                    background: copiedLink === 'right' ? '#00c087' : 'transparent',
                    color: copiedLink === 'right' ? '#fff' : '#00c087',
                    border: `1px solid ${copiedLink === 'right' ? '#00c087' : 'rgba(0, 192, 135, 0.3)'}`,
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
                      e.currentTarget.style.background = 'rgba(0, 192, 135, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(0, 192, 135, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (copiedLink !== 'right') {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'rgba(0, 192, 135, 0.3)';
                    }
                  }}
                  title={t('nft.copy_right_referral_link')}
                >
                  {copiedLink === 'right' ? (
                    <>
                      <i className="fa fa-check"></i>
                      <span>{t('nft.copied')}</span>
                    </>
                  ) : (
                    <>
                      <i className="fa fa-link"></i>
                      <span>{t('nft.right')}</span>
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

const NFTSelector = memo(({ onSelect, showOnlyFund8 = false, showOnlyDefily = false }) => {
  const { t } = useTranslation();
  const {
    nfts,
    selectedNFT,
    isLoading,
    error,
    selectNFT,
    deselectNFT,
    defilyNFTs,
    fund8NFTs,
    hasNFTs
  } = useNFT();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 2 columnas x 3 filas

  const filteredNFTs = useMemo(() => {
    if (showOnlyFund8) {
      return fund8NFTs;
    } else if (showOnlyDefily) {
      return defilyNFTs;
    }
    return nfts;
  }, [showOnlyFund8, showOnlyDefily, nfts, defilyNFTs, fund8NFTs]);

  const totalPages = Math.ceil(filteredNFTs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNFTs = filteredNFTs.slice(startIndex, endIndex);

  // Resetear a la primera página cuando cambien los NFTs filtrados
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredNFTs.length]);

  // Generar números de página con puntos
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // Máximo de números visibles
    
    if (totalPages <= maxVisible) {
      // Si hay pocas páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Siempre mostrar primera página
      pages.push(1);
      
      if (currentPage <= 3) {
        // Cerca del inicio
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Cerca del final
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // En el medio
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handleSelectNFT = useCallback((nft) => {
    if (selectedNFT && selectedNFT.id === nft.id) {
      deselectNFT();
      if (onSelect) {
        onSelect(null);
      }
    } else {
      selectNFT(nft);
      if (onSelect) {
        onSelect(nft);
      }
    }
  }, [selectedNFT, deselectNFT, selectNFT, onSelect]);

  if (isLoading) {
    return (
      <div className="nft-selector-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">{t('nft.loading_nfts')}</span>
        </div>
        <p className="mt-2">{t('nft.loading_nfts')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nft-selector-error alert alert-danger">
        <strong>{t('nft.error_loading')}</strong> {error}
        <button 
          className="btn btn-sm btn-outline-danger mt-2" 
          onClick={() => window.location.reload()}
        >
          {t('nft.retry')}
        </button>
      </div>
    );
  }

  if (!hasNFTs) {
    return (
      <div className="nft-selector-empty">
        <p className="text-muted">{t('nft.no_nfts_found')}</p>
        <p className="text-muted small">
          {t('nft.no_nfts_found_description')}
        </p>
      </div>
    );
  }

  if (filteredNFTs.length === 0) {
    return (
      <div className="nft-selector-empty">
        <p className="text-muted">
          {t('nft.no_nfts_type')}
        </p>
      </div>
    );
  }

  const pageNumbers = getPageNumbers();

  return (
    <div className="nft-selector">
      <div className="nft-list">
        <div className="row">
          {currentNFTs.map((nft) => {
            return <NFTCard 
              key={nft.id} 
              nft={nft} 
              isSelected={selectedNFT && selectedNFT.id === nft.id}
              onSelect={() => handleSelectNFT(nft)}
              onDeselect={deselectNFT}
              t={t}
            />;
          })}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-2 mt-4" style={{ flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            style={{
              borderRadius: '6px',
              background: currentPage === 1 ? 'transparent' : '#1f2640',
              border: '1px solid #1e2541',
              color: currentPage === 1 ? '#718096' : '#ffffff',
              fontSize: '12px',
              padding: '6px 12px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1
            }}
          >
            ‹
          </button>

          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`dots-${index}`}
                  style={{
                    color: '#718096',
                    fontSize: '12px',
                    padding: '0 4px'
                  }}
                >
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                type="button"
                className="btn"
                onClick={() => setCurrentPage(page)}
                style={{
                  borderRadius: '6px',
                  background: currentPage === page ? '#1f2640' : 'transparent',
                  border: `1px solid ${currentPage === page ? '#00e5cc' : '#1e2541'}`,
                  color: currentPage === page ? '#00e5cc' : '#a0aec0',
                  fontSize: '12px',
                  padding: '6px 12px',
                  minWidth: '36px',
                  fontWeight: currentPage === page ? '600' : '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== page) {
                    e.currentTarget.style.background = '#1f2640';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== page) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {page}
              </button>
            );
          })}

          <button
            type="button"
            className="btn"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            style={{
              borderRadius: '6px',
              background: currentPage === totalPages ? 'transparent' : '#1f2640',
              border: '1px solid #1e2541',
              color: currentPage === totalPages ? '#718096' : '#ffffff',
              fontSize: '12px',
              padding: '6px 12px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.5 : 1
            }}
          >
            ›
          </button>
        </div>
      )}

      {selectedNFT && (
        <div className="selected-nft-info mt-3" style={{
          background: '#0a0e27',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #1e2541'
        }}>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center">
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#00c087',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '8px'
              }}>
                <i className="fa fa-check" style={{ color: '#fff', fontSize: '10px' }}></i>
              </div>
              <h6 className="mb-0" style={{ 
                color: '#ffffff', 
                fontWeight: '600', 
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>{t('nft.nft_selected')}</h6>
            </div>
          </div>
          <div style={{ 
            background: '#151a2e', 
            padding: '16px', 
            borderRadius: '8px',
            border: '1px solid #1e2541'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '16px 20px',
              alignItems: 'center'
            }}>
              <div style={{ 
                color: '#718096', 
                fontSize: '11px',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {t('nft.name')}
              </div>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                {(() => {
                  const imageUrl = getImageUrl(selectedNFT.ipfsLink, selectedNFT.tokenId);
                  if (imageUrl) {
                    return (
                      <img
                        src={imageUrl}
                        alt={selectedNFT.name}
                        style={{
                          width: '32px',
                          height: '32px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          border: '1px solid #1e2541',
                          backgroundColor: '#0a0e27'
                        }}
                        onError={(e) => {
                          console.error('[NFT Selected] Error cargando imagen:', imageUrl);
                          e.target.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('[NFT Selected] Imagen cargada:', imageUrl);
                        }}
                      />
                    );
                  }
                  return (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: '#0a0e27',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#718096',
                      fontSize: '14px',
                      border: '1px solid #1e2541'
                    }}>
                      <i className="fa fa-image"></i>
                    </div>
                  );
                })()}
                <span style={{ 
                  color: '#ffffff', 
                  fontWeight: '600', 
                  fontSize: '13px',
                  wordBreak: 'break-word'
                }}>
                  {selectedNFT.name}
                </span>
              </div>

              <div style={{ 
                color: '#718096', 
                fontSize: '11px',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {t('nft.nft_id')}
              </div>
              <div style={{ 
                color: '#ffffff', 
                fontWeight: '600', 
                fontSize: '12px',
                fontFamily: 'monospace',
                background: '#0a0e27',
                padding: '4px 10px',
                borderRadius: '6px',
                display: 'inline-block',
                width: 'fit-content',
                border: '1px solid #1e2541'
              }}>
                #{selectedNFT.tokenId}
              </div>

              <div style={{ 
                color: '#718096', 
                fontSize: '11px',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {t('nft.type')}
              </div>
              <div>
                <span className="badge" style={{ 
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontWeight: '500',
                  background: selectedNFT.type === 'defily' ? 'rgba(0, 229, 204, 0.1)' : 'rgba(0, 192, 135, 0.1)',
                  color: selectedNFT.type === 'defily' ? '#00e5cc' : '#00c087',
                  border: `1px solid ${selectedNFT.type === 'defily' ? 'rgba(0, 229, 204, 0.2)' : 'rgba(0, 192, 135, 0.2)'}`
                }}>
                  {selectedNFT.type === 'defily' ? t('nft.defily') : t('nft.fund8')}
                </span>
              </div>

              <div style={{ 
                color: '#718096', 
                fontSize: '11px',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {t('nft.wallet')}
              </div>
              <div style={{ 
                color: '#a0aec0', 
                fontSize: '11px',
                fontFamily: 'monospace',
                background: '#0a0e27',
                padding: '4px 10px',
                borderRadius: '6px',
                display: 'inline-block',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                border: '1px solid #1e2541'
              }} title={selectedNFT.ownerAddress}>
                {selectedNFT.ownerAddress}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default NFTSelector;
export { getImageUrl };

