import React, { useState, useEffect, useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import { apiService } from "../../../../api/apiService.js";

// Función de validación síncrona para evitar renderizado con datos inválidos
const validateChartData = (options, series) => {
	try {
		// Validar opciones
		if (!options || typeof options !== 'object') {
			return { valid: false, error: 'Opciones inválidas' };
		}
		
		// Validar series
		if (!Array.isArray(series) || series.length === 0) {
			return { valid: false, error: 'No hay series de datos' };
		}
		
		// Validar cada serie exhaustivamente
		for (let i = 0; i < series.length; i++) {
			const s = series[i];
			
			if (!s || typeof s !== 'object') {
				return { valid: false, error: `Serie ${i} es inválida` };
			}
			
			if (!s.name || typeof s.name !== 'string' || s.name.trim() === '') {
				return { valid: false, error: `Serie ${i} no tiene nombre válido` };
			}
			
			if (!Array.isArray(s.data)) {
				return { valid: false, error: `Serie ${i} no tiene datos array` };
			}
			
			if (s.data.length === 0) {
				return { valid: false, error: `Serie ${i} está vacía` };
			}
			
			// Validar cada punto de datos
			for (let j = 0; j < s.data.length; j++) {
				const d = s.data[j];
				const num = typeof d === 'number' ? d : Number(d);
				
				if (!isFinite(num) || isNaN(num) || num < 0 || num > Number.MAX_SAFE_INTEGER) {
					return { valid: false, error: `Serie ${i}, punto ${j} es inválido: ${d}` };
				}
			}
		}
		
		// Validar opciones de xaxis y categories
		if (options.xaxis && options.xaxis.categories) {
			const maxDataLength = Math.max(...series.map(s => s.data.length));
			if (options.xaxis.categories.length < maxDataLength) {
				console.warn('[SafeApexChart] Categories length mismatch, adjusting...');
			}
		}
		
		// Si llegamos aquí, todos los datos son válidos
		return { valid: true, error: null };
	} catch (err) {
		console.error('[SafeApexChart] Validation error:', err);
		return { valid: false, error: err.message || 'Error de validación' };
	}
};

// Wrapper seguro para ReactApexChart que previene errores de parser
const SafeApexChart = React.memo(({ options, series, type, height }) => {
	// Sanitizar y validar series ANTES de validar
	const sanitizedSeries = React.useMemo(() => {
		if (!Array.isArray(series) || series.length === 0) {
			return null;
		}
		
		try {
			// Sanitizar cada serie y punto de datos
			const sanitized = series.map(s => {
				if (!s || !s.data || !Array.isArray(s.data)) {
					return null;
				}
				
				// Sanitizar cada valor a un número seguro
				const sanitizedData = s.data.map(d => {
					try {
						// Convertir a número
						let num = typeof d === 'number' ? d : parseFloat(d);
						
						// Validar que sea finito
						if (!isFinite(num) || isNaN(num)) {
							return null;
						}
						
						// Validar que sea positivo
						if (num < 0) {
							return null;
						}
						
						// Limitar valores extremos
						if (num > 1e12) {
							num = 1e12;
						}
						
						// Validación adicional: rechazar valores extremos sospechosos
						// Valores como timestamps en milisegundos (13 dígitos) o números extremadamente grandes
						if (num > 1e10 || num.toString().length > 10) {
							console.warn(`[SafeApexChart] Value too large or suspicious: ${num}, capping to 1e10`);
							num = 1e10;
						}
						
						// Usar toFixed y parseFloat para asegurar precisión exacta
						// Esto también previene valores con demasiados decimales
						if (num >= 1000) {
							num = parseFloat(num.toFixed(2));
						} else if (num >= 1) {
							num = parseFloat(num.toFixed(4));
						} else {
							num = parseFloat(num.toFixed(6));
						}
						
						// Validar final después de redondeo
						if (!isFinite(num) || isNaN(num) || num < 0 || num > 1e10) {
							console.warn(`[SafeApexChart] Invalid value after normalization: ${num}`);
							return null;
						}
						
						// Validar que el número no tenga demasiados dígitos (previene valores como 7720843185880994)
						const numStr = num.toString();
						if (numStr.length > 12 || numStr.includes('e')) {
							console.warn(`[SafeApexChart] Value has too many digits or scientific notation: ${numStr}`);
							return null;
						}
						
						return num;
					} catch (err) {
						return null;
					}
				}).filter(d => d !== null && isFinite(d) && d > 0);
				
				if (sanitizedData.length === 0) {
					return null;
				}
				
				return {
					name: String(s.name || ''),
					data: sanitizedData
				};
			}).filter(s => s !== null && s.data && s.data.length > 0);
			
			if (sanitized.length === 0) {
				return null;
			}
			
			return sanitized;
		} catch (err) {
			console.error('[SafeApexChart] Error sanitizing series:', err);
			return null;
		}
	}, [series]);
	
	// Validación SÍNCRONA inmediata antes de renderizar
	const validation = React.useMemo(() => {
		if (!sanitizedSeries) {
			return { valid: false, error: 'Series inválidas' };
		}
		
		try {
			// Validación básica
			const basicValidation = validateChartData(options, sanitizedSeries);
			
			if (!basicValidation.valid) {
				return { valid: false, error: basicValidation.error };
			}
			
			// Todo válido
			return { valid: true, error: null };
		} catch (err) {
			console.error('[SafeApexChart] Validation error:', err);
			return { valid: false, error: err.message || 'Error de validación' };
		}
	}, [options, sanitizedSeries]);
	
	// Validación final adicional: verificar que NO haya valores extremos antes de renderizar
	// DEBE estar ANTES de cualquier return condicional para cumplir con las reglas de hooks
	const hasExtremeValues = React.useMemo(() => {
		if (!sanitizedSeries || !Array.isArray(sanitizedSeries) || sanitizedSeries.length === 0) {
			return true; // No renderizar si no hay series
		}
		
		for (let i = 0; i < sanitizedSeries.length; i++) {
			const s = sanitizedSeries[i];
			if (!s || !s.data || !Array.isArray(s.data) || s.data.length === 0) {
				return true; // No renderizar si alguna serie está vacía
			}
			
			for (let j = 0; j < s.data.length; j++) {
				const value = s.data[j];
				
				// Validar que sea un número válido
				if (typeof value !== 'number' || !isFinite(value) || isNaN(value)) {
					console.warn(`[SafeApexChart] Invalid value type: ${typeof value} = ${value} in series ${i}, point ${j}`);
					return true;
				}
				
				const numStr = value.toString();
				
				// Rechazar valores con más de 12 dígitos o notación científica
				if (numStr.length > 12 || numStr.includes('e') || numStr.includes('E')) {
					console.warn(`[SafeApexChart] Extreme value detected: ${numStr} (${numStr.length} digits) in series ${i}, point ${j}`);
					return true;
				}
				
				// Rechazar valores extremadamente grandes (más seguro que 1e10)
				if (value > 1e8 || value < 0) {
					console.warn(`[SafeApexChart] Value out of range: ${value} in series ${i}, point ${j}`);
					return true;
				}
			}
		}
		
		return false;
	}, [sanitizedSeries]);
	
	// NO renderizar si los datos no son válidos
	if (!validation.valid || !sanitizedSeries) {
		return (
			<div className="d-flex align-items-center justify-content-center" style={{height: height || 350}}>
				<div className="text-center">
					<i className="fa fa-exclamation-triangle fa-2x text-warning mb-2"></i>
					<p className="text-muted small mb-1">{validation.error || 'Datos inválidos'}</p>
					<p className="text-muted small" style={{fontSize: '10px'}}>No se puede renderizar el gráfico</p>
				</div>
			</div>
		);
	}
	
	// NO renderizar si hay valores extremos
	if (hasExtremeValues) {
		return (
			<div className="d-flex align-items-center justify-content-center" style={{height: height || 350}}>
				<div className="text-center">
					<i className="fa fa-exclamation-triangle fa-2x text-warning mb-2"></i>
					<p className="text-muted small mb-1">Datos inválidos detectados</p>
					<p className="text-muted small" style={{fontSize: '10px'}}>Valores extremos en los datos</p>
				</div>
			</div>
		);
	}
	
	// Render con try-catch para manejo de errores
	try {
		// Usar key único que cambia cuando no hay datos válidos para forzar desmontaje completo
		// Esto previene que ApexCharts intente actualizar con datos inválidos
		const chartKey = sanitizedSeries && sanitizedSeries.length > 0 && sanitizedSeries[0]?.data?.length > 0
			? `chart-valid-${sanitizedSeries.map(s => s.name).join('-')}-${sanitizedSeries[0]?.data?.length || 0}`
			: `chart-invalid-${Date.now()}`;
		
		// Si no hay series válidas o tienen datos vacíos, NO renderizar ApexCharts
		if (!sanitizedSeries || sanitizedSeries.length === 0 || sanitizedSeries.every(s => !s.data || s.data.length === 0)) {
			return (
				<div className="d-flex align-items-center justify-content-center" style={{height: height || 350}}>
					<div className="text-center">
						<i className="fa fa-exclamation-triangle fa-2x text-warning mb-2"></i>
						<p className="text-muted small mb-1">No hay datos para mostrar</p>
						<p className="text-muted small" style={{fontSize: '10px'}}>Selecciona monedas para ver el gráfico</p>
					</div>
				</div>
			);
		}
		
		return (
			<ReactApexChart
				options={options}
				series={sanitizedSeries}
				type={type}
				height={height}
				key={chartKey}
			/>
		);
	} catch (renderErr) {
		console.error('[SafeApexChart] Render error:', renderErr);
		return (
			<div className="d-flex align-items-center justify-content-center" style={{height: height || 350}}>
				<div className="text-center">
					<i className="fa fa-exclamation-triangle fa-2x text-warning mb-2"></i>
					<p className="text-muted small mb-1">Error al renderizar el gráfico</p>
					<p className="text-muted small" style={{fontSize: '10px'}}>{renderErr.message || 'Error desconocido'}</p>
				</div>
			</div>
		);
	}
}, (prevProps, nextProps) => {
	// Comparación personalizada para evitar re-renders innecesarios
	if (prevProps.series.length !== nextProps.series.length) return false;
	if (JSON.stringify(prevProps.series) !== JSON.stringify(nextProps.series)) return false;
	if (JSON.stringify(prevProps.options) !== JSON.stringify(nextProps.options)) return false;
	return true;
});

	const MarketLineApex = ({ selectedCoins = ['ETH', 'BTC'], timeframe = 'Weekly' }) => {
	const [series, setSeries] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [candlesData, setCandlesData] = useState({});
	const [availableCoins, setAvailableCoins] = useState([]);
	const [failedCoins, setFailedCoins] = useState([]);
	const [dateLabels, setDateLabels] = useState([]); // Para almacenar etiquetas de fechas reales
	
	// Asegurar que siempre haya al menos una moneda seleccionada
	const safeSelectedCoins = useMemo(() => {
		if (!selectedCoins || !Array.isArray(selectedCoins) || selectedCoins.length === 0) {
			return ['ETH', 'BTC']; // Fallback a monedas por defecto
		}
		return selectedCoins;
	}, [selectedCoins]);
	
	console.log('[MarketLineApex] Component mounted/updated:', { selectedCoins: safeSelectedCoins, timeframe, availableCoins: availableCoins.length });
	
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
				// if fetching available coins fails, use safeSelectedCoins as fallback
				console.warn('[MarketLineApex] Using safeSelectedCoins as fallback:', safeSelectedCoins);
				setAvailableCoins(safeSelectedCoins);
			}
		};
		fetchAvailableCoins();
	}, [safeSelectedCoins]);
	
	// filter selected coins to only include available ones
	const validCoins = useMemo(() => {
		// Usar safeSelectedCoins en lugar de selectedCoins directamente
		if (availableCoins.length === 0) {
			console.log('[MarketLineApex] No available coins yet, using safeSelectedCoins:', safeSelectedCoins);
			return safeSelectedCoins;
		}
		const filtered = safeSelectedCoins.filter(coin => {
			const symbol = coin.toUpperCase();
			return availableCoins.includes(symbol);
		});
		
		// Asegurar que siempre haya al menos una moneda válida
		if (filtered.length === 0 && safeSelectedCoins.length > 0) {
			console.warn('[MarketLineApex] No valid coins found, using first safe selected coin:', safeSelectedCoins[0]);
			return [safeSelectedCoins[0]];
		}
		
		console.log('[MarketLineApex] Valid coins after filtering:', filtered, 'from selected:', safeSelectedCoins, 'available:', availableCoins);
		return filtered.length > 0 ? filtered : safeSelectedCoins;
	}, [safeSelectedCoins, availableCoins]);
	
	// fetch candles for all selected coins
	useEffect(() => {
		console.log('[MarketLineApex] useEffect for fetchCandles triggered:', { validCoins, validCoinsLength: validCoins?.length, availableCoinsLength: availableCoins?.length });
		
		// LIMPIAR DATOS INMEDIATAMENTE si no hay monedas válidas
		if (!validCoins || validCoins.length === 0) {
			console.warn('[MarketLineApex] No valid coins to fetch, clearing data IMMEDIATELY...');
			// Limpiar todo inmediatamente para prevenir renderizado con datos inválidos
			setSeries([]);
			setCandlesData({});
			setFailedCoins([]);
			setLoading(false);
			setError(null);
			return; // No intentar cargar datos si no hay monedas válidas
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
						// Hyperliquid devuelve: [[timestamp_ms, open, high, low, close], ...]
						const formattedCandles = candles
							.map((candle, idx) => {
								try {
									let time, open, high, low, close;
									
									// if array format [timestamp, open, high, low, close, volume?]
									if (Array.isArray(candle) && candle.length >= 5) {
										time = candle[0];
										open = candle[1];
										high = candle[2];
										low = candle[3];
										close = candle[4];
									}
									// if object format {t, o, h, l, c, v} or {time, open, high, low, close}
									else if (typeof candle === 'object' && candle !== null) {
										time = candle.t || candle.time || candle.timestamp || candle[0];
										open = candle.o || candle.open || candle[1];
										high = candle.h || candle.high || candle[2];
										low = candle.l || candle.low || candle[3];
										close = candle.c || candle.close || candle[4];
									} else {
										console.warn(`[MarketLineApex] Invalid candle format at index ${idx} for ${coin}:`, candle);
										return null;
									}
									
									// Validate and parse values - ensure all are valid numbers
									const parsedTime = typeof time === 'number' ? time : parseFloat(time);
									const parsedOpen = typeof open === 'number' ? open : parseFloat(open || '0');
									const parsedHigh = typeof high === 'number' ? high : parseFloat(high || '0');
									const parsedLow = typeof low === 'number' ? low : parseFloat(low || '0');
									const parsedClose = typeof close === 'number' ? close : parseFloat(close || '0');
									
									// Validate that all values are finite numbers
									if (!isFinite(parsedTime) || !isFinite(parsedOpen) || !isFinite(parsedHigh) || 
										!isFinite(parsedLow) || !isFinite(parsedClose)) {
										console.warn(`[MarketLineApex] Invalid numeric values in candle ${idx} for ${coin}:`, {
											time: parsedTime, open: parsedOpen, high: parsedHigh, low: parsedLow, close: parsedClose
										});
										return null;
									}
									
									// Validate OHLC relationships
									if (parsedOpen <= 0 || parsedHigh <= 0 || parsedLow <= 0 || parsedClose <= 0) {
										console.warn(`[MarketLineApex] Invalid OHLC values (<= 0) in candle ${idx} for ${coin}`);
										return null;
									}
									
									if (parsedHigh < parsedLow || parsedHigh < parsedOpen || parsedHigh < parsedClose ||
										parsedLow > parsedOpen || parsedLow > parsedClose) {
										console.warn(`[MarketLineApex] Invalid OHLC relationships in candle ${idx} for ${coin}`);
										return null;
									}
									
									// Convert time from milliseconds to seconds if needed (Hyperliquid uses milliseconds)
									// ApexCharts expects timestamp, but lightweight-charts expects seconds
									// For ApexCharts, we keep as-is or convert to Date
									const normalizedTime = parsedTime > 1000000000000 ? parsedTime : parsedTime * 1000;
									
									return {
										time: normalizedTime,
										open: parsedOpen,
										high: parsedHigh,
										low: parsedLow,
										close: parsedClose
									};
								} catch (err) {
									console.warn(`[MarketLineApex] Error formatting candle ${idx} for ${coin}:`, err, candle);
									return null;
								}
							})
							.filter(c => c !== null && c.time && c.close > 0 && c.open > 0);
						
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
		// Si no hay monedas válidas, limpiar series INMEDIATAMENTE
		if (!validCoins || validCoins.length === 0) {
			console.log('[MarketLineApex] No valid coins, clearing series IMMEDIATELY...');
			setSeries([]);
			setCandlesData({});
			return;
		}
		
		// Si no hay datos de velas para las monedas válidas, limpiar series
		const hasValidCandleData = validCoins.some(coin => candlesData[coin] && Array.isArray(candlesData[coin]) && candlesData[coin].length > 0);
		if (!hasValidCandleData && !loading) {
			console.log('[MarketLineApex] No valid candle data, clearing series...');
			setSeries([]);
			return;
		}
		
		if (loading) {
			return;
		}
		
		// format candles for apexcharts - only include coins with valid data
		try {
			const formattedSeries = validCoins
				.filter(coin => candlesData[coin] && candlesData[coin].length > 0)
				.map((coin, index) => {
					try {
						const candles = candlesData[coin] || [];
					
					// extract close prices for line chart - validate and normalize IMMEDIATELY
					const MAX_SAFE_VALUE = 1e12; // Límite máximo seguro para ApexCharts
					
					const prices = candles
						.map((candle, idx) => {
							try {
								let close;
								
								// Handle array format [time, open, high, low, close]
								if (Array.isArray(candle)) {
									close = candle[4] || candle[1];
								}
								// Handle object format
								else if (typeof candle === 'object' && candle !== null) {
									close = candle.close || candle.c || candle[4];
								}
								else {
									console.warn(`[MarketLineApex] Invalid candle format in prices extraction at index ${idx}:`, candle);
									return null;
								}
								
								// Validate and parse
								let price = typeof close === 'number' ? close : parseFloat(close);
								
								// Validate it's a finite number
								if (!isFinite(price) || isNaN(price)) {
									console.warn(`[MarketLineApex] Invalid price (NaN/Infinity) at index ${idx}:`, price, 'from candle:', candle);
									return null;
								}
								
								// Validate it's positive
								if (price <= 0) {
									console.warn(`[MarketLineApex] Invalid price (non-positive) at index ${idx}:`, price);
									return null;
								}
								
								// Validación adicional: rechazar valores extremos ANTES de normalizar
								// Valores como 7720843185880994 tienen 16 dígitos - rechazarlos completamente
								const priceStr = price.toString();
								if (priceStr.length > 12 || priceStr.includes('e') || priceStr.includes('E') || price > 1e10) {
									console.warn(`[MarketLineApex] Extreme value detected BEFORE normalization at index ${idx}: ${price} (${priceStr.length} digits, > 1e10)`);
									return null; // Rechazar completamente en lugar de truncar
								}
								
								// NORMALIZE: Limit extreme values IMMEDIATELY to prevent ApexCharts errors
								if (price > MAX_SAFE_VALUE) {
									console.warn(`[MarketLineApex] Price too large at index ${idx}, capping: ${price} -> ${MAX_SAFE_VALUE}`);
									price = MAX_SAFE_VALUE;
								}
								
								// NORMALIZE: Round to reasonable precision to avoid precision errors
								// This prevents values like "7720843185880994C 23.41239270104" in SVG paths
								// Usar toFixed y parseFloat para asegurar precisión exacta
								if (price >= 1000) {
									price = parseFloat(price.toFixed(2)); // 2 decimales usando toFixed
								} else if (price >= 1) {
									price = parseFloat(price.toFixed(4)); // 4 decimales usando toFixed
								} else {
									price = parseFloat(price.toFixed(6)); // 6 decimales usando toFixed
								}
								
								// Final validation after normalization
								if (!isFinite(price) || isNaN(price) || price <= 0) {
									console.warn(`[MarketLineApex] Invalid price after normalization at index ${idx}:`, price);
									return null;
								}
								
								// Validación final: verificar que no tenga demasiados dígitos después de normalizar
								const normalizedStr = price.toString();
								if (normalizedStr.length > 12 || normalizedStr.includes('e') || normalizedStr.includes('E')) {
									console.warn(`[MarketLineApex] Price still has too many digits after normalization at index ${idx}: ${normalizedStr}`);
									return null;
								}
								
								return price;
							} catch (err) {
								console.warn(`[MarketLineApex] Error extracting price at index ${idx}:`, err);
								return null;
							}
						})
						.filter(p => p !== null && isFinite(p) && p > 0);
						
						if (prices.length === 0) {
							// if no data, return null to filter out
							return null;
						}
						
						// group prices by period (weekly/daily/yearly) - normalize averages IMMEDIATELY
						let groupedPrices = [];
						let groupedLabels = []; // Para almacenar etiquetas de tiempo reales
						
						if (timeframe === 'Weekly') {
							// Obtener timestamps de las velas originales para generar etiquetas reales
							const candles = candlesData[coin] || [];
							const candleTimestamps = candles.map(c => {
								// Extraer timestamp de la vela
								if (Array.isArray(c)) {
									return c[0]; // [timestamp, open, high, low, close]
								} else if (typeof c === 'object' && c !== null) {
									return c.time || c.t || c.timestamp;
								}
								return null;
							}).filter(t => t !== null);
							
							const chunkSize = Math.max(1, Math.floor(prices.length / 10));
							let chunkIndex = 0;
							for (let i = 0; i < prices.length; i += chunkSize) {
								const chunk = prices.slice(i, i + chunkSize).filter(p => isFinite(p) && p > 0);
								if (chunk.length > 0) {
									// Obtener timestamp del inicio del chunk para la etiqueta
									const chunkStartIdx = Math.min(i, candleTimestamps.length - 1);
									const chunkTimestamp = candleTimestamps[chunkStartIdx];
									
									if (chunkTimestamp) {
										const chunkDate = new Date(chunkTimestamp > 1000000000000 ? chunkTimestamp : chunkTimestamp * 1000);
										// Formato: "DD MMM" (día y mes abreviado en español)
										const day = chunkDate.getDate();
										const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
										const month = monthNames[chunkDate.getMonth()];
										groupedLabels.push(`${day} ${month}`);
									} else {
										groupedLabels.push(`Día ${chunkIndex + 1}`);
									}
									chunkIndex++;
									let avg = chunk.reduce((sum, p) => sum + p, 0) / chunk.length;
									
									// Normalize average IMMEDIATELY
									if (!isFinite(avg) || avg <= 0) continue;
									
									// Validar promedio ANTES de normalizar - rechazar valores extremos
									const avgStr = avg.toString();
									if (avgStr.length > 12 || avgStr.includes('e') || avgStr.includes('E') || avg > 1e10) {
										console.warn(`[MarketLineApex] Extreme average detected: ${avgStr} (${avgStr.length} digits), skipping...`);
										continue; // Rechazar este promedio completamente
									}
									
									// Limitar valores extremos
									if (avg > MAX_SAFE_VALUE) {
										console.warn(`[MarketLineApex] Average too large, capping: ${avg} -> ${MAX_SAFE_VALUE}`);
										avg = MAX_SAFE_VALUE;
									}
									
									// Round to reasonable precision usando toFixed para precisión exacta
									if (avg >= 1000) {
										avg = parseFloat(avg.toFixed(2));
									} else if (avg >= 1) {
										avg = parseFloat(avg.toFixed(4));
									} else {
										avg = parseFloat(avg.toFixed(6));
									}
									
									// Validar después de normalizar
									if (!isFinite(avg) || isNaN(avg) || avg <= 0) continue;
									
									const normalizedAvgStr = avg.toString();
									if (normalizedAvgStr.length > 12 || normalizedAvgStr.includes('e') || normalizedAvgStr.includes('E')) {
										console.warn(`[MarketLineApex] Average still has too many digits after normalization: ${normalizedAvgStr}, skipping...`);
										continue; // Rechazar este promedio
									}
									
									if (isFinite(avg) && avg > 0) {
										groupedPrices.push(avg);
									}
								}
							}
						} else if (timeframe === 'Daily') {
							groupedPrices = prices.slice(0, 24).filter(p => isFinite(p) && p > 0);
						} else {
							const chunkSize = Math.max(1, Math.floor(prices.length / 12));
							for (let i = 0; i < prices.length; i += chunkSize) {
								const chunk = prices.slice(i, i + chunkSize).filter(p => isFinite(p) && p > 0);
								if (chunk.length > 0) {
									let avg = chunk.reduce((sum, p) => sum + p, 0) / chunk.length;
									
									// Normalize average IMMEDIATELY
									if (!isFinite(avg) || avg <= 0) continue;
									
									// Validar promedio ANTES de normalizar - rechazar valores extremos
									const avgStr = avg.toString();
									if (avgStr.length > 12 || avgStr.includes('e') || avgStr.includes('E') || avg > 1e10) {
										console.warn(`[MarketLineApex] Extreme average detected: ${avgStr} (${avgStr.length} digits), skipping...`);
										continue; // Rechazar este promedio completamente
									}
									
									// Limitar valores extremos
									if (avg > MAX_SAFE_VALUE) {
										console.warn(`[MarketLineApex] Average too large, capping: ${avg} -> ${MAX_SAFE_VALUE}`);
										avg = MAX_SAFE_VALUE;
									}
									
									// Round to reasonable precision usando toFixed para precisión exacta
									if (avg >= 1000) {
										avg = parseFloat(avg.toFixed(2));
									} else if (avg >= 1) {
										avg = parseFloat(avg.toFixed(4));
									} else {
										avg = parseFloat(avg.toFixed(6));
									}
									
									// Validar después de normalizar
									if (!isFinite(avg) || isNaN(avg) || avg <= 0) continue;
									
									const normalizedAvgStr = avg.toString();
									if (normalizedAvgStr.length > 12 || normalizedAvgStr.includes('e') || normalizedAvgStr.includes('E')) {
										console.warn(`[MarketLineApex] Average still has too many digits after normalization: ${normalizedAvgStr}, skipping...`);
										continue; // Rechazar este promedio
									}
									
									if (isFinite(avg) && avg > 0) {
										groupedPrices.push(avg);
									}
								}
							}
						}
						
						// pad or trim to match labels length - normalize ALL values before adding
						const labelsLength = timeframe === 'Weekly' ? 10 : timeframe === 'Daily' ? 24 : 12;
						
						const normalizeValue = (value) => {
							// Validar valor inicial
							if (!isFinite(value) || isNaN(value) || value <= 0) return null;
							
							// Validar valor ANTES de normalizar - rechazar valores extremos
							const valueStr = value.toString();
							if (valueStr.length > 12 || valueStr.includes('e') || valueStr.includes('E') || value > 1e10) {
								console.warn(`[MarketLineApex] Extreme value in normalizeValue: ${valueStr} (${valueStr.length} digits), rejecting...`);
								return null; // Rechazar completamente
							}
							
							let normalized = value > MAX_SAFE_VALUE ? MAX_SAFE_VALUE : value;
							
							// Round to reasonable precision usando toFixed para precisión exacta
							if (normalized >= 1000) {
								normalized = parseFloat(normalized.toFixed(2));
							} else if (normalized >= 1) {
								normalized = parseFloat(normalized.toFixed(4));
							} else {
								normalized = parseFloat(normalized.toFixed(6));
							}
							
							// Validar después de normalizar
							if (!isFinite(normalized) || isNaN(normalized) || normalized <= 0) return null;
							
							const normalizedStr = normalized.toString();
							if (normalizedStr.length > 12 || normalizedStr.includes('e') || normalizedStr.includes('E')) {
								console.warn(`[MarketLineApex] Value still has too many digits after normalization in normalizeValue: ${normalizedStr}`);
								return null; // Rechazar completamente
							}
							
							return normalized;
						};
						
						if (groupedPrices.length === 0 && prices.length > 0) {
							// if no grouped prices but we have raw prices, use first price as default
							const defaultPrice = normalizeValue(prices.find(p => isFinite(p) && p > 0) || 0);
							if (defaultPrice) {
								while (groupedPrices.length < labelsLength) {
									groupedPrices.push(defaultPrice);
								}
							}
						} else {
							while (groupedPrices.length < labelsLength) {
								const lastPrice = groupedPrices[groupedPrices.length - 1];
								const fallbackPrice = prices.find(p => isFinite(p) && p > 0) || 0;
								const validPrice = normalizeValue(lastPrice || fallbackPrice);
								if (validPrice) {
									groupedPrices.push(validPrice);
								} else {
									// Si no hay precio válido, usar el último válido o el primero
									const backupPrice = groupedPrices.length > 0 
										? groupedPrices[groupedPrices.length - 1]
										: (prices.find(p => isFinite(p) && p > 0) || 1000); // fallback a 1000 si no hay nada
									const normalizedBackup = normalizeValue(backupPrice);
									if (normalizedBackup) {
										groupedPrices.push(normalizedBackup);
									}
								}
							}
						}
						
						// Final normalization and filtering
						groupedPrices = groupedPrices
							.slice(0, labelsLength)
							.map(p => normalizeValue(p))
							.filter(p => p !== null && isFinite(p) && p > 0);
						
						// Ensure we have at least some valid data
						if (groupedPrices.length === 0) {
							return null;
						}
						
						// Guardar las etiquetas de fechas generadas (solo para Weekly, usar la primera moneda que tenga datos)
						if (timeframe === 'Weekly' && groupedLabels.length > 0 && groupedLabels.length === groupedPrices.length) {
							setDateLabels(prev => {
								// Solo actualizar si no hay etiquetas previas o si las nuevas coinciden
								if (prev.length === 0 || prev.length === groupedLabels.length) {
									return groupedLabels;
								}
								return prev;
							});
						}
						
						return {
							name: coin,
							data: groupedPrices
						};
					} catch (err) {
						console.error(`[MarketLineApex] Error formatting data for ${coin}:`, err);
						return null;
					}
				})
				.filter(series => series !== null && series.data && series.data.length > 0);
			
			// Only set series if we have valid data
			if (formattedSeries.length > 0) {
				setSeries(formattedSeries);
			} else {
				console.warn('[MarketLineApex] No valid series data to display');
				setSeries([]);
			}
		} catch (err) {
			console.error('[MarketLineApex] Error formatting series:', err);
			setSeries([]);
		}
	}, [validCoins, timeframe, candlesData, loading]);
	
	// generate labels based on timeframe - memoized for performance
	// Para Weekly: muestra los últimos 7 días divididos en 10 períodos (~16-17 horas cada uno)
	const categories = useMemo(() => {
		if (timeframe === 'Weekly') {
			// Si tenemos etiquetas de fechas reales, usarlas; sino usar las estáticas
			if (dateLabels && dateLabels.length > 0) {
				// Ajustar a 10 elementos si es necesario
				if (dateLabels.length >= 10) {
					return dateLabels.slice(0, 10);
				} else {
					// Completar con etiquetas genéricas si faltan
					const needed = 10 - dateLabels.length;
					return [...dateLabels, ...Array.from({ length: needed }, (_, i) => `Día ${dateLabels.length + i + 1}`)];
				}
			}
			// Fallback: etiquetas genéricas si no hay fechas disponibles
			return ["Día 1", "Día 2", "Día 3", "Día 4", "Día 5", "Día 6", "Día 7", "Día 8", "Día 9", "Día 10"];
		} else if (timeframe === 'Daily') {
			// Para Daily: muestra las últimas 24 horas
			return Array.from({ length: 24 }, (_, i) => `Hora ${String(i + 1).padStart(2, '0')}`);
		} else {
			// Para Yearly: muestra los últimos 12 meses
			return ["Mes 1", "Mes 2", "Mes 3", "Mes 4", "Mes 5", "Mes 6", "Mes 7", "Mes 8", "Mes 9", "Mes 10", "Mes 11", "Mes 12"];
		}
	}, [timeframe, dateLabels]);
	
	// Validate and create options safely - using categories from useMemo above
	const options = useMemo(() => {
		try {
			// Validate categories array
			if (!Array.isArray(categories) || categories.length === 0) {
				console.warn('[MarketLineApex] Invalid categories, using defaults');
				return {
					chart: { type: "line", height: 350, toolbar: { show: false } },
					xaxis: { categories: Array.from({ length: 10 }, (_, i) => `Item ${i + 1}`) }
				};
			}
			
			return {
				chart: {
					height: 350,
					type: "line",
					toolbar: {
						show: false,
					},
					animations: {
						enabled: true,
						easing: 'easeinout',
						speed: 800
					}
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
							try {
								if (!isFinite(value) || value < 0) return '0';
								// format price: if >= 1000, show as k (thousands), else show as is
								if (value >= 1000) {
									return (value / 1000).toFixed(1) + "k";
								} else if (value >= 1) {
									return value.toFixed(2);
								} else {
									return value.toFixed(4);
								}
							} catch (e) {
								return '0';
							}
						}
					},
				},
				xaxis: {
					categories: categories,
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
		} catch (err) {
			console.error('[MarketLineApex] Error creating options:', err);
			// Return minimal safe options
			return {
				chart: { type: "line", height: 350, toolbar: { show: false } },
				xaxis: { categories: [] }
			};
		}
	}, [categories]); // categories already depends on timeframe, so we don't need timeframe here
	
	// Validación final de datos antes de renderizar - SÍNCRONA (DEBE estar antes de cualquier return)
	const finalSeries = useMemo(() => {
		if (!Array.isArray(series) || series.length === 0) {
			return [];
		}
		
		try {
			// Validar y sanitizar series antes de renderizar
			const validSeries = series
				.filter(s => {
					if (!s || typeof s !== 'object') return false;
					if (!s.name || typeof s.name !== 'string' || s.name.trim() === '') return false;
					if (!Array.isArray(s.data)) return false;
					if (s.data.length === 0) return false;
					
					// Validar cada punto de datos
					return s.data.every(d => {
						const value = typeof d === 'number' ? d : parseFloat(d);
						return isFinite(value) && value >= 0 && value < Number.MAX_SAFE_INTEGER;
					});
				})
				.map(s => {
					// Sanitizar datos - LIMITAR valores a un rango razonable para ApexCharts
					const sanitizedData = s.data
						.map(d => {
							try {
								let num = typeof d === 'number' ? d : parseFloat(d);
								
								// Validar que sea un número finito
								if (!isFinite(num) || isNaN(num)) {
									return null;
								}
								
								// Validar que sea positivo
								if (num < 0) {
									return null;
								}
								
								// LIMITAR valores extremos - ApexCharts tiene problemas con números muy grandes
								// Usar un límite razonable (1e12 permite precios de crypto normales)
								const MAX_SAFE_VALUE = 1e12;
								if (num > MAX_SAFE_VALUE) {
									console.warn(`[MarketLineApex] Value too large, capping: ${num} -> ${MAX_SAFE_VALUE}`);
									num = MAX_SAFE_VALUE;
								}
								
								// Redondear a un número razonable de decimales para evitar problemas de precisión
								// Si el número es muy grande, usar menos decimales
								if (num >= 1000) {
									num = Math.round(num * 100) / 100; // 2 decimales
								} else if (num >= 1) {
									num = Math.round(num * 10000) / 10000; // 4 decimales
								} else {
									num = Math.round(num * 1000000) / 1000000; // 6 decimales
								}
								
								// Validar final
								if (!isFinite(num) || num < 0) {
									return null;
								}
								
								return num;
							} catch (err) {
								return null;
							}
						})
						.filter(d => d !== null && isFinite(d) && d > 0);
					
					if (sanitizedData.length === 0) return null;
					
					return {
						name: String(s.name).trim(),
						data: sanitizedData
					};
				})
				.filter(s => s !== null && s.data && s.data.length > 0);
			
			// Normalizar todas las series a la misma longitud (usar la longitud máxima)
			if (validSeries.length > 0) {
				const maxLength = Math.max(...validSeries.map(s => s.data.length));
				
				// Asegurar que todas las series tengan exactamente la misma longitud
				const normalizedSeries = validSeries.map(s => {
					const currentLength = s.data.length;
					if (currentLength === maxLength) {
						return s; // Ya tiene la longitud correcta
					}
					
					// Extender o recortar para coincidir
					let normalizedData = [...s.data];
					
					if (normalizedData.length < maxLength) {
						// Extender con el último valor válido
						const lastValue = normalizedData[normalizedData.length - 1];
						while (normalizedData.length < maxLength) {
							normalizedData.push(lastValue);
						}
					} else {
						// Recortar
						normalizedData = normalizedData.slice(0, maxLength);
					}
					
					return {
						name: s.name,
						data: normalizedData
					};
				});
				
				return normalizedSeries;
			}
			
			return validSeries;
		} catch (err) {
			console.error('[MarketLineApex] Error sanitizing series:', err);
			return [];
		}
	}, [series]);
	
	// Validación final de opciones - SÍNCRONA
	const finalOptions = useMemo(() => {
		if (!options || typeof options !== 'object') {
			return null;
		}
		
		if (!finalSeries || finalSeries.length === 0) {
			return null;
		}
		
		try {
			// Asegurar que TODAS las series tengan la misma longitud
			const maxDataLength = Math.max(...finalSeries.map(s => s.data.length));
			const minDataLength = Math.min(...finalSeries.map(s => s.data.length));
			
			// Si hay diferencias en longitud, normalizar todas las series a la misma longitud
			if (maxDataLength !== minDataLength) {
				console.warn('[MarketLineApex] Series have different lengths, normalizing...', {
					max: maxDataLength,
					min: minDataLength,
					series: finalSeries.map(s => ({ name: s.name, length: s.data.length }))
				});
			}
			
			// Usar la longitud máxima como referencia
			const targetLength = maxDataLength;
			
			// Asegurar que las categorías coincidan EXACTAMENTE con la longitud de los datos
			const categories = options.xaxis?.categories || [];
			let safeCategories;
			
			if (categories.length === targetLength) {
				// Perfecto, coinciden exactamente
				safeCategories = categories;
			} else if (categories.length > targetLength) {
				// Recortar categorías
				safeCategories = categories.slice(0, targetLength);
			} else {
				// Extender categorías
				const needed = targetLength - categories.length;
				safeCategories = [
					...categories,
					...Array.from({ length: needed }, (_, i) => `Item ${categories.length + i + 1}`)
				];
			}
			
			// Asegurar que las categorías tengan exactamente la longitud correcta
			safeCategories = safeCategories.slice(0, targetLength);
			
			return {
				...options,
				xaxis: {
					...options.xaxis,
					categories: safeCategories
				}
			};
		} catch (err) {
			console.error('[MarketLineApex] Error creating final options:', err);
			return null;
		}
	}, [options, finalSeries]);
	
	// Validación final síncrona antes de renderizar - DEBE estar antes de cualquier return
	const isDataReady = useMemo(() => {
		// Si no hay monedas válidas seleccionadas, los datos NO están listos
		if (!validCoins || validCoins.length === 0) {
			console.log('[MarketLineApex] isDataReady: false - no valid coins selected');
			return false;
		}
		
		// Si está cargando, los datos NO están listos
		if (loading) {
			console.log('[MarketLineApex] isDataReady: false - loading');
			return false;
		}
		
		// Si hay error y no hay series, los datos NO están listos
		if (error && series.length === 0) {
			console.log('[MarketLineApex] isDataReady: false - error and no series');
			return false;
		}
		
		// Si no hay series o están vacías, los datos NO están listos
		if (!Array.isArray(series) || series.length === 0 || series.every(s => !s || !s.data || !Array.isArray(s.data) || s.data.length === 0)) {
			console.log('[MarketLineApex] isDataReady: false - no series or empty series', { seriesLength: series?.length, series });
			return false;
		}
		
		// Validar cada serie individualmente
		for (let i = 0; i < series.length; i++) {
			const s = series[i];
			if (!s || typeof s !== 'object' || !s.name || !Array.isArray(s.data) || s.data.length === 0) {
				console.log('[MarketLineApex] isDataReady: false - invalid series at index', i, s);
				return false;
			}
			// Validar cada punto de datos
			for (let j = 0; j < s.data.length; j++) {
				const d = s.data[j];
				const num = typeof d === 'number' ? d : parseFloat(d);
				if (!isFinite(num) || isNaN(num) || num < 0 || num > Number.MAX_SAFE_INTEGER) {
					console.log('[MarketLineApex] isDataReady: false - invalid data point', { series: i, point: j, value: d });
					return false;
				}
			}
		}
		
		// Si no hay series finales válidas o no hay opciones, los datos NO están listos
		if (!Array.isArray(finalSeries) || finalSeries.length === 0 || !finalOptions || typeof finalOptions !== 'object') {
			console.log('[MarketLineApex] isDataReady: false - no final series or options', { finalSeriesLength: finalSeries?.length, hasOptions: !!finalOptions });
			return false;
		}
		
		// Validar que las series finales tienen datos válidos
		for (let i = 0; i < finalSeries.length; i++) {
			const s = finalSeries[i];
			if (!s || typeof s !== 'object' || !s.name || !Array.isArray(s.data) || s.data.length === 0) {
				console.log('[MarketLineApex] isDataReady: false - invalid final series at index', i, s);
				return false;
			}
			// Validar cada punto de datos en series finales
			for (let j = 0; j < s.data.length; j++) {
				const d = s.data[j];
				const num = typeof d === 'number' ? d : parseFloat(d);
				if (!isFinite(num) || isNaN(num) || num < 0 || num > Number.MAX_SAFE_INTEGER) {
					console.log('[MarketLineApex] isDataReady: false - invalid final data point', { series: i, point: j, value: d });
					return false;
				}
			}
		}
		
		// Validar los datos finales con la función de validación
		const validation = validateChartData(finalOptions, finalSeries);
		if (!validation.valid) {
			console.warn('[MarketLineApex] isDataReady: false - validation failed:', validation.error);
			return false;
		}
		
		// Si llegamos aquí, los datos están completamente listos
		console.log('[MarketLineApex] isDataReady: true - all validations passed');
		return true;
	}, [loading, error, series, finalSeries, finalOptions, validCoins]);
	
	// Ahora podemos hacer returns tempranos después de todos los hooks
	if (loading || !isDataReady) {
		return (
			<div className="d-flex align-items-center justify-content-center" style={{height: 350}}>
				<div className="text-center">
					<div className="spinner-border text-primary" role="status">
						<span className="visually-hidden">Cargando...</span>
					</div>
					<p className="mt-2 text-muted small">
						{loading ? 'Cargando datos de Hyperliquid...' : 'Validando datos...'}
					</p>
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
	
	// NO renderizar si no hay datos válidos después de la validación
	if (!finalSeries || finalSeries.length === 0 || !finalOptions) {
		return (
			<div className="d-flex align-items-center justify-content-center" style={{height: 350}}>
				<div className="text-center">
					<i className="fa fa-chart-line fa-2x text-muted mb-2"></i>
					<p className="text-muted small mb-1">No hay datos válidos para mostrar</p>
					<p className="text-muted small">Esperando datos de Hyperliquid...</p>
				</div>
			</div>
		);
	}
	
	// Renderizar solo si TODO está validado y listo
	// Validación final adicional antes de renderizar ApexCharts
	if (!isDataReady || loading || !finalSeries || finalSeries.length === 0 || !finalOptions) {
		return (
			<div className="d-flex align-items-center justify-content-center" style={{height: 350}}>
				<div className="text-center">
					<div className="spinner-border text-primary" role="status">
						<span className="visually-hidden">Preparando...</span>
					</div>
					<p className="mt-2 text-muted small">Preparando gráfico...</p>
				</div>
			</div>
		);
	}
	
	// Validación final síncrona inmediata antes de renderizar
	const finalValidation = validateChartData(finalOptions, finalSeries);
	if (!finalValidation.valid) {
		console.warn('[MarketLineApex] Final validation failed before render:', finalValidation.error);
		return (
			<div className="d-flex align-items-center justify-content-center" style={{height: 350}}>
				<div className="text-center">
					<i className="fa fa-exclamation-triangle fa-2x text-warning mb-2"></i>
					<p className="text-muted small mb-1">Error de validación de datos</p>
					<p className="text-muted small" style={{fontSize: '10px'}}>{finalValidation.error}</p>
				</div>
			</div>
		);
	}
	
	// Renderizar solo si todo está validado
	return (
		<div>
			{failedCoins.length > 0 && finalSeries.length > 0 && (
				<div className="alert alert-warning alert-dismissible fade show mb-3" role="alert">
					<small>
						<strong>Advertencia:</strong> Las siguientes monedas no están disponibles: {failedCoins.map(f => f.coin).join(', ')}
					</small>
					<button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
				</div>
			)}
			<div id="chart">
				<SafeApexChart
					options={finalOptions}
					series={finalSeries}
					type="line"
					height={350}
				/>
			</div>
		</div>
	);
};

export default MarketLineApex;
