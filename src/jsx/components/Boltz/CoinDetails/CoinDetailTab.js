import React,{useState, useEffect} from 'react';
import { Dropdown, Nav, Tab } from "react-bootstrap";
import loadable from "@loadable/component";
import pMinDelay from "p-min-delay";
import DateRangePicker from "react-bootstrap-daterangepicker";
import "bootstrap-daterangepicker/daterangepicker.css";
//Import
import btc1 from './../../../../images/icons/btc.png';
import ethIcon from './../../../../images/icons/eth.png';
import moneroIcon from './../../../../images/icons/monero.png';
import ltcIcon from './../../../../images/icons/ltc.png';
import {QuickTradeTab1} from './QuickTradeTab';
import EthereumTab from './EthereumTab';
import MoneroTab from './MoneroTab';
import LitecoinTab from './LitecoinTab';
import {Sellorder, Buyorder, DropDownBlog} from './OrderBlog';
import { useCryptoPrice } from '../../../../hooks/useCryptoPrice.js';
import { apiService } from '../../../../api/apiService.js';
const CoinLineChart1 = loadable(() =>
	pMinDelay(import("./CoinCharts/CoinLineChart1"), 1000)
);

const CoinDetailTab = () =>{
	const [doller, setDoller] = useState("USD ($ US Dollar)");
	const [selectedCoin, setSelectedCoin] = useState("bitcoin");
	const [activeTab, setActiveTab] = useState("Bitcoin");
	const { data: priceData, loading: priceLoading, error: priceError } = useCryptoPrice(selectedCoin);
	const [marketData, setMarketData] = useState(null);

	const handleTabChange = (coin, tabKey) => {
		console.log('[CoinDetails] Tab changed:', { coin, tabKey });
		setSelectedCoin(coin);
		setActiveTab(tabKey);
	};

	useEffect(() => {
		console.log('[CoinDetails] Selected coin changed:', selectedCoin);
		console.log('[CoinDetails] Price data:', priceData);
		console.log('[CoinDetails] Price loading:', priceLoading);
		console.log('[CoinDetails] Price error:', priceError);
	}, [selectedCoin, priceData, priceLoading, priceError]);

	useEffect(() => {
		const fetchMarketData = async () => {
			try {
				console.log('[CoinDetails] Fetching market data for:', selectedCoin);
				const data = await apiService.fetchMetaAndAssetCtxs();
				console.log('[CoinDetails] Raw API response:', data);
				
				const responseData = data.data || data;
				console.log('[CoinDetails] Response data:', responseData);
				console.log('[CoinDetails] Is array?', Array.isArray(responseData));
				
				let assetCtxs = {};
				if (Array.isArray(responseData)) {
					console.log('[CoinDetails] Array length:', responseData.length);
					console.log('[CoinDetails] Array[0] (universe):', responseData[0]);
					console.log('[CoinDetails] Array[1] (assetCtxs):', responseData[1]);
					assetCtxs = responseData[1] || {};
				} else {
					console.log('[CoinDetails] Object keys:', Object.keys(responseData || {}));
					assetCtxs = responseData?.assetCtxs || {};
				}
				
				console.log('[CoinDetails] Asset contexts object:', assetCtxs);
				console.log('[CoinDetails] Asset contexts keys:', Object.keys(assetCtxs));
				
				const symbol = selectedCoin === 'bitcoin' ? 'BTC' : selectedCoin === 'ethereum' ? 'ETH' : selectedCoin === 'litecoin' ? 'LTC' : 'XMR';
				console.log('[CoinDetails] Symbol:', symbol);
				console.log('[CoinDetails] Asset context for', symbol, ':', assetCtxs[symbol]);
				
				// try alternative keys
				if (!assetCtxs[symbol]) {
					console.log('[CoinDetails] Trying alternative keys...');
					const allKeys = Object.keys(assetCtxs);
					console.log('[CoinDetails] All available keys:', allKeys);
					const btcKey = allKeys.find(k => k.toUpperCase() === 'BTC' || k.toLowerCase().includes('btc'));
					console.log('[CoinDetails] Found BTC key:', btcKey);
				}
				
				const ctx = assetCtxs[symbol];
				if (ctx) {
					const currentPrice = priceData?.price || parseFloat(ctx.markPx || '0');
					const prevPrice = parseFloat(ctx.prevDayPx || '0');
					const change24h = prevPrice > 0 ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;
					
					const marketDataObj = {
						volume24h: parseFloat(ctx.dayNtlVlm || '0'),
						prevDayPx: prevPrice,
						markPx: parseFloat(ctx.markPx || '0'),
						currentPrice: currentPrice,
						change24h: change24h
					};
					
					console.log('[CoinDetails] Market data calculated:', marketDataObj);
					setMarketData(marketDataObj);
				} else {
					console.warn('[CoinDetails] No context found for symbol:', symbol);
					// try to get price from allMids as fallback
					try {
						console.log('[CoinDetails] Trying to get price from allMids...');
						const priceResponse = await apiService.fetchCryptoPrice(selectedCoin);
						console.log('[CoinDetails] Price from allMids:', priceResponse);
						if (priceResponse?.price) {
							setMarketData({
								volume24h: 0,
								prevDayPx: 0,
								markPx: priceResponse.price,
								currentPrice: priceResponse.price,
								change24h: priceResponse.change24h || 0
							});
						}
					} catch (priceErr) {
						console.error('[CoinDetails] Error fetching price:', priceErr);
					}
				}
			} catch (err) {
				console.error('[CoinDetails] Error fetching market data:', err);
			}
		};
		if (selectedCoin) {
			fetchMarketData();
		}
	}, [selectedCoin, priceData]);		
	return(
		<>
			<Tab.Container defaultActiveKey="Bitcoin" activeKey={activeTab} onSelect={(k) => {
				if (k === 'Bitcoin') handleTabChange('bitcoin', 'Bitcoin');
				else if (k === 'Ethereum') handleTabChange('ethereum', 'Ethereum');
				else if (k === 'Litecoin') handleTabChange('litecoin', 'Litecoin');
				else if (k === 'Monero') handleTabChange('monero', 'Monero');
			}}>
				<div className="d-flex flex-wrap mb-sm-4 mt-3 text-head">
					<h2 className="text-black me-auto font-w600 mb-2">Coin Details</h2>
					<div className="card-action coin-tabs mt-3 mt-sm-0">
						<Nav as="ul" className="nav nav-tabs" role="tablist">
							<Nav.Item as="li" className="nav-item">
								<Nav.Link as="a" className="nav-link "  eventKey="Bitcoin" role="tab" onClick={() => handleTabChange('bitcoin', 'Bitcoin')}>
									<img src={btc1} alt="Bitcoin" width="24" height="24" style={{ borderRadius: '50%', marginRight: '8px' }} />
									Bitcoin
								</Nav.Link>
							</Nav.Item>
							<Nav.Item as="li" className="nav-item">
								<Nav.Link as="a" className="nav-link "  eventKey="Ethereum" role="tab" onClick={() => handleTabChange('ethereum', 'Ethereum')}>
									<img src={ethIcon} alt="Ethereum" width="24" height="24" style={{ borderRadius: '50%', marginRight: '8px' }} />
									Ethereum
								</Nav.Link>
							</Nav.Item>
							
							<Nav.Item as="li" className="nav-item">
								<Nav.Link as="a" className="nav-link "  eventKey="Monero" role="tab" onClick={() => handleTabChange('monero', 'Monero')}>
									<img src={moneroIcon} alt="Monero" width="24" height="24" style={{ borderRadius: '50%', marginRight: '8px' }} />
									Monero
								</Nav.Link>
							</Nav.Item>
							
							<Nav.Item as="li" className="nav-item">
								<Nav.Link as="a" className="nav-link"  eventKey="Litecoin" role="tab" onClick={() => handleTabChange('litecoin', 'Litecoin')}>
									<img src={ltcIcon} alt="Litecoin" width="24" height="24" style={{ borderRadius: '50%', marginRight: '8px' }} />
									Litecoin
								</Nav.Link>
							</Nav.Item>
						 </Nav>	
					</div>
				</div>
				<Tab.Content className="tab-content">
					<Tab.Pane  className="tab-pane fade" eventKey="Bitcoin">
						<div className="row">
							<div className="col-xl-3 col-xxl-4 mt-4">
								<div className="card">
									<div className="card-header pb-0 border-0">
										<h4 className="mb-0 text-black fs-20">About</h4>
										<DropDownBlog />
									</div>
									<div className="card-body">
										<div className="d-flex align-items-start mb-3 about-coin">
											<div>
												<img src={btc1} alt="" />
											</div>
											<div className="ms-3">
												<h2 className="font-w600 text-black mb-0 title">Digital Cash</h2>
												<p className="font-w600 text-black sub-title">BTC</p>
												<span>1 BTC = 68.48 USD</span>
											</div>	
										</div>
										<p className="fs-14">Dash is an open source cryptocurrency. It is an altcoin that was forked from the Bitcoin protocol. It is also a decentralized autonomous organization (DAO) run by a subset of its users, which are called &quot;masternodes&quot;. The currency permits transactions that can be untraceable.</p>
										<p className="fs-14">Dash is an open source cryptocurrency. It is an altcoin that was forked from the Bitcoin protocol. It is also a decentralized autonomous organization (DAO) run by a subset of its users, which are called &quot;masternodes&quot;. The currency permits transactions that can be untraceable.</p>
									</div>
								</div>
							</div>
							<div className="col-xl-9 col-xxl-8 mt-4">
								<div className="card">
									<div className="card-header pb-0 d-block d-sm-flex flex-wrap border-0 align-items-center">
										<div className="me-auto mb-3">
											<h4 className="fs-20 text-black">Coin Chart</h4>
											<p className="fs-12">Lorem ipsum dolor sit amet, consectetur</p>
										</div>
										
										<div className="input-group detault-daterange me-3  mb-3 coinDetails-datepiker">
											<span className="input-group-text"><i className="las la-calendar"></i></span>
											<DateRangePicker>
												<input type="text" className="form-control" />
											</DateRangePicker>
										</div>
										<Dropdown className="">
											<Dropdown.Toggle variant="" as="div" className="form-control style-1 default-select  mb-3 rounded">{doller} </Dropdown.Toggle>
											<Dropdown.Menu >
												<Dropdown.Item onClick={() => setDoller("USD ($ US Dollar)")}>USD ($ US Dollar)</Dropdown.Item>
												<Dropdown.Item onClick={() => setDoller("BTC ($ US Dollar")}>BTC ($ US Dollar</Dropdown.Item>
												<Dropdown.Item onClick={() => setDoller("USD ($ US Dollar)")}>USD ($ US Dollar)</Dropdown.Item>
											 </Dropdown.Menu>
										</Dropdown>
									</div>
									<div className="card-body pb-0 pt-sm-3 pt-0">
										<div className="row sp20 mb-4 align-items-center">
											<div className="col-lg-4 col-xxl-4 col-sm-4 d-flex flex-wrap align-items-center">
												<div className="px-2 info-group">
													<p className="fs-18 mb-1">Price</p>
													<h2 className="fs-28 font-w600 text-black">
														{priceLoading ? (
															<span className="spinner-border spinner-border-sm"></span>
														) : marketData?.currentPrice || priceData?.price ? (
															`$${(marketData?.currentPrice || priceData?.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
														) : (
															'$0.00'
														)}
													</h2>
												</div>
											</div>
											<div className="d-flex col-lg-8 col-xxl-8 col-sm-8 align-items-center mt-sm-0 mt-3 justify-content-end">
												<div className="px-2 info-group">
													<p className="fs-14 mb-1">24h% change</p>
													<h3 className="fs-20 font-w600">
														{(marketData?.change24h !== undefined || priceData?.change24h !== undefined) ? (
															<>
																{(() => {
																	const change = marketData?.change24h !== undefined ? marketData.change24h : priceData?.change24h || 0;
																	return (
																		<>
																			<span className={change >= 0 ? 'text-success' : 'text-danger'}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span>
																			<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
																				<path d={change >= 0 ? "M0 7L7.00001 -8.77983e-06L14 7H7.00001H0Z" : "M0 7L7.00001 14L14 7H7.00001H0Z"} fill={change >= 0 ? "#2BC155" : "#FF3A3A"}></path>
																			</svg>
																		</>
																	);
																})()}
															</>
														) : (
															<span className="text-muted">--</span>
														)}
													</h3>
												</div>
												<div className="px-2 info-group">
													<p className="fs-14 mb-1">Volume (24h)</p>
													<h3 className="fs-20 font-w600 text-black">
														{marketData?.volume24h ? (
															marketData.volume24h >= 1000000000 
																? `$${(marketData.volume24h / 1000000000).toFixed(2)}B`
																: marketData.volume24h >= 1000000
																? `$${(marketData.volume24h / 1000000).toFixed(2)}M`
																: `$${marketData.volume24h.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
														) : (
															'$0.00'
														)}
													</h3>
												</div>
												<div className="px-2 info-group">
													<p className="fs-14 mb-1">Mark Price</p>
													<h3 className="fs-20 font-w600 text-black">
														{marketData?.markPx ? (
															`$${marketData.markPx.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
														) : (
															'$0.00'
														)}
													</h3>
												</div>
											</div>
										</div>
										<div id="chartBarRunning" className="bar-chart">
											<CoinLineChart1 />
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="row">
							<div className="col-xl-3 col-xxl-6 col-md-6">
								<Sellorder coinId="bitcoin" />
							</div>
							<div className="col-xl-3 col-xxl-6 col-md-6">
								<Buyorder coinId="bitcoin" />
							</div>
							<div className="col-xl-6 col-xxl-12">
								<QuickTradeTab1 />
							</div>
						</div>	
					</Tab.Pane>	
					<Tab.Pane eventKey="Ethereum">
						<EthereumTab />
					</Tab.Pane>	
					<Tab.Pane eventKey="Monero">
						<MoneroTab />
					</Tab.Pane>	
					<Tab.Pane eventKey="Litecoin">
						<LitecoinTab />
					</Tab.Pane>	
				</Tab.Content>		
			</Tab.Container>	
		</>
	)
}
export default CoinDetailTab;