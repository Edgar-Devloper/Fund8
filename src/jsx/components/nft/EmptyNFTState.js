import React from 'react';
import { useTranslation } from 'react-i18next';
import { getFund8DefaultReferralUrl } from '../../../utils/referralLinks';

const EmptyNFTState = () => {
  const { t } = useTranslation();
  const defilyBuyUrl = getFund8DefaultReferralUrl();
  
  return (
    <div className="nft-selector-empty" style={{
      textAlign: 'center',
      padding: '40px 20px',
      background: '#0a0e27',
      borderRadius: '12px',
      border: '1px solid #1e2541'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <i className="fa fa-image" style={{ 
          fontSize: '64px', 
          color: '#718096',
          marginBottom: '16px'
        }}></i>
      </div>
      <h5 style={{ 
        color: '#ffffff', 
        fontSize: '18px', 
        fontWeight: '600',
        marginBottom: '12px'
      }}>
        {t('nft.no_nfts_found')}
      </h5>
      <p style={{ 
        color: '#a0aec0', 
        fontSize: '14px',
        marginBottom: '24px',
        lineHeight: '1.6'
      }}>
        {t('nft.no_nfts_found_description')}
      </p>
      <a
        href={defilyBuyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn"
        style={{
          background: '#00c087',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 24px',
          fontSize: '14px',
          fontWeight: '600',
          textDecoration: 'none',
          display: 'inline-block',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#00b079';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#00c087';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <i className="fa fa-external-link-alt" style={{ marginRight: '8px' }}></i>
        {t('nft.buy_nft_defily')}
      </a>
    </div>
  );
};

export default EmptyNFTState;

