import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTradingPermissions } from '../../../hooks/useTradingPermissions';

/**
 * TradingRestrictionOverlay
 * Overlay que se muestra sobre elementos de trading cuando el usuario no tiene permisos
 */
const TradingRestrictionOverlay = ({ children, action = 'trade' }) => {
  const { t } = useTranslation();
  const { canTrade, canPurchase, canViewReferral, getRestrictionMessage } = useTradingPermissions();

  let hasPermission = false;
  let permissionMessage = '';

  switch (action) {
    case 'trade':
      hasPermission = canTrade;
      permissionMessage = getRestrictionMessage();
      break;
    case 'purchase':
      hasPermission = canPurchase;
      permissionMessage = getRestrictionMessage();
      break;
    case 'referral':
      hasPermission = canViewReferral;
      permissionMessage = getRestrictionMessage();
      break;
    default:
      hasPermission = canTrade;
      permissionMessage = getRestrictionMessage();
  }

  if (hasPermission) {
    return children;
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {children}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 14, 39, 0.85)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '20px',
            maxWidth: '300px',
          }}
        >
          <div
            style={{
              fontSize: '32px',
              marginBottom: '12px',
            }}
          >
            🔒
          </div>
          <div
            style={{
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
            }}
          >
            {t('trading_portal.restricted', 'Access Restricted')}
          </div>
          <div
            style={{
              color: '#a0aec0',
              fontSize: '12px',
              lineHeight: '1.5',
            }}
          >
            {permissionMessage || t('trading_portal.connect_to_trade', 'Connect your wallet and create a Trading Portal account to access this feature')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingRestrictionOverlay;






