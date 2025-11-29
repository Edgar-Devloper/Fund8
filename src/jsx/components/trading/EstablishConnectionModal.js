import React, { useState } from 'react';
import './EstablishConnectionModal.css';

const EstablishConnectionModal = ({ onClose, onConfirm, isApproving = false }) => {
  const [stayConnected, setStayConnected] = useState(false);

  const handleConfirm = () => {
    if (!isApproving) {
      onConfirm(stayConnected);
    }
  };

  return (
    <div 
      className="establish-connection-overlay" 
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="establish-connection-modal">
        <div className="establish-connection-header">
          <h5>Establish Connection</h5>
          <button 
            className="modal-close-btn" 
            onClick={onClose}
            disabled={isApproving}
          >×</button>
        </div>
        
        <div className="establish-connection-body">
          <p className="connection-description">
            This signature is gas-free to send. It opens a decentralized channel for gas-free and instantaneous trading.
          </p>
          
          <p className="connection-note-text" style={{ fontSize: '12px', color: '#ffc107', marginBottom: '16px', padding: '8px', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '6px' }}>
            ⚠️ Note: If you haven't made a deposit yet, you'll need to deposit first before establishing the connection.
          </p>
          
          <div className="stay-connected-option">
            <label className="stay-connected-checkbox">
              <input 
                type="checkbox"
                checked={stayConnected}
                onChange={(e) => setStayConnected(e.target.checked)}
                disabled={isApproving}
              />
              <span>Stay Connected</span>
            </label>
          </div>
        </div>
        
        <div className="establish-connection-footer">
          <button 
            className="btn-establish-connection"
            onClick={handleConfirm}
            disabled={isApproving}
          >
            {isApproving ? 'Connecting...' : 'Establish Connection'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EstablishConnectionModal;

