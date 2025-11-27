/**
 * SettingsModal - Modal de configuraciones estilo Hyperliquid
 */

import React from 'react';
import { useSettings } from '../../../context/SettingsContext';
import { useWallet } from '../../../context/WalletContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../LanguageSelector';
import './SettingsModal.css';

const SettingsModal = ({ isOpen, onClose }) => {
  const { settings, updateSetting, resetToDefaults } = useSettings();
  const { isConnected, connectWallet } = useWallet();
  const { t } = useTranslation(); // eslint-disable-line

  if (!isOpen) return null;

  const handleToggle = (key) => {
    updateSetting(key, !settings[key]);
  };

  const handleResetLayout = () => {
    if (window.confirm('Are you sure you want to reset to default layout?')) {
      resetToDefaults();
    }
  };

  const settingsGroups = [
    {
      title: 'Order Confirmations',
      items: [
        {
          key: 'skipOpenOrderConfirmation',
          label: 'Skip Open Order Confirmation',
          description: 'Skip confirmation dialog when opening orders'
        },
        {
          key: 'skipClosePositionConfirmation',
          label: 'Skip Close Position Confirmation',
          description: 'Skip confirmation dialog when closing positions'
        },
        {
          key: 'holdToCloseAllPositions',
          label: 'Hold to Close All Positions',
          description: 'Require holding the button to close all positions'
        },
      ]
    },
    {
      title: 'Trading Options',
      items: [
        {
          key: 'optOutOfSpotDusting',
          label: 'Opt Out of Spot Dusting',
          description: 'Disable automatic conversion of dust to USDC',
          tooltip: true
        },
        {
          key: 'persistTradingConnection',
          label: 'Persist Trading Connection',
          description: 'Keep trading connection alive in background',
          tooltip: true
        },
        {
          key: 'customizeLayout',
          label: 'Customize Layout',
          description: 'Enable layout customization mode',
          tooltip: true
        },
      ]
    },
    {
      title: 'Display & Notifications',
      items: [
        {
          key: 'displayVerboseErrors',
          label: 'Display Verbose Errors',
          description: 'Show detailed error messages'
        },
        {
          key: 'disableBackgroundFillNotifications',
          label: 'Disable Background Fill Notifications',
          description: 'Turn off notifications for order fills'
        },
        {
          key: 'disableSoundForFills',
          label: 'Disable Playing Sound For Fills',
          description: 'Mute sound notifications for order fills'
        },
        {
          key: 'animateOrderBook',
          label: 'Animate Order Book',
          description: 'Enable animations in the order book'
        },
        {
          key: 'orderBookSetSizeOnClick',
          label: 'Order Book Set Size on Click',
          description: 'Click order book to set order size',
          tooltip: true
        },
        {
          key: 'showBuysAndSellsOnChart',
          label: 'Show Buys and Sells on Chart',
          description: 'Display buy/sell markers on the chart'
        },
        {
          key: 'hidePNL',
          label: 'Hide PNL',
          description: 'Hide profit and loss information'
        },
      ]
    },
    {
      title: 'Advanced',
      items: [
        {
          key: 'showAllWarnings',
          label: 'Show All Warnings',
          description: 'Display all warning messages'
        },
        {
          key: 'disableTransactionDelayProtection',
          label: 'Disable Transaction Delay Protection',
          description: 'Turn off protection against delayed transactions'
        },
        {
          key: 'disableHIP3DexAbstraction',
          label: 'Disable HIP-3 Dex Abstraction',
          description: 'Disable HIP-3 protocol abstraction layer'
        },
      ]
    },
  ];

  return (
    <>
      <div className="settings-modal-overlay" onClick={onClose} />
      <div className="settings-modal">
        <div className="settings-modal-header">
          <h5 className="settings-modal-title">Settings</h5>
          <button className="settings-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="settings-modal-body">
          {/* Top Actions */}
          <div className="settings-top-actions">
            {!isConnected ? (
              <button className="settings-connect-btn" onClick={connectWallet}>
                Connect
              </button>
            ) : (
              <div className="settings-connected-badge">
                <span className="connected-dot"></span>
                Connected
              </div>
            )}
            
            <div className="settings-icons">
              <LanguageSelector variant="icon" />
              <button className="settings-icon-btn" title="Advanced Settings">
                ⚙️
              </button>
            </div>
          </div>

          {/* Settings Groups */}
          {settingsGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="settings-group">
              <h6 className="settings-group-title">{group.title}</h6>
              <div className="settings-items">
                {group.items.map((item) => (
                  <div key={item.key} className="settings-item">
                    <div className="settings-item-label">
                      <span className={item.tooltip ? 'has-tooltip' : ''}>
                        {item.label}
                      </span>
                      {item.description && (
                        <small className="settings-item-description">
                          {item.description}
                        </small>
                      )}
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={settings[item.key]}
                        onChange={() => handleToggle(item.key)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Bottom Actions */}
          <div className="settings-bottom-actions">
            <button className="settings-reset-btn" onClick={handleResetLayout}>
              Return to Default Layout
            </button>
            <div className="settings-version">
              Fund8 2025-11-27-v1.0.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsModal;

