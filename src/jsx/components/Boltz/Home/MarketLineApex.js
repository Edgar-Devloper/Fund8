import React, { useState, useEffect, useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import { apiService } from "../../../../api/apiService.js";

const MarketLineApex = ({ selectedCoins = ['ETH', 'BTC'], timeframe = 'Weekly' }) => {
	const [series, setSeries] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [candlesData, setCandlesData] = useState({});
	const [availableCoins, setAvailableCoins] = useState([]);
	const [failedCoins, setFailedCoins] = useState([]);
	
	console.log('[MarketLineApex] Component mounted/updated:', { selectedCoins, timeframe, availableCoins: availableCoins.length });
	
	// map timeframe to interval and limit
	const { interval, limit } = useMemo(() => {
		switch(timeframe) {
			case 'Daily':
				return { interval: '1h', limit: 24 };
			case 'Yearly':
				return { interval: '1d', limit: 365 };
			case 'Weekly':
			default:
				return { interval: '4h', limit: 42 }; // 7 days * 6 candles per day
		}
	}, [timeframe]);
	
	// fetch available coins from hyperliquid
	useEffect(() => {
		console.log('[MarketLineApex] Fetching available coins...');
		const fetchAvailableCoins = async () => {
			try {
				const response = await apiService.fetchMetaAndAssetCtxs();
				console.log('[MarketLineApex] MetaAndAssetCtxs response:', response);
				const universe = response?.[0]?.universe || [];
				const coins = universe.map(coin => coin?.name || '').filter(Boolean);
				console.log('[MarketLineApex] Available coins:', coins);
				setAvailableCoins(coins);
			} catch (err) {
				console.error('[MarketLineApex] Error fetching available coins:', err);
				// if fetching available coins fails, use selectedCoins as fallback
				console.warn('[MarketLineApex] Using selectedCoins as fallback:', selectedCoins);
				setAvailableCoins(selectedCoins || []);
			}
		};
		fetchAvailableCoins();
	}, [selectedCoins]);
	
	// filter selected coins to only include available ones
	const validCoins = useMemo(() => {
		if (availableCoins.length === 0) {
			console.log('[MarketLineApex] No available coins yet, using selectedCoins:', selectedCoins);
			return selectedCoins || [];
		}
		const filtered = (selectedCoins || []).filter(coin => {
			const symbol = coin.toUpperCase();
			return availableCoins.includes(symbol);
		});
		console.log('[MarketLineApex] Valid coins after filtering:', filtered, 'from selected:', selectedCoins, 'available:', availableCoins);
		return filtered;
	}, [selectedCoins, availableCoins]);
	
	// fetch candles for all selected coins
	useEffect(() => {
		console.log('[MarketLineApex] useEffect for fetchCandles triggered:', { validCoins, validCoinsLength: validCoins?.length, availableCoinsLength: availableCoins?.length });
		
		if (!validCoins || validCoins.length === 0) {
			console.warn('[MarketLineApex] No valid coins to fetch, skipping...');
			setLoading(false);
			if (selectedCoins && selectedCoins.length > 0 && availableCoins.length > 0) {
				setError(`Las siguientes monedas no están disponibles en Hyperliquid: ${selectedCoins.filter(c => !validCoins.includes(c)).join(', ')}`);
			} else if (availableCoins.length === 0) {
				console.log('[MarketLineApex] Waiting for available coins to load...');
			}
			return;
		}
		
		console.log('[MarketLineApex] Starting to fetch candles for:', validCoins);
		
		setLoading(true);
		setError(null);
		setFailedCoins([]);
		
			const fetchAllCandles = async () => {
			try {
				// hyperliquid uses milliseconds for timestamps in candleSnapshot
				const endTime = Date.now(); // milliseconds
				const intervalMilliseconds = {
					'1h': 3600 * 1000,
					'4h': 14400 * 1000,
					'1d': 86400 * 1000
				}[interval] || 14400 * 1000;
				
				const startTime = endTime - (limit * intervalMilliseconds);
				
				console.log('[MarketLineApex] Fetching candles:', { 
					validCoins, 
					interval, 
					limit, 
					startTime, 
					endTime,
					startDate: new Date(startTime).toISOString(),
					endDate: new Date(endTime).toISOString()
				});
				
				const promises = validCoins.map(async (coin) => {
					try {
						const symbol = coin.toUpperCase();
						
						// try with seconds first (standard format)
						let response;
						try {
							response = await apiService.fetchCandles(symbol, interval, startTime, endTime);
							console.log(`[MarketLineApex] Raw response for ${coin}:`, {
								type: typeof response,
								isArray: Array.isArray(response),
								hasData: !!response?.data,
								responseKeys: response && typeof response === 'object' ? Object.keys(response) : null,
								firstItem: Array.isArray(response) && response.length > 0 ? response[0] : null,
								fullResponse: response
							});
						} catch (apiErr) {
							console.error(`[MarketLineApex] API error for ${coin}:`, apiErr);
							throw new Error(`Error de API para ${coin}: ${apiErr.message || 'Error desconocido'}`);
						}
						
						// extract candles from response
						let candles = [];
						if (Array.isArray(response)) {
							candles = response;
						} else if (response && typeof response === 'object') {
							// check common response wrapper formats
							candles = response.data || response.candles || response.result || [];
							// if still not array, check if it's a single object with arrays inside
							if (!Array.isArray(candles)) {
								console.warn(`[MarketLineApex] Non-array response for ${coin}, trying to extract:`, response);
								// sometimes response is { [coin]: [...] }
								const coinKey = Object.keys(response).find(k => Array.isArray(response[k]));
								if (coinKey) {
									candles = response[coinKey];
								}
							}
						}
						
						console.log(`[MarketLineApex] Extracted candles for ${coin}:`, {
							count: candles.length,
							first: candles[0],
							last: candles[candles.length - 1]
						});
						
						if (!Array.isArray(candles) || candles.length === 0) {
							console.error(`[MarketLineApex] No candles found for ${coin}. Response structure:`, response);
							throw new Error(`No se encontraron datos históricos para ${coin}. Respuesta vacía o formato inesperado.`);
						}
						
						// format candles - handle both object format {t, o, h, l, c} and array format [time, open, high, low, close]
						const formattedCandles = candles.map((candle, idx) => {
							try {
								// if array format [timestamp, open, high, low, close, volume?]
								if (Array.isArray(candle)) {
									return {
										time: candle[0],
										open: parseFloat(candle[1] || 0),
										high: parseFloat(candle[2] || 0),
										low: parseFloat(candle[3] || 0),
										close: parseFloat(candle[4] || 0)
									};
								}
								// if object format {t, o, h, l, c, v} or {time, open, high, low, close}
								if (typeof candle === 'object' && candle !== null) {
									return {
										time: candle.t || candle.time || candle.timestamp || candle[0],
										open: parseFloat(candle.o || candle.open || candle[1] || 0),
										high: parseFloat(candle.h || candle.high || candle[2] || 0),
										low: parseFloat(candle.l || candle.low || candle[3] || 0),
										close: parseFloat(candle.c || candle.close || candle[4] || 0)
									};
								}
								return null;
							} catch (err) {
								console.warn(`[MarketLineApex] Error formatting candle ${idx} for ${coin}:`, err, candle);
								return null;
							}
						}).filter(c => c !== null && c.time && (c.close > 0 || c.open > 0));
						
						console.log(`[MarketLineApex] Formatted candles for ${coin}:`, {
							total: formattedCandles.length,
							first: formattedCandles[0],
							last: formattedCandles[formattedCandles.length - 1]
						});
						
						if (formattedCandles.length === 0) {
							throw new Error(`No se pudieron formatear los datos históricos para ${coin}. Formato de respuesta no reconocido.`);
						}
						
						return { coin, candles: formattedCandles, success: true };
					} catch (err) {
						console.error(`[MarketLineApex] Error fetching candles for ${coin}:`, err);
						return { coin, candles: [], success: false, error: err.message || 'Error desconocido' };
					}
				});
				
				const results = await Promise.all(promises);
				const dataMap = {};
				const failed = [];
				
				results.forEach(({ coin, candles, success, error }) => {
					if (success && candles.length > 0) {
						dataMap[coin] = candles;
					} else {
						failed.push({ coin, error });
					}
				});
				
				console.log('[MarketLineApex] Final candles data:', dataMap);
				console.log('[MarketLineApex] Failed coins:', failed);
				
				setFailedCoins(failed);
				
				if (Object.keys(dataMap).length === 0) {
					const errorMsg = failed.length > 0 
						? `Error al cargar datos: ${failed.map(f => `${f.coin} (${f.error})`).join(', ')}`
						: 'No se encontraron datos para las monedas seleccionadas';
					setError(errorMsg);
				} else if (failed.length > 0) {
					const warningMsg = `Algunas monedas no se pudieron cargar: ${failed.map(f => f.coin).join(', ')}. Mostrando solo las disponibles.`;
					console.warn('[MarketLineApex]', warningMsg);
				}
				
				setCandlesData(dataMap);
			} catch (err) {
				console.error('[MarketLineApex] Error fetching all candles:', err);
				setError(err.message || 'Error al cargar datos del gráfico');
			} finally {
				setLoading(false);
			}
		};
		
		fetchAllCandles();
	}, [validCoins, interval, limit, selectedCoins, availableCoins]);
	
	// format data for apexcharts when candles are loaded
	useEffect(() => {
		if (loading || !validCoins || validCoins.length === 0) {
			return;
		}
		
		// format candles for apexcharts - only include coins with valid data
		const formattedSeries = validCoins
			.filter(coin => candlesData[coin] && candlesData[coin].length > 0)
			.map((coin, index) => {
				const candles = candlesData[coin] || [];
			
			// extract close prices for line chart
			const prices = candles.map(candle => parseFloat(candle.close || 0)).filter(p => p > 0);
			
			if (prices.length === 0) {
				// if no data, use empty array (will show loading or error)
				return {
					name: `series${index + 1}`,
					data: []
				};
			}
			
			// group prices by period (weekly/daily/yearly)
			let groupedPrices = [];
			if (timeframe === 'Weekly') {
				const chunkSize = Math.max(1, Math.floor(prices.length / 10));
				for (let i = 0; i < prices.length; i += chunkSize) {
					const chunk = prices.slice(i, i + chunkSize);
					if (chunk.length > 0) {
						const avg = chunk.reduce((sum, p) => sum + p, 0) / chunk.length;
						// keep prices in full value, not divided (will format in formatter)
						groupedPrices.push(avg);
					}
				}
			} else if (timeframe === 'Daily') {
				groupedPrices = prices.slice(0, 24);
			} else {
				const chunkSize = Math.max(1, Math.floor(prices.length / 12));
				for (let i = 0; i < prices.length; i += chunkSize) {
					const chunk = prices.slice(i, i + chunkSize);
					if (chunk.length > 0) {
						const avg = chunk.reduce((sum, p) => sum + p, 0) / chunk.length;
						groupedPrices.push(avg);
					}
				}
			}
			
			// pad or trim to match labels length
			const labelsLength = timeframe === 'Weekly' ? 10 : timeframe === 'Daily' ? 24 : 12;
			if (groupedPrices.length === 0 && prices.length > 0) {
				// if no grouped prices but we have raw prices, use first price as default
				const defaultPrice = prices[0];
				while (groupedPrices.length < labelsLength) {
					groupedPrices.push(defaultPrice);
				}
			} else {
				while (groupedPrices.length < labelsLength) {
					const lastPrice = groupedPrices[groupedPrices.length - 1];
					groupedPrices.push(lastPrice || (prices.length > 0 ? prices[0] : 0));
				}
			}
			groupedPrices = groupedPrices.slice(0, labelsLength);
			
				return {
					name: coin,
					data: groupedPrices
				};
			});
		
		setSeries(formattedSeries);
	}, [validCoins, timeframe, candlesData, loading]);
	
	// generate week labels based on timeframe
	const getCategories = () => {
		if (timeframe === 'Weekly') {
			return ["Week 01","Week 02","Week 03","Week 04","Week 05","Week 06","Week 07","Week 08","Week 09","Week 10"];
		} else if (timeframe === 'Daily') {
			return Array.from({ length: 24 }, (_, i) => `Hour ${String(i + 1).padStart(2, '0')}`);
		} else {
			return ["Month 01","Month 02","Month 03","Month 04","Month 05","Month 06","Month 07","Month 08","Month 09","Month 10","Month 11","Month 12"];
		}
	};
	
	const options = {
		chart: {
			height: 350,
			type: "line",
			toolbar: {
				show: false,
			},
		},
		colors:["#2258BF","#FF7213"],
		dataLabels: {
			enabled: false
		},
		stroke: {
			curve: 'smooth',
			width: 10,
		},
		legend:{
			show:false
		},
		grid:{
			borderColor: '#AFAFAF',
			strokeDashArray: 10,
		},
		yaxis: {
			labels: {
				style: {
					colors: '#787878',
					fontSize: '13px',
					fontFamily: 'Poppins',
					fontWeight: 400
				},
				formatter: function (value) {
					// format price: if >= 1000, show as k (thousands), else show as is
					if (value >= 1000) {
						return (value / 1000).toFixed(1) + "k";
					} else if (value >= 1) {
						return value.toFixed(2);
					} else {
						return value.toFixed(4);
					}
				}
			},
		},
		xaxis: {
			categories: getCategories(),
			labels:{
				style: {
					colors: '#787878',
					fontSize: '13px',
					fontFamily: 'Poppins',
					fontWeight: 400
				},
			},
			axisBorder:{
				show:false,  
			},
			axisTicks:{
				show: false,
			},
		},
		tooltip: {
			x: {
				format: 'dd/MM/yy HH:mm'
			},
		},
	};
	
	if (loading) {
		return (
			<div className="d-flex align-items-center justify-content-center" style={{height: 350}}>
				<div className="text-center">
					<div className="spinner-border text-primary" role="status">
						<span className="visually-hidden">Cargando...</span>
					</div>
					<p className="mt-2 text-muted small">Cargando datos de Hyperliquid...</p>
				</div>
			</div>
		);
	}
	
	if (error && series.length === 0) {
		return (
			<div className="d-flex align-items-center justify-content-center" style={{height: 350}}>
				<div className="text-center">
					<i className="fa fa-exclamation-triangle fa-2x text-warning mb-2"></i>
					<p className="text-muted small mb-1">{error}</p>
					<p className="text-muted small">Los datos son públicos, no se requiere wallet</p>
					{failedCoins.length > 0 && (
						<p className="text-muted small mt-2">
							Monedas no disponibles: {failedCoins.map(f => f.coin).join(', ')}
						</p>
					)}
				</div>
			</div>
		);
	}
	
	if (!series || series.length === 0 || series.every(s => !s.data || s.data.length === 0)) {
		return (
			<div className="d-flex align-items-center justify-content-center" style={{height: 350}}>
				<div className="text-center">
					<i className="fa fa-chart-line fa-2x text-muted mb-2"></i>
					<p className="text-muted small mb-1">No hay datos disponibles</p>
					<p className="text-muted small">Selecciona monedas para ver el gráfico</p>
				</div>
			</div>
		);
	}
	
	return (
		<div>
			{failedCoins.length > 0 && series.length > 0 && (
				<div className="alert alert-warning alert-dismissible fade show mb-3" role="alert">
					<small>
						<strong>Advertencia:</strong> Las siguientes monedas no están disponibles: {failedCoins.map(f => f.coin).join(', ')}
					</small>
					<button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
				</div>
			)}
			<div id="chart">
				<ReactApexChart
					options={options}
					series={series}
					type="line"
					height={350}
				/>
			</div>
		</div>
	);
};

export default MarketLineApex;
