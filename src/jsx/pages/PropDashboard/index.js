import React from 'react';
import { useTranslation } from 'react-i18next';
import HyperliquidNav from '../../components/trading/HyperliquidNav';
import './PropDashboard.css';

/**
 * PropDashboard - Página del Prop Dashboard
 * Permite a los usuarios ver y gestionar sus desafíos de prop firm
 */
const PropDashboard = () => {
  const { t } = useTranslation();

  return (
    <div className="prop-dashboard-page">
      <HyperliquidNav />
      
      <div className="prop-dashboard-container" style={{
        minHeight: '100vh',
        background: '#0a0e27',
        paddingTop: '80px',
        padding: '80px 20px 20px 20px'
      }}>
        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            background: '#151a2e',
            borderRadius: '12px',
            padding: '40px',
            border: '1px solid #1e2541',
            textAlign: 'center'
          }}>
            <h1 style={{
              color: '#ffffff',
              fontSize: '32px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              Prop Dashboard
            </h1>
            <p style={{
              color: '#a0aec0',
              fontSize: '16px',
              lineHeight: '1.6',
              marginBottom: '24px'
            }}>
              Welcome to the Prop Dashboard. This page is under development.
            </p>
            <p style={{
              color: '#718096',
              fontSize: '14px'
            }}>
              Here you will be able to manage your prop firm challenges, view your performance, and track your progress.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropDashboard;










