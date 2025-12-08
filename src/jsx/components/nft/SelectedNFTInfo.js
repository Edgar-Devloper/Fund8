import React from 'react';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '../../../utils/nftUtils';

const SelectedNFTInfo = ({ selectedNFT }) => {
  const { t } = useTranslation();
  const imageUrl = getImageUrl(selectedNFT.ipfsLink, selectedNFT.tokenId);

  return (
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
            {imageUrl ? (
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
            ) : (
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
            )}
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
  );
};

export default SelectedNFTInfo;





