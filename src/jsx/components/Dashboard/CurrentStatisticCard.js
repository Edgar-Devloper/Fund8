import React from 'react';
import CurrentRadialApex from '../Boltz/Home/CurrentRadialApex';
import { useTradingStatistics } from '../../../hooks/useTradingStatistics.js';
import { useWallet } from '../../../context/WalletContext.js';
import ConnectWalletButton from '../Web3/ConnectWalletButton.js';
import { useTranslation } from 'react-i18next';

const CurrentStatisticCard = () => {
	const { isConnected } = useWallet();
	const { income, spends, fees, invest, incomePercent, spendsPercent, feesPercent, investPercent, loading, error } = useTradingStatistics(60000);
	const { t } = useTranslation();

	const formatCurrency = (value) => {
		if (value === 0 || isNaN(value)) return '$0.00';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(value);
	};

	const formatPercent = (value) => {
		if (value === 0 || isNaN(value)) return '0%';
		return `${value.toFixed(0)}%`;
	};

	if (!isConnected) {
		return (
			<div className="card">
				<div className="card-header border-0 pb-0">
					<h4 className="fs-20 mb-0">{t('dashboard.current_statistic')}</h4>
				</div>
				<div className="card-body text-center py-5">
					<i className="fa fa-wallet fa-3x text-muted mb-3"></i>
					<h5 className="mb-3">{t('wallet.connect_your_wallet')}</h5>
					<p className="text-muted mb-4">{t('dashboard.connect_wallet_to_see_stats')}</p>
					<ConnectWalletButton />
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="card">
				<div className="card-header border-0 pb-0">
					<h4 className="fs-20 mb-0">{t('dashboard.current_statistic')}</h4>
				</div>
				<div className="card-body text-center py-5">
					<div className="spinner-border text-primary" role="status">
						<span className="visually-hidden">{t('common.loading')}</span>
					</div>
					<p className="mt-2 text-muted">{t('dashboard.loading_statistics')}</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="card">
				<div className="card-header border-0 pb-0">
					<h4 className="fs-20 mb-0">{t('dashboard.current_statistic')}</h4>
				</div>
				<div className="card-body">
					<div className="alert alert-warning" role="alert">
						<strong>{t('common.error')}:</strong> {error}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="card">
			<div className="card-header border-0 pb-0">
				<h4 className="fs-20 mb-0">{t('dashboard.current_statistic')}</h4>
			</div>
			<div className="card-body">
				<div id="currentChart">
					<CurrentRadialApex 
						incomePercent={incomePercent}
						spendsPercent={spendsPercent}
						feesPercent={feesPercent}
						investPercent={investPercent}
					/>
				</div>
				<div className="chart-content">	
					<div className="d-flex justify-content-between mb-2 align-items-center">
						<div>
							<svg className="me-2" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
								<rect width="15" height="15" rx="7.5" fill="#EB8153"/>
							</svg>
							<span className="fs-14">{t('dashboard.income')} ({formatPercent(incomePercent)})</span>
						</div>
						<div>
							<h5 className="mb-0">{formatCurrency(income)}</h5>
						</div>
					</div>
					<div className="d-flex justify-content-between mb-2 align-items-center">
						<div>
							<svg className="me-2" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
								<rect width="15" height="15" rx="7.5" fill="#4441DE"/>
							</svg>
							<span className="fs-14">{t('dashboard.spends')} ({formatPercent(spendsPercent)})</span>
						</div>
						<div>
							<h5 className="mb-0">{formatCurrency(spends)}</h5>
						</div>
					</div>
					<div className="d-flex justify-content-between mb-2 align-items-center">
						<div>
							<svg className="me-2" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
								<rect width="15" height="15" rx="7.5" fill="#60C695"/>
							</svg>
							<span className="fs-14">{t('dashboard.fees')} ({formatPercent(feesPercent)})</span>
						</div>
						<div>
							<h5 className="mb-0">{formatCurrency(fees)}</h5>
						</div>
					</div>
					<div className="d-flex justify-content-between mb-2 align-items-center">
						<div>
							<svg className="me-2" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
								<rect width="15" height="15" rx="7.5" fill="#F34F80"/>
							</svg>
							<span className="fs-14">{t('dashboard.invest')} ({formatPercent(investPercent)})</span>
						</div>
						<div>
							<h5 className="mb-0">{formatCurrency(invest)}</h5>
						</div>
					</div>
				</div>	
			</div>
		</div>
	);
};

export default CurrentStatisticCard;

