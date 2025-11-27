/**
 * UserBalanceCard - Muestra el balance y equity del usuario
 */

import React from 'react';
import { useWallet } from '../../../context/WalletContext.js';
import { useUserBalance } from '../../../hooks/useUserBalance.js';
import { useTranslation } from 'react-i18next';

const UserBalanceCard = () => {
  const { address } = useWallet();
  const { userState, loading, error } = useUserBalance();
  const { t } = useTranslation();

  if (!address) {
    return (
      <div className="col-xl-12">
        <div className="card">
          <div className="card-body text-center py-4">
            <i className="fa fa-wallet fa-3x text-muted mb-3"></i>
            <h4 className="text-muted">{t('wallet.connect_your_wallet')}</h4>
            <p className="text-muted">
              {t('wallet.connect_wallet_message')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="col-xl-12">
        <div className="card">
          <div className="card-body text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">{t('common.loading')}</span>
            </div>
            <p className="mt-3 text-muted">{t('wallet.fetching_account_data')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-xl-12">
        <div className="card border-danger">
          <div className="card-body text-center py-4">
            <i className="fa fa-exclamation-triangle fa-3x text-danger mb-3"></i>
            <h5 className="text-danger">{t('wallet.error_loading_data')}</h5>
            <p className="text-muted">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Extraer datos
  const accountValue = parseFloat(userState?.crossMarginSummary?.accountValue || 0);
  const totalMarginUsed = parseFloat(userState?.crossMarginSummary?.totalMarginUsed || 0);
  const totalNtlPos = parseFloat(userState?.crossMarginSummary?.totalNtlPos || 0);
  const totalRawUsd = parseFloat(userState?.crossMarginSummary?.totalRawUsd || 0);
  const withdrawable = parseFloat(userState?.withdrawable || 0);

  // Formatear dirección
  const formatAddress = (addr) => {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="col-xl-12 mb-4">
      <div className="row">
        {/* Dirección y Account Value */}
        <div className="col-xl-3 col-sm-6 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="icon me-3">
                  <svg width="58" height="58" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="29" cy="29" r="29" fill="#13B440" fillOpacity="0.1"/>
                    <path d="M29 14C20.7157 14 14 20.7157 14 29C14 37.2843 20.7157 44 29 44C37.2843 44 44 37.2843 44 29C44 20.7157 37.2843 14 29 14ZM29 41C22.3726 41 17 35.6274 17 29C17 22.3726 22.3726 17 29 17C35.6274 17 41 22.3726 41 29C41 35.6274 35.6274 41 29 41Z" fill="#13B440"/>
                    <path d="M29 20V29L35 32" stroke="#13B440" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block">{t('wallet.your_wallet')}</small>
                  <h6 className="mb-0 font-w600">{formatAddress(address)}</h6>
                  <h4 className="mb-0 mt-2">{formatCurrency(accountValue)}</h4>
                  <small className="text-success">{t('wallet.account_value')}</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Margin Used */}
        <div className="col-xl-3 col-sm-6 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="icon me-3">
                  <svg width="58" height="58" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="29" cy="29" r="29" fill="#FFAB2D" fillOpacity="0.1"/>
                    <path d="M29 17V41M17 29H41" stroke="#FFAB2D" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h4 className="mb-0">{formatCurrency(totalMarginUsed)}</h4>
                  <small className="text-warning">{t('wallet.margin_used')}</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Position Value */}
        <div className="col-xl-3 col-sm-6 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="icon me-3">
                  <svg width="58" height="58" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="29" cy="29" r="29" fill="#374C98" fillOpacity="0.1"/>
                    <path d="M20 29L26 35L38 23" stroke="#374C98" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h4 className="mb-0">{formatCurrency(totalNtlPos)}</h4>
                  <small className="text-primary">{t('wallet.position_value')}</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawable */}
        <div className="col-xl-3 col-sm-6 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="icon me-3">
                  <svg width="58" height="58" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="29" cy="29" r="29" fill="#3F9AE0" fillOpacity="0.1"/>
                    <path d="M29 23V35M29 35L34 30M29 35L24 30" stroke="#3F9AE0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h4 className="mb-0">{formatCurrency(withdrawable)}</h4>
                  <small className="text-info">{t('wallet.withdrawable')}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserBalanceCard;

