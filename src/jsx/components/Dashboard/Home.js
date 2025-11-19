import React,{useState,useContext, useEffect} from 'react';
import {Link} from 'react-router-dom';
import loadable from "@loadable/component";
import pMinDelay from "p-min-delay";
import {Dropdown} from 'react-bootstrap';

//Import
import { ThemeContext } from "../../../context/ThemeContext";
import CardSlider from '../Boltz/Home/CardSlider';
import PreviousTab from '../Boltz/Home/PreviousTab';
import RecentTradingReal from '../Boltz/Home/RecentTradingReal';
import OrderData from '../Boltz/Home/OrderData';
import OrderDataReal from '../Boltz/Home/OrderDataReal';
import QuickTrade from '../Boltz/Home/QuickTrade';
import QuickTransfer from '../Boltz/Home/QuickTransfer';
import { useDashboardPrices } from '../../../hooks/useDashboardPrices.js';
import { apiService } from '../../../api/apiService.js';
import { useWallet } from '../../../context/WalletContext.js';
import UserBalanceCard from '../Web3/UserBalanceCard';
import UserPositionsTable from '../Web3/UserPositionsTable';
import CurrentStatisticCard from './CurrentStatisticCard';
// Importar iconos de criptomonedas
import btcIcon from '../../../images/icons/btc.png';
import ethIcon from '../../../images/icons/eth.png';
import ltcIcon from '../../../images/icons/ltc.png';
import solIcon from '../../../images/icons/sol.png';
import moneroIcon from '../../../images/icons/monero.png';
import atomIcon from '../../../images/icons/atom.png';
import maticIcon from '../../../images/icons/matic.png';
import dydxIcon from '../../../images/icons/dydx.png';
import avaxIcon from '../../../images/icons/avax.png';
import bnbIcon from '../../../images/icons/bnb.png';

// Helper para obtener icono de moneda
const getCoinIcon = (symbol) => {
	const normalized = symbol?.toUpperCase() || '';
	switch(normalized) {
		case 'BTC': return btcIcon;
		case 'ETH': return ethIcon;
		case 'LTC': return ltcIcon;
		case 'SOL': return solIcon;
		case 'XMR': 
		case 'MONERO': return moneroIcon;
		case 'ATOM': return atomIcon;
		case 'MATIC': return maticIcon;
		case 'DYDX': return dydxIcon;
		case 'AVAX': return avaxIcon;
		case 'BNB': return bnbIcon;
		default: return btcIcon; // fallback temporal (BTC como placeholder)
	}
};

// Helper para convertir símbolo a coinId para OrderDataReal
const symbolToCoinId = (symbol) => {
	const normalized = symbol?.toLowerCase() || '';
	const map = {
		'btc': 'bitcoin',
		'eth': 'ethereum',
		'ltc': 'litecoin',
		'sol': 'solana',
		'xmr': 'monero',
		'ada': 'cardano',
		'doge': 'dogecoin'
	};
	return map[normalized] || normalized;
};
const MarketLineApex = loadable(() =>
	pMinDelay(import("../Boltz/Home/MarketLineApex"), 1000)
);

const Home = () => {
	const { background } = useContext(ThemeContext);
	
	// Hook para obtener precios de crypto en tiempo real
	const { prices, loading: pricesLoading, error: pricesError } = useDashboardPrices(60000); // Actualiza cada 60s
	
	// Hook para wallet conectado
	const { address } = useWallet();
	const [country1, setCountry1] = useState("Medan, IDN");		
	const [duration2, setDuration2] = useState("Weekly");
	const [selectedCoins, setSelectedCoins] = useState(['ETH', 'BTC']);
	
	// Estado para monedas seleccionadas en Sell/Buy Order
	const [sellOrderCoin, setSellOrderCoin] = useState('LTC');
	const [buyOrderCoin, setBuyOrderCoin] = useState('ETH');
	const [availableCoins, setAvailableCoins] = useState([]);
	const [loadingCoins, setLoadingCoins] = useState(true);
	
	// extract timeframe from duration string
	const getTimeframe = (duration) => {
		if (duration.includes('Daily')) return 'Daily';
		if (duration.includes('Yearly')) return 'Yearly';
		return 'Weekly';
	};

	const handleCoinToggle = (coin) => {
		setSelectedCoins(prev => {
			if (prev.includes(coin)) {
				return prev.filter(c => c !== coin);
			} else {
				return [...prev, coin];
			}
		});
	};
	
	// obtener lista de monedas disponibles de hyperliquid
	useEffect(() => {
		const fetchAvailableCoins = async () => {
			try {
				setLoadingCoins(true);
				const response = await apiService.fetchMetaAndAssetCtxs();
				// response puede ser data o response directamente
				const data = response?.data || response;
				// formato: [universe, assetCtxs] o {universe: [...], ...}
				const universe = (Array.isArray(data) ? data[0]?.universe : data?.universe) || [];
				const coins = universe.map(coin => coin?.name || '').filter(Boolean);
				
				if (coins.length > 0) {
					setAvailableCoins(coins);
					
					// establecer monedas por defecto si están disponibles
					if (!coins.includes(sellOrderCoin)) {
						setSellOrderCoin(coins[0]);
					}
					if (!coins.includes(buyOrderCoin)) {
						setBuyOrderCoin(coins[0]);
					}
				} else {
					// fallback si no hay monedas
					setAvailableCoins(['BTC', 'ETH', 'LTC', 'SOL']);
				}
			} catch (err) {
				console.error('Error fetching available coins:', err);
				// fallback a monedas comunes si falla
				setAvailableCoins(['BTC', 'ETH', 'LTC', 'SOL']);
			} finally {
				setLoadingCoins(false);
			}
		};
		
		fetchAvailableCoins();
	}, []);
	
	return(
		<>
			<div className="mb-sm-4 d-flex flex-wrap align-items-center text-head">
				<h2 className="font-w600 mb-2 me-auto">Dashboard</h2>
				<Dropdown className=" weather-btn mb-2">
					<span className="fs-22 font-w600 d-flex"><i className="fa fa-cloud me-3 ms-3"></i>21</span>
					<Dropdown.Toggle variant="" as="div" className="form-control style-3 default-select cursor-pointer">{country1} </Dropdown.Toggle>
					<Dropdown.Menu >
						<Dropdown.Item onClick={() => setCountry1("Medan, IDN")}>Medan, IDN</Dropdown.Item>
						<Dropdown.Item onClick={() => setCountry1("Jakarta, IDN")}>Jakarta, IDN</Dropdown.Item>
						<Dropdown.Item onClick={() => setCountry1("Surabaya, IDN")}>Surabaya, IDN</Dropdown.Item>
					 </Dropdown.Menu>
				</Dropdown>
				<Link to={"#"} className="btn btn-primary mb-2 rounded"><i className="las la-calendar scale5 me-3"></i>Filter Periode</Link>
			</div>
			
			{/* Mostrar balance y posiciones del usuario si está conectado */}
			{address && (
				<div className="row">
					<UserBalanceCard />
					<UserPositionsTable />
				</div>
			)}
			
			<div className="row">
				<div className="col-xl-3 col-xxl-6 col-sm-6">
					<div className="card">
						<div className="card-body d-flex">
							<div className="icon me-3">
								<img src={btcIcon} alt="Bitcoin" style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'white', padding: '8px' }} />
							</div>
					<div>
						<h2 className="invoice-num">
							{pricesLoading ? (
								<span>Cargando...</span>
							) : pricesError ? (
								<span>Error</span>
							) : (
								<span>{apiService.formatPrice(prices.bitcoin?.price || 0, 0)}</span>
							)}
						</h2>
						<p className="mb-0 invoice-num1">
							<svg width="21" height="14" viewBox="0 0 21 14" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M1 13C1.91797 11.9157 4.89728 8.72772 6.5 7L12.5 10L19.5 1" stroke={prices.bitcoin?.change24h >= 0 ? "#13B440" : "#FF0000"} strokeWidth="2" strokeLinecap="round"/>
							</svg>
							<span className={prices.bitcoin?.change24h >= 0 ? "text-success me-1 ms-1" : "text-danger me-1 ms-1"}>
								{prices.bitcoin?.change24h ? `${prices.bitcoin.change24h.toFixed(2)}%` : '0%'}
							</span> This week
						</p>
					</div>
						</div>
					</div>
				</div>
				<div className="col-xl-3 col-xxl-6 col-sm-6">
					<div className="card">
						<div className="card-body d-flex">
							<div className="icon me-3">
								<img src={ethIcon} alt="Ethereum" style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'white', padding: '8px' }} />
							</div>
					<div>
						<h2 className="invoice-num">
							{pricesLoading ? (
								<span>Cargando...</span>
							) : pricesError ? (
								<span>Error</span>
							) : (
								<span>{apiService.formatPrice(prices.ethereum?.price || 0, 2)}</span>
							)}
						</h2>
						<p className="mb-0">
							<svg width="21" height="14" viewBox="0 0 21 14" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M1 13C1.91797 11.9157 4.89728 8.72772 6.5 7L12.5 10L19.5 1" stroke={prices.ethereum?.change24h >= 0 ? "#13B440" : "#FF0000"} strokeWidth="2" strokeLinecap="round"/>
							</svg>
							<span className={prices.ethereum?.change24h >= 0 ? "text-success  ms-1 me-1" : "text-danger  ms-1 me-1"}>
								{prices.ethereum?.change24h ? `${prices.ethereum.change24h.toFixed(2)}%` : '0%'}
							</span> This week
						</p>
					</div>
						</div>
					</div>
				</div>
				<div className="col-xl-3 col-xxl-6 col-sm-6">
					<div className="card">
						<div className="card-body d-flex">
							<div className="icon me-3">
								<img src={ltcIcon} alt="Litecoin" style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'white', padding: '8px' }} />
							</div>
						<div>
							<h2 className="invoice-num">
								{pricesLoading ? (
									<span>Cargando...</span>
								) : pricesError ? (
									<span>Error</span>
								) : (
									<span>{apiService.formatPrice(prices.litecoin?.price || 0, 2)}</span>
								)}
							</h2>
							<p className="mb-0">
								<svg width="21" height="14" viewBox="0 0 21 14" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d={prices.litecoin?.change24h >= 0 ? "M1 13C1.91797 11.9157 4.89728 8.72772 6.5 7L12.5 10L19.5 1" : "M1 1C1.91797 2.08433 4.89728 5.27228 6.5 7L12.5 4L19.5 13"} stroke={prices.litecoin?.change24h >= 0 ? "#13B440" : "#F04444"} strokeWidth="2" strokeLinecap="round"/>
								</svg>

								<span className={prices.litecoin?.change24h >= 0 ? "text-success ms-1 me-1" : "text-danger ms-1 me-1"}>
									{prices.litecoin?.change24h ? `${Math.abs(prices.litecoin.change24h).toFixed(2)}%` : '0%'}
								</span> This week
							</p>
						</div>
						</div>
					</div>
				</div>
				<div className="col-xl-3 col-xxl-6 col-sm-6">
					<div className="card">
						<div className="card-body d-flex">
							<div className="icon me-3">
								<img src={solIcon} alt="Solana" style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'white', padding: '8px' }} />
							</div>
						<div>
							<h2 className="invoice-num">
								{pricesLoading ? (
									<span>Cargando...</span>
								) : pricesError ? (
									<span>Error</span>
								) : (
									<span>{apiService.formatPrice(prices.solana?.price || 0, 2)}</span>
								)}
							</h2>
							<p className="mb-0">
								<svg width="21" height="14" viewBox="0 0 21 14" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d={prices.solana?.change24h >= 0 ? "M1 13C1.91797 11.9157 4.89728 8.72772 6.5 7L12.5 10L19.5 1" : "M1 1C1.91797 2.08433 4.89728 5.27228 6.5 7L12.5 4L19.5 13"} stroke={prices.solana?.change24h >= 0 ? "#13B440" : "#F04444"} strokeWidth="2" strokeLinecap="round"/>
								</svg>

								<span className={prices.solana?.change24h >= 0 ? "text-success ms-1 me-1" : "text-danger ms-1 me-1"}>
									{prices.solana?.change24h ? `${Math.abs(prices.solana.change24h).toFixed(2)}%` : '0%'}
								</span> This week
							</p>
						</div>
						</div>
					</div>
				</div>
			</div>
			<div className="row">
				<div className="col-xl-3 col-xxl-4">
					<CurrentStatisticCard />
				</div>
				<div className="col-xl-9 col-xxl-8">
					<div className="card">
						<div className="card-header pb-0 border-0 flex-wrap">
							<div className="mb-3">
								<h4 className="fs-20 text-black">Market Overview</h4>
								<p className="mb-0 fs-12 text-black">Lorem ipsum dolor sit amet, consectetur</p>
							</div>
							<div className="d-flex flex-wrap mb-2">
								<div className="form-check custom-checkbox me-4 default-checkbox">
									<input 
										type="checkbox" 
										className="form-check-input" 
										id="customCheckBox1" 
										checked={selectedCoins.includes('ETH')}
										onChange={() => handleCoinToggle('ETH')}
									/>
									<label className="form-check-label" htmlFor="customCheckBox1">ETH</label>
								</div>
								<div className="form-check custom-checkbox me-4 default-checkbox">
									<input 
										type="checkbox" 
										className="form-check-input" 
										id="customCheckBox2" 
									checked={selectedCoins.includes('BTC')}
									onChange={() => handleCoinToggle('BTC')}
									/>
									<label className="form-check-label" htmlFor="customCheckBox2">BTC</label>
								</div>
								<div className="form-check custom-checkbox me-4 default-checkbox">
									<input 
										type="checkbox" 
										className="form-check-input" 
										id="customCheckBox3" 
										checked={selectedCoins.includes('LTC')}
										onChange={() => handleCoinToggle('LTC')}
									/>
									<label className="form-check-label" htmlFor="customCheckBox3">LTC</label>
								</div>
								<div className="form-check custom-checkbox me-4 default-checkbox">
									<input 
										type="checkbox" 
										className="form-check-input" 
										id="customCheckBox4" 
										checked={selectedCoins.includes('BTC')}
										onChange={() => handleCoinToggle('BTC')}
									/>
									<label className="form-check-label" htmlFor="customCheckBox4">BTC</label>
								</div>
							</div>
							<Dropdown className=" weather-btn mb-2">
								<Dropdown.Toggle variant="" as="div" className="form-control style-2 default-select border text-primary cursor-pointer">{duration2} </Dropdown.Toggle>
								<Dropdown.Menu >
									<Dropdown.Item onClick={() => setDuration2("Weekly")}>Weekly</Dropdown.Item>
									<Dropdown.Item onClick={() => setDuration2("Daily")}>Daily</Dropdown.Item>
									<Dropdown.Item onClick={() => setDuration2("Yearly")}>Yearly</Dropdown.Item>
								</Dropdown.Menu>
							</Dropdown>
							
						</div>
						<div className="card-body pb-0 pt-3">
							<div id="marketChart" className="market-line">
								<MarketLineApex 
									selectedCoins={selectedCoins.length > 0 ? selectedCoins : ['ETH', 'BTC']} 
									timeframe={getTimeframe(duration2)} 
								/>
							</div>
						</div>
					</div>
				</div>
				<CardSlider />				
				<div className="col-xl-12">
					<div className="row">
						<RecentTradingReal />
						<div className="col-xl-3 col-xxl-6 col-md-6">
							<div className="card">
								<div className="card-header border-0 pb-0">
									<h4 className="mb-0 fs-20 text-black">Sell Order</h4>
									<Dropdown className="dropdown custom-dropdown mb-0">
										<Dropdown.Toggle variant="" as="div" className="btn sharp tp-btn dark-btn i-false" >	
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" stroke="#342E59" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
												<path d="M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6Z" stroke="#342E59" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
												<path d="M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20Z" stroke="#342E59" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
											</svg>
										</Dropdown.Toggle>	
										<Dropdown.Menu className="dropdown-menu dropdown-menu-right" >
											<Dropdown.Item >Details </Dropdown.Item>
											<Dropdown.Item className="text-danger">Cancel </Dropdown.Item>		
										</Dropdown.Menu>			
									</Dropdown>
								</div>
								<div className="card-body px-4">
									<Dropdown className="dropdown custom-dropdown d-block tbl-orders">
										<Dropdown.Toggle variant="" as="div" className="btn  d-flex align-items-center border-0 order-bg rounded  i-false" >	
											{getCoinIcon(sellOrderCoin) === btcIcon && !['BTC', 'ETH', 'LTC', 'SOL', 'XMR', 'MONERO', 'ATOM', 'MATIC', 'DYDX', 'AVAX', 'BNB'].includes(sellOrderCoin?.toUpperCase()) ? (
												// Mostrar inicial de la moneda como fallback si no hay icono
												<div 
													style={{ 
														width: '46px', 
														height: '46px', 
														borderRadius: '50%', 
														backgroundColor: '#f0f0f0',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														fontSize: '16px',
														fontWeight: 'bold',
														color: '#666'
													}}
												>
													{sellOrderCoin?.charAt(0) || '?'}
												</div>
											) : (
												<img 
													src={getCoinIcon(sellOrderCoin)} 
													alt={sellOrderCoin} 
													width="46" 
													height="46" 
													style={{ borderRadius: '50%', padding: '4px' }}
												/>
											)}
											<div className="text-start ms-3">
												<span className="d-block fs-16 text-black">{sellOrderCoin || 'Seleccionar'}</span>
											</div>
											<i className="fa fa-angle-down scale5 ms-auto"></i>
										</Dropdown.Toggle>	
										<Dropdown.Menu className="dropdown-menu dropdown-menu-right" >
											{loadingCoins ? (
												<Dropdown.Item disabled>Cargando...</Dropdown.Item>
											) : availableCoins.length === 0 ? (
												<Dropdown.Item disabled>No hay monedas disponibles</Dropdown.Item>
											) : (
												availableCoins.map((coin) => (
													<Dropdown.Item 
														key={coin} 
														onClick={() => setSellOrderCoin(coin)}
														active={sellOrderCoin === coin}
													>
														{coin}
													</Dropdown.Item>
												))
											)}
										</Dropdown.Menu>			
									</Dropdown>
									<div className="table-responsive">
										<OrderDataReal type="sell" coinId={symbolToCoinId(sellOrderCoin)} />
									</div>
								</div>
							</div>	
						</div>
						<div className="col-xl-3 col-xxl-6 col-md-6">
							<div className="card">
								<div className="card-header border-0 pb-0">
									<h4 className="mb-0 text-black fs-20">Buy Order</h4>
									<Dropdown className="dropdown custom-dropdown mb-0 tbl-orders-style">
										<Dropdown.Toggle variant="" as="div" className="btn sharp tp-btn dark-btn i-false" >	
											<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" stroke="#342E59" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
												<path d="M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6Z" stroke="#342E59" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
												<path d="M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20Z" stroke="#342E59" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
											</svg>
										</Dropdown.Toggle>	
										<Dropdown.Menu className="dropdown-menu dropdown-menu-right" >
											<Dropdown.Item >Details </Dropdown.Item>
											<Dropdown.Item className="text-danger">Cancel </Dropdown.Item>		
										</Dropdown.Menu>			
									</Dropdown>
								</div>
								<div className="card-body pb-0 px-4">
									<Dropdown className="dropdown custom-dropdown d-block tbl-orders">
										<Dropdown.Toggle variant="" as="div" className="btn  d-flex align-items-center border-0 order-bg rounded  i-false" >	
											{getCoinIcon(buyOrderCoin) === btcIcon && !['BTC', 'ETH', 'LTC', 'SOL', 'XMR', 'MONERO', 'ATOM', 'MATIC', 'DYDX', 'AVAX', 'BNB'].includes(buyOrderCoin?.toUpperCase()) ? (
												// Mostrar inicial de la moneda como fallback si no hay icono
												<div 
													style={{ 
														width: '46px', 
														height: '46px', 
														borderRadius: '50%', 
														backgroundColor: '#f0f0f0',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														fontSize: '16px',
														fontWeight: 'bold',
														color: '#666'
													}}
												>
													{buyOrderCoin?.charAt(0) || '?'}
												</div>
											) : (
												<img 
													src={getCoinIcon(buyOrderCoin)} 
													alt={buyOrderCoin} 
													width="46" 
													height="46" 
													style={{ borderRadius: '50%', padding: '4px' }}
												/>
											)}
											<div className="text-left ms-3">
												<span className="d-block fs-16 text-black">{buyOrderCoin || 'Seleccionar'}</span>
											</div>
											<i className="fa fa-angle-down scale5 ms-auto"></i>
										</Dropdown.Toggle>
										<Dropdown.Menu className="dropdown-menu dropdown-menu-right">
											{loadingCoins ? (
												<Dropdown.Item disabled>Cargando...</Dropdown.Item>
											) : availableCoins.length === 0 ? (
												<Dropdown.Item disabled>No hay monedas disponibles</Dropdown.Item>
											) : (
												availableCoins.map((coin) => (
													<Dropdown.Item 
														key={coin} 
														onClick={() => setBuyOrderCoin(coin)}
														active={buyOrderCoin === coin}
														className="dropdown-item"
													>
														{coin}
													</Dropdown.Item>
												))
											)}
										</Dropdown.Menu>
									</Dropdown>
									<div className="table-responsive">
										<OrderDataReal type="buy" coinId={symbolToCoinId(buyOrderCoin)} />
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>	
				<div className="col-xl-12">
					<div className="row">
						<div className="col-xl-6 col-xxl-12">
							<QuickTransfer />
						</div>
						<div className="col-xl-6 col-xxl-12">
							<QuickTrade />
						</div>
					</div>
				</div>
			</div>	
		</>
	)
}
export default Home;