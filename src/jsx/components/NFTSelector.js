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
          transition: 'all 0.3s ease',
          transform: isSelected ? 'scale(1.02)' : 'scale(1)',
          borderRadius: '12px',
          overflow: 'hidden',
          borderWidth: isSelected ? '2px' : '1px',
          background: isSelected ? 'linear-gradient(135deg, #1e3a5f 0%, #16213e 100%)' : '#16213e',
          borderColor: isSelected ? '#48bb78' : '#2d3748',
          color: '#e2e8f0',
          position: 'relative'
        }}
        onClick={onSelect}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
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
                  borderRadius: '12px',
                  border: isSelected ? '3px solid #48bb78' : '2px solid #2d3748',
                  boxShadow: isSelected ? '0 4px 12px rgba(72, 187, 120, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.2)',
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
                background: '#1a1a2e',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                border: '2px solid #2d3748'
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '32px',
                margin: '0 auto',
                border: isSelected ? '3px solid #48bb78' : '2px solid #2d3748',
                boxShadow: isSelected ? '0 4px 12px rgba(72, 187, 120, 0.4)' : '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}>
                <i className="fa fa-image"></i>
              </div>
            </div>
          )}
          
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className="flex-grow-1">
              <h6 className="card-title mb-2" style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                color: '#e2e8f0',
                textAlign: 'center'
              }}>
                {nft.name || `NFT #${nft.id}`}
              </h6>
              <div className="text-center">
                <span className={`badge ${nft.type === 'defily' ? 'bg-info' : 'bg-success'}`} style={{
                  fontSize: '11px',
                  padding: '4px 10px'
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
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#48bb78',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(72, 187, 120, 0.3)',
                  position: 'absolute',
                  top: '12px',
                  right: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#38a169';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#48bb78';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title={t('nft.deselect')}
              >
                <i className="fa fa-check" style={{ color: '#fff', fontSize: '12px' }}></i>
              </button>
            )}
          </div>
          
          <div className="nft-details small" style={{ 
            color: '#cbd5e0',
            lineHeight: '1.8',
            background: '#1a1a2e',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '12px',
            border: '1px solid #2d3748'
          }}>
            <div className="d-flex justify-content-between mb-1">
              <span style={{ color: '#a0aec0' }}><strong>{t('nft.nft_id')}:</strong></span>
              <span style={{ color: '#e2e8f0', fontWeight: '600' }}>#{nft.tokenId}</span>
            </div>
            <div className="d-flex flex-column gap-1">
              <div className="d-flex justify-content-between">
                <span style={{ color: '#a0aec0' }}><strong>{t('nft.left')}:</strong></span>
                <span style={{ color: '#4299e1', fontWeight: '600' }}>{nft.leftSide.length}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span style={{ color: '#a0aec0' }}><strong>{t('nft.right')}:</strong></span>
                <span style={{ color: '#48bb78', fontWeight: '600' }}>{nft.rightSide.length}</span>
              </div>
            </div>
            {nft.referralsLink && (() => {
              let ownerId = null;
              if (!isNaN(Number(nft.referralsLink)) && nft.referralsLink.trim() !== '') {
                ownerId = Number(nft.referralsLink);
              } else {
                const numericMatch = nft.referralsLink.match(/\d+/);
                if (numericMatch && numericMatch[0].length >= 2) {
                  ownerId = Number(numericMatch[0]);
                }
              }
              
              return ownerId ? (
                <div className="mt-2 pt-2" style={{ borderTop: '1px solid #2d3748' }}>
                  <div className="d-flex justify-content-between">
                    <span style={{ color: '#a0aec0' }}><strong>{t('nft.owner_id')}:</strong></span>
                    <span style={{ color: '#667eea', fontWeight: '600', fontSize: '12px' }}>{ownerId}</span>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
          
          {nft.referralsLink && (
            <div className="referral-links-section mt-3" style={{
              background: '#16213e',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #2d3748'
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
                <div className="d-flex align-items-center gap-2">
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
                      flex: 1,
                      background: copiedLink === 'left' ? '#48bb78' : 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      if (copiedLink !== 'left') {
                        e.currentTarget.style.opacity = '0.9';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (copiedLink !== 'left') {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.transform = 'scale(1)';
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
                </div>
                
                <div className="d-flex align-items-center gap-2">
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
                      flex: 1,
                      background: copiedLink === 'right' ? '#48bb78' : 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      if (copiedLink !== 'right') {
                        e.currentTarget.style.opacity = '0.9';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (copiedLink !== 'right') {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.transform = 'scale(1)';
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

  const [filter, setFilter] = useState('all');

  const filteredNFTs = useMemo(() => {
    if (showOnlyFund8) {
      return fund8NFTs;
    } else if (showOnlyDefily) {
      return defilyNFTs;
    } else {
      if (filter === 'defily') {
        return defilyNFTs;
      } else if (filter === 'fund8') {
        return fund8NFTs;
      }
      return nfts;
    }
  }, [showOnlyFund8, showOnlyDefily, filter, nfts, defilyNFTs, fund8NFTs]);

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
        {!showOnlyFund8 && !showOnlyDefily && (
          <button 
            className="btn btn-sm btn-outline-primary mt-2"
            onClick={() => setFilter('all')}
          >
            {t('nft.show_all')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="nft-selector">
      {!showOnlyFund8 && !showOnlyDefily && nfts.length > 0 && (
        <div className="nft-selector-filters mb-4">
          <div className="btn-group w-100" role="group" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px'
          }}>
            <button
              type="button"
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('all')}
              style={{
                borderRadius: '8px',
                fontWeight: filter === 'all' ? '600' : '400',
                transition: 'all 0.2s ease',
                background: filter === 'all' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                borderColor: filter === 'all' ? '#667eea' : '#4299e1',
                color: filter === 'all' ? '#fff' : '#4299e1'
              }}
            >
              {t('nft.all')} ({nfts.length})
            </button>
            <button
              type="button"
              className={`btn ${filter === 'defily' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('defily')}
              style={{
                borderRadius: '8px',
                fontWeight: filter === 'defily' ? '600' : '400',
                transition: 'all 0.2s ease',
                background: filter === 'defily' ? '#17a2b8' : 'transparent',
                borderColor: filter === 'defily' ? '#17a2b8' : '#17a2b8',
                color: filter === 'defily' ? '#fff' : '#17a2b8'
              }}
            >
              {t('nft.defily')} ({defilyNFTs.length})
            </button>
            <button
              type="button"
              className={`btn ${filter === 'fund8' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('fund8')}
              style={{
                borderRadius: '8px',
                fontWeight: filter === 'fund8' ? '600' : '400',
                transition: 'all 0.2s ease',
                background: filter === 'fund8' ? '#48bb78' : 'transparent',
                borderColor: filter === 'fund8' ? '#48bb78' : '#48bb78',
                color: filter === 'fund8' ? '#fff' : '#48bb78'
              }}
            >
              {t('nft.fund8')} ({fund8NFTs.length})
            </button>
          </div>
        </div>
      )}

      <div className="nft-list">
        <div className="row">
          {filteredNFTs.map((nft) => {
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

      {selectedNFT && (
        <div className="selected-nft-info mt-4" style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #16213e 100%)',
          padding: '24px',
          borderRadius: '16px',
          border: '2px solid #48bb78',
          boxShadow: '0 8px 24px rgba(72, 187, 120, 0.25)'
        }}>
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div className="d-flex align-items-center">
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#48bb78',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px',
                boxShadow: '0 4px 12px rgba(72, 187, 120, 0.4)'
              }}>
                <i className="fa fa-check" style={{ color: '#fff', fontSize: '14px' }}></i>
              </div>
              <h6 className="mb-0" style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '18px' }}>{t('nft.nft_selected')}</h6>
            </div>
          </div>
          <div style={{ 
            background: '#1a1a2e', 
            padding: '20px', 
            borderRadius: '12px',
            border: '1px solid #2d3748',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '16px 20px',
              alignItems: 'center'
            }}>
              <div style={{ 
                color: '#a0aec0', 
                fontSize: '13px',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {t('nft.name')}
              </div>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {(() => {
                  const imageUrl = getImageUrl(selectedNFT.ipfsLink, selectedNFT.tokenId);
                  if (imageUrl) {
                    return (
                      <img
                        src={imageUrl}
                        alt={selectedNFT.name}
                        style={{
                          width: '40px',
                          height: '40px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '2px solid #2d3748',
                          backgroundColor: '#1a1a2e'
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
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '16px'
                    }}>
                      <i className="fa fa-image"></i>
                    </div>
                  );
                })()}
                <span style={{ 
                  color: '#667eea', 
                  fontWeight: '600', 
                  fontSize: '15px',
                  wordBreak: 'break-word'
                }}>
                  {selectedNFT.name}
                </span>
              </div>

              <div style={{ 
                color: '#a0aec0', 
                fontSize: '13px',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {t('nft.nft_id')}
              </div>
              <div style={{ 
                color: '#e2e8f0', 
                fontWeight: '600', 
                fontSize: '15px',
                fontFamily: 'monospace',
                background: '#0f1419',
                padding: '6px 12px',
                borderRadius: '6px',
                display: 'inline-block',
                width: 'fit-content'
              }}>
                #{selectedNFT.tokenId}
              </div>

              <div style={{ 
                color: '#a0aec0', 
                fontSize: '13px',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {t('nft.type')}
              </div>
              <div>
                <span className={`badge ${selectedNFT.type === 'defily' ? 'bg-info' : 'bg-success'}`} style={{ 
                  fontSize: '12px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontWeight: '600'
                }}>
                  {selectedNFT.type === 'defily' ? t('nft.defily') : t('nft.fund8')}
                </span>
              </div>

              <div style={{ 
                color: '#a0aec0', 
                fontSize: '13px',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {t('nft.wallet')}
              </div>
              <div style={{ 
                color: '#cbd5e0', 
                fontSize: '12px',
                fontFamily: 'monospace',
                background: '#0f1419',
                padding: '6px 12px',
                borderRadius: '6px',
                display: 'inline-block',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
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

