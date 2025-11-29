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

  useEffect(() => {
    if (forceShow) {
      setShowModal(true);
      hasShownOnceRef.current = false;
    }
  }, [forceShow]);

  useEffect(() => {
    if (!isConnected) {
      setShowModal(false);
      hasShownOnceRef.current = false;
      wasConnectedRef.current = false;
      return;
    }

    wasConnectedRef.current = true;

    if (forceShow) {
      return;
    }

    if (!hasShownOnceRef.current) {
      if (hasNFTs && !isLoading) {
        setShowModal(true);
        hasShownOnceRef.current = true;
      }
    }
  }, [isConnected, hasNFTs, isLoading, forceShow]);

  const handleClose = () => {
    setShowModal(false);
    hasShownOnceRef.current = true;
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
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }}
      tabIndex="-1"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content" style={{
              background: '#1a1a2e',
              border: '1px solid #2d3748',
              borderRadius: '12px'
            }}>
              <div className="modal-header" style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderBottom: 'none',
                padding: '20px 24px'
              }}>
                <div>
                  <h5 className="modal-title mb-1" style={{ color: 'white', fontWeight: '600', fontSize: '20px' }}>
                    {t('nft.select_nft')}
                  </h5>
                  <p className="mb-0" style={{ fontSize: '13px', opacity: 0.9 }}>
                    {t('nft.select_nft_description')}
                  </p>
                </div>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={handleClose}
                  aria-label="Close"
                  style={{ opacity: 0.8 }}
                ></button>
              </div>
              <div className="modal-body" style={{ 
                padding: '24px', 
                maxHeight: '70vh', 
                overflowY: 'auto',
                background: '#1a1a2e',
                color: '#e2e8f0'
              }}>
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="sr-only">{t('common.loading')}</span>
                    </div>
                    <p className="mt-2 text-muted">{t('nft.loading_nfts')}</p>
                  </div>
                ) : error ? (
                  <div className="alert alert-danger" style={{ background: '#742a2a', borderColor: '#c53030', color: '#fff', borderRadius: '8px' }}>
                    <h6 style={{ fontWeight: '600', marginBottom: '12px' }}>{t('nft.error_loading')}</h6>
                    <p style={{ whiteSpace: 'pre-wrap', fontSize: '12px', marginBottom: '8px' }}>{error}</p>
                    <small className="d-block mb-3" style={{ opacity: 0.8 }}>
                      {t('nft.error_loading_description')}
                    </small>
                    <button 
                      className="btn btn-sm btn-outline-light" 
                      onClick={() => loadNFTs()}
                      style={{ borderRadius: '6px' }}
                    >
                      {t('nft.retry')}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4" style={{ 
                      background: '#16213e', 
                      padding: '14px 18px', 
                      borderRadius: '10px',
                      borderLeft: '4px solid #667eea',
                      border: '1px solid #2d3748'
                    }}>
                      <p className="mb-0" style={{ fontSize: '14px', color: '#cbd5e0', lineHeight: '1.6' }}>
                        {t('nft.select_nft_description')}
                      </p>
                    </div>
                    <NFTSelector onSelect={handleSelect} />
                  </>
                )}
              </div>
              <div className="modal-footer" style={{ 
                padding: '20px 24px',
                borderTop: '1px solid #2d3748',
                background: '#16213e'
              }}>
                <div className="d-flex justify-content-between align-items-center w-100">
                  <div className="flex-grow-1">
                    {selectedNFT ? (
                      <div className="d-flex align-items-center gap-3">
                        <div className="flex-grow-1">
                          <small className="d-block mb-1" style={{ fontSize: '12px', color: '#a0aec0', fontWeight: '500' }}>
                            {t('nft.nft_selected')}:
                          </small>
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <strong style={{ fontSize: '16px', color: '#667eea', fontWeight: '600' }}>
                              {selectedNFT.name}
                            </strong>
                            <span className="badge" style={{ fontSize: '11px', background: '#4299e1', color: '#fff', padding: '4px 8px' }}>
                              {t('nft.nft_id')}: {selectedNFT.tokenId}
                            </span>
                            <span className={`badge ${selectedNFT.type === 'defily' ? 'bg-info' : 'bg-success'}`} style={{ fontSize: '11px', padding: '4px 8px' }}>
                              {selectedNFT.type === 'defily' ? t('nft.defily') : t('nft.fund8')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="d-flex align-items-center">
                        <small style={{ fontSize: '13px', color: '#cbd5e0' }}>
                          {t('nft.select_nft_to_continue')}
                        </small>
                      </div>
                    )}
                  </div>
                  <div className="d-flex gap-2">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={handleClose}
                      style={{ borderRadius: '8px', minWidth: '100px', padding: '8px 16px' }}
                    >
                      {t('nft.cancel')}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={() => {
                        if (selectedNFT) {
                          handleClose();
                        }
                      }}
                      disabled={!selectedNFT}
                      style={{ 
                        borderRadius: '8px', 
                        minWidth: '120px',
                        padding: '8px 16px',
                        background: selectedNFT ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined,
                        border: 'none',
                        opacity: selectedNFT ? 1 : 0.5,
                        fontWeight: '600'
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

