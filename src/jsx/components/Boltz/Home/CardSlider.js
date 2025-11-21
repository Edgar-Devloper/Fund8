import React from 'react';
import Slider from "react-slick";
//Images
import card44 from './../../../../images/card/card44.jpg';
import card33 from './../../../../images/card/card33.jpg';
import card11 from './../../../../images/card/card11.jpg';
import card22 from './../../../../images/card/card22.jpg';
import { useWallet } from '../../../../context/WalletContext.js';
import { useUserBalance } from '../../../../hooks/useUserBalance.js';
import { useUserPositions } from '../../../../hooks/useUserPositions.js';


const CardSlider = () => {
	// Obtener wallet y datos del usuario
	const { address } = useWallet();
	const { userState, loading: balanceLoading } = useUserBalance();
	const { positions, loading: positionsLoading } = useUserPositions();
	
	// Extraer datos
	const accountValue = parseFloat(userState?.crossMarginSummary?.accountValue || 0);
	const totalMarginUsed = parseFloat(userState?.crossMarginSummary?.totalMarginUsed || 0);
	const withdrawable = parseFloat(userState?.withdrawable || 0);
	
	// Calcular PnL total de posiciones
	const totalPnl = positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0);
	const totalPnlPercentage = accountValue > 0 ? (totalPnl / accountValue * 100).toFixed(2) : 0;
	
	// Formatear moneda
	const formatCurrency = (value) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(value);
	};
	
	// Formatear dirección
	const formatAddress = (addr) => {
		if (!addr) return '';
		return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
	};
	
	const settings = {
		dots: false,
		infinite: true,
		arrows: false,
		variableWidth: true,
		speed: 500,
		slidesToScroll: 1,
		responsive: [
			{
			  breakpoint: 575,
				settings: {
					slidesToScroll: 1,
					variableWidth: false,
				}
			},
		]	
	};
	
	// Obtener función de conexión
	const { connectWallet, connecting } = useWallet();
	
	// Manejar click en conectar
	const handleConnect = async () => {
		await connectWallet();
	};
	
	// Si no hay wallet conectada, mostrar mensaje
	if (!address) {
		return (
			<Slider className="card-slide owl-right-nav" {...settings}>
				<div className="items p-2">
					<div className="card-bx stacked card">
						<img src={card44} alt="" />
						<div className="card-info d-flex flex-column justify-content-center align-items-center text-center" style={{minHeight: '200px'}}>
							<svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3">
								<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="white" opacity="0.7"/>
							</svg>
							<h4 className="text-white mb-2">Conecta tu Wallet</h4>
							<p className="text-white mb-3 op6 fs-12">Conecta tu wallet para ver tu balance y posiciones en tiempo real</p>
							<button 
								onClick={handleConnect} 
								className="btn btn-sm btn-light"
								disabled={connecting}
							>
								{connecting ? 'Conectando...' : 'Conectar Wallet'}
							</button>
						</div>
					</div>
				</div>
			</Slider>
		);
	}
	
	// Si está cargando
	if (balanceLoading) {
		return (
			<Slider className="card-slide owl-right-nav" {...settings}>
				<div className="items p-2">
					<div className="card-bx stacked card">
						<img src={card44} alt="" />
						<div className="card-info d-flex justify-content-center align-items-center" style={{minHeight: '200px'}}>
							<div className="spinner-border text-white" role="status">
								<span className="visually-hidden">Cargando...</span>
							</div>
						</div>
					</div>
				</div>
			</Slider>
		);
	}
	
	return (
		<Slider  className="card-slide owl-right-nav " {...settings}>
			{/* Tarjeta 1: Account Value */}
			<div className="items p-2">
				<div className="card-bx stacked card">
					<img src={card44} alt="" />
					<div className="card-info">
						<p className="mb-1 text-white fs-14">Account Value</p>
						<div className="d-flex justify-content-between">
							<h2 className="num-text text-white mb-5 font-w600">{formatCurrency(accountValue)}</h2>
							<svg width="55" height="34" viewBox="0 0 55 34" fill="none" xmlns="http://www.w3.org/2000/svg">
								<circle cx="38.0091" cy="16.7788" r="16.7788" fill="white" fillOpacity="0.67"/>
								<circle cx="17.4636" cy="16.7788" r="16.7788" fill="white" fillOpacity="0.67"/>
							</svg>
						</div>
						<div className="d-flex">
							<div className="me-4 text-white">
								<p className="fs-12 mb-1 op6">NETWORK</p>
								<span>Hyperliquid</span>
							</div>
							<div className="text-white">
								<p className="fs-12 mb-1 op6">WALLET</p>
								<span>{formatAddress(address)}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			{/* Tarjeta 2: Margin Used */}
			<div className="items p-2">
				<div className="card-bx stacked card">
					<img src={card33} alt="" />
					<div className="card-info">
						<p className="mb-1 text-white fs-14">Margin Used</p>
						<div className="d-flex justify-content-between">
							<h2 className="num-text text-white mb-5 font-w600">{formatCurrency(totalMarginUsed)}</h2>
							<svg width="55" height="34" viewBox="0 0 55 34" fill="none" xmlns="http://www.w3.org/2000/svg">
								<circle cx="38.0091" cy="16.7788" r="16.7788" fill="white" fillOpacity="0.67"/>
								<circle cx="17.4636" cy="16.7788" r="16.7788" fill="white" fillOpacity="0.67"/>
							</svg>
						</div>
						<div className="d-flex">
							<div className="me-4 text-white">
								<p className="fs-12 mb-1 op6">USAGE</p>
								<span>{accountValue > 0 ? Math.round((totalMarginUsed / accountValue) * 100) : 0}%</span>
							</div>
							<div className="text-white">
								<p className="fs-12 mb-1 op6">STATUS</p>
								<span>{totalMarginUsed > 0 ? 'Active' : 'Idle'}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			{/* Tarjeta 3: Available to Withdraw */}
			<div className="items p-2">
				<div className="card-bx stacked card">
					<img src={card11} alt="" />
					<div className="card-info">
						<p className="mb-1 text-white fs-14">Available to Withdraw</p>
						<div className="d-flex justify-content-between">
							<h2 className="num-text text-white mb-5 font-w600">{formatCurrency(withdrawable)}</h2>
							<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M19.2744 18.8013H16.0334V23.616H19.2744C19.9286 23.616 20.5354 23.3506 20.9613 22.9053C21.4066 22.4784 21.672 21.8726 21.672 21.1989C21.673 19.8813 20.592 18.8013 19.2744 18.8013Z" fill="white"/>
								<path d="M18 0C8.07429 0 0 8.07429 0 18C0 27.9257 8.07429 36 18 36C27.9257 36 36 27.9247 36 18C36 8.07531 27.9247 0 18 0ZM21.6627 26.3355H19.5398V29.6722H17.3129V26.3355H16.0899V29.6722H13.8528V26.3355H9.91954V24.2414H12.0898V11.6928H9.91954V9.59863H13.8528V6.3288H16.0899V9.59863H17.3129V6.3288H19.5398V9.59863H21.4735C22.5535 9.59863 23.5491 10.044 24.2599 10.7547C24.9706 11.4655 25.416 12.4611 25.416 13.5411C25.416 15.6549 23.7477 17.3798 21.6627 17.4744C24.1077 17.4744 26.0794 19.4647 26.0794 21.9096C26.0794 24.3453 24.1087 26.3355 21.6627 26.3355Z" fill="white"/>
								<path d="M20.7062 15.8441C21.095 15.4553 21.3316 14.9338 21.3316 14.3465C21.3316 13.1812 20.3842 12.2328 19.2178 12.2328H16.0334V16.4695H19.2178C19.7959 16.4695 20.3266 16.2226 20.7062 15.8441Z" fill="white"/>
							</svg>
						</div>
						<div className="d-flex">
							<div className="me-4 text-white">
								<p className="fs-12 mb-1 op6">OF TOTAL</p>
								<span>{accountValue > 0 ? Math.round((withdrawable / accountValue) * 100) : 0}%</span>
							</div>
							<div className="text-white">
								<p className="fs-12 mb-1 op6">STATUS</p>
								<span>Available</span>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			{/* Tarjeta 4: Total PnL */}
			<div className="items p-2">
				<div className="card-bx stacked card">
					<img src={card22} alt="" />
					<div className="card-info">
						<p className="mb-1 text-white fs-14">Total PnL</p>
						<div className="d-flex justify-content-between">
							<h2 className={`num-text text-white mb-5 font-w600 ${totalPnl >= 0 ? '' : 'text-danger'}`}>
								{totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
							</h2>
							<svg width="55" height="34" viewBox="0 0 55 34" fill="none" xmlns="http://www.w3.org/2000/svg">
								<circle cx="38.0091" cy="16.7788" r="16.7788" fill="white" fillOpacity="0.67"/>
								<circle cx="17.4636" cy="16.7788" r="16.7788" fill="white" fillOpacity="0.67"/>
							</svg>
						</div>
						<div className="d-flex">
							<div className="me-4 text-white">
								<p className="fs-12 mb-1 op6">PERCENTAGE</p>
								<span className={totalPnl >= 0 ? 'text-success' : 'text-danger'}>
									{totalPnl >= 0 ? '+' : ''}{totalPnlPercentage}%
								</span>
							</div>
							<div className="text-white">
								<p className="fs-12 mb-1 op6">POSITIONS</p>
								<span>{positions.length} open</span>
							</div>
						</div>
					</div>
				</div>
			</div>
			
		</Slider>
	);
};

export default CardSlider;
