import React, { useState, useEffect, useRef } from 'react';
import { useNFT } from '../../context/NFTContext';
import { useWallet } from '../../context/WalletContext';
import { useTranslation } from 'react-i18next';
import NFTSelector from './NFTSelector';

const NFTSelectionModal = ({ onClose, onSelect, forceShow = false }) => {
  const { t } = useTranslation();
  const { isConnected } = useWallet();
  const { selectedNFT, hasNFTs, isLoading, error, loadNFTs, deselectNFT } = useNFT();
  const [showModal, setShowModal] = useState(false);
  const hasShownOnceRef = useRef(false);
  const wasConnectedRef = useRef(false);

  // Check if modal was already shown (persisted in localStorage)
  useEffect(() => {
    const hasShownBefore = localStorage.getItem('nftModalShownOnce');
    if (hasShownBefore === 'true') {
      hasShownOnceRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (forceShow) {
      setShowModal(true);
      hasShownOnceRef.current = false;
    }
  }, [forceShow]);

  useEffect(() => {
    if (!isConnected) {
      setShowModal(false);
      wasConnectedRef.current = false;
      return;
    }

    wasConnectedRef.current = true;

    if (forceShow) {
      return;
    }

    // Only show automatically if never shown before AND user has NFTs AND not loading AND no NFT selected
    if (!hasShownOnceRef.current && !selectedNFT) {
      if (hasNFTs && !isLoading) {
        setShowModal(true);
        hasShownOnceRef.current = true;
        localStorage.setItem('nftModalShownOnce', 'true');
      }
    } else if (selectedNFT) {
      // If NFT is already selected, mark as shown
      hasShownOnceRef.current = true;
      localStorage.setItem('nftModalShownOnce', 'true');
    }
  }, [isConnected, hasNFTs, isLoading, forceShow, selectedNFT]);

  const handleClose = () => {
    setShowModal(false);
    hasShownOnceRef.current = true;
    localStorage.setItem('nftModalShownOnce', 'true');
    if (onClose) {
      onClose();
    }
  };

  const handleSelect = (nft) => {
    if (onSelect) {
      onSelect(nft);
    }
  };

  if (!isConnected) {
    return null;
  }

  if (!showModal) {
    return null;
  }

  return (
    <div 
      className="modal fade show" 
      style={{ display: 'block', backgroundColor: 'rgba(10, 14, 39, 0.85)', zIndex: 1050 }}
      tabIndex="-1"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content" style={{
              background: '#151a2e',
              border: '1px solid #1e2541',
              borderRadius: '8px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
            }}>
              <div className="modal-header" style={{ 
                background: '#151a2e',
                color: '#ffffff',
                borderBottom: '1px solid #1e2541',
                padding: '12px 16px'
              }}>
                <div>
                  <h5 className="modal-title mb-0" style={{ color: '#ffffff', fontWeight: '600', fontSize: '14px' }}>
                    {t('nft.select_nft')}
                  </h5>
                </div>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={handleClose}
                  aria-label="Close"
                  style={{ opacity: 0.8, filter: 'brightness(0) invert(1)' }}
                ></button>
              </div>
              <div className="modal-body" style={{ 
                padding: '16px', 
                maxHeight: '60vh', 
                overflowY: 'auto',
                background: '#151a2e',
                color: '#ffffff'
              }}>
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border" role="status" style={{ color: '#00e5cc' }}>
                      <span className="sr-only">{t('common.loading')}</span>
                    </div>
                    <p className="mt-2" style={{ color: '#718096', fontSize: '12px' }}>{t('nft.loading_nfts')}</p>
                  </div>
                ) : error ? (
                  <div className="alert" style={{ 
                    background: 'rgba(255, 92, 92, 0.1)', 
                    borderColor: '#ff5c5c', 
                    color: '#ff5c5c', 
                    borderRadius: '8px',
                    border: '1px solid #ff5c5c'
                  }}>
                    <h6 style={{ fontWeight: '600', marginBottom: '12px', fontSize: '13px' }}>{t('nft.error_loading')}</h6>
                    <p style={{ whiteSpace: 'pre-wrap', fontSize: '12px', marginBottom: '8px', color: '#a0aec0' }}>{error}</p>
                    <button 
                      className="btn btn-sm" 
                      onClick={() => loadNFTs()}
                      style={{ 
                        borderRadius: '6px',
                        background: 'transparent',
                        border: '1px solid #ff5c5c',
                        color: '#ff5c5c',
                        fontSize: '11px',
                        padding: '4px 12px'
                      }}
                    >
                      {t('nft.retry')}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-3" style={{ 
                      background: '#0a0e27', 
                      padding: '12px 16px', 
                      borderRadius: '8px',
                      border: '1px solid #1e2541'
                    }}>
                      <p className="mb-0" style={{ fontSize: '12px', color: '#a0aec0', lineHeight: '1.5' }}>
                        {t('nft.select_nft_description')}
                      </p>
                    </div>
                    <NFTSelector onSelect={handleSelect} />
                  </>
                )}
              </div>
              <div className="modal-footer" style={{ 
                padding: '12px 16px',
                borderTop: '1px solid #1e2541',
                background: '#151a2e'
              }}>
                <div className="d-flex justify-content-between align-items-center w-100">
                  <div className="flex-grow-1">
                    {selectedNFT ? (
                      <div className="d-flex align-items-center gap-3">
                        <div className="flex-grow-1">
                          <small className="d-block mb-1" style={{ 
                            fontSize: '11px', 
                            color: '#718096', 
                            fontWeight: '500',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {t('nft.nft_selected')}:
                          </small>
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <strong style={{ fontSize: '14px', color: '#ffffff', fontWeight: '600' }}>
                              {selectedNFT.name}
                            </strong>
                            <span className="badge" style={{ 
                              fontSize: '11px', 
                              background: '#1f2640', 
                              color: '#a0aec0', 
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid #1e2541'
                            }}>
                              {t('nft.nft_id')}: {selectedNFT.tokenId}
                            </span>
                            <span className="badge" style={{ 
                              fontSize: '11px', 
                              background: selectedNFT.type === 'defily' ? 'rgba(0, 229, 204, 0.1)' : 'rgba(0, 192, 135, 0.1)',
                              color: selectedNFT.type === 'defily' ? '#00e5cc' : '#00c087',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: `1px solid ${selectedNFT.type === 'defily' ? 'rgba(0, 229, 204, 0.2)' : 'rgba(0, 192, 135, 0.2)'}`
                            }}>
                              {selectedNFT.type === 'defily' ? t('nft.defily') : t('nft.fund8')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="d-flex align-items-center">
                        <small style={{ fontSize: '12px', color: '#718096' }}>
                          {t('nft.select_nft_to_continue')}
                        </small>
                      </div>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <button 
                      type="button" 
                      className="btn" 
                      onClick={handleClose}
                      style={{ 
                        borderRadius: '6px', 
                        minWidth: '100px', 
                        padding: '8px 16px',
                        background: 'transparent',
                        border: '1px solid #1e2541',
                        color: '#a0aec0',
                        fontSize: '12px',
                        fontWeight: '500'
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
                      {t('nft.cancel')}
                    </button>
                    <button 
                      type="button" 
                      className="btn" 
                      onClick={() => {
                        if (selectedNFT) {
                          handleClose();
                        }
                      }}
                      disabled={!selectedNFT}
                      style={{ 
                        borderRadius: '6px', 
                        minWidth: '120px',
                        padding: '8px 16px',
                        background: selectedNFT ? '#00c087' : '#1f2640',
                        border: 'none',
                        color: selectedNFT ? '#ffffff' : '#718096',
                        fontWeight: '600',
                        fontSize: '12px',
                        cursor: selectedNFT ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedNFT) {
                          e.currentTarget.style.background = '#00b079';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedNFT) {
                          e.currentTarget.style.background = '#00c087';
                        }
                      }}
                    >
                      {t('nft.continue')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  );
};

export default NFTSelectionModal;

