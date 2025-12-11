import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTradingData } from './context/HyperliquidTradingProvider';
import { getCoinIcon, localIconMap, hasLocalIcon } from '../../../utils/coinIcons';
import { useNFT } from '../../../context/NFTContext';
import { useTranslation } from 'react-i18next';
import NFTSelectionModal from '../NFTSelectionModal';
import { getNftMetadata, getImageUrl } from '../../../utils/nftUtils';
import './TradingPairHeader.css';
import './animations.css';

// Importar icono BTC como fallback
import btcIcon from '../../../images/icons/btc.png';

const CoinIcon = ({ symbol, className, alt }) => {
  const normalized = symbol?.toUpperCase() || '';
  const localIcon = localIconMap[normalized];

  if (!localIcon) {
    return null;
  }

  return (
    <img
      src={localIcon}
      alt={alt || symbol}
      className={className}
    />
  );
};

const TradingPairHeader = () => {
  const { selectedSymbol, tickers, setSelectedSymbol } = useTradingData();
  const { selectedNFT } = useNFT();
  const { t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNFTModal, setShowNFTModal] = useState(false);
  const [nftImageUrl, setNftImageUrl] = useState(null);
  const [nftMetadata, setNftMetadata] = useState(null);
  const dropdownRef = useRef(null);
  const selectorRef = useRef(null);
  const prevPriceRef = useRef(0);
  const [priceAnimation, setPriceAnimation] = useState('');
  
  // Estados para el dropdown mejorado
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Futures'); // 'Favorites', 'Futures', 'Spot'
  const [activeFilter, setActiveFilter] = useState('All markets'); // 'All markets', 'New', 'Pre-launch' (RWA y Stocks no disponibles en Hyperliquid)
  const [favorites, setFavorites] = useState([]);

  // Encontrar el ticker actual
  const currentTicker = tickers?.find(t => t.symbol === selectedSymbol) || {
    symbol: 'BTC/USDC',
    last: 0,
    change24h: 0,
    change24hPercent: 0,
    volume24h: 0,
    high24h: 0,
    low24h: 0,
    marketCap: 0
  };

  // Usar el porcentaje de cambio ya calculado
  const changePercent = (currentTicker.change24hPercent || 0).toFixed(2);
  const isPositive = parseFloat(currentTicker.change24h) >= 0;
  
  // Actualizar título de la pestaña del navegador con el trading pair y precio (como Asterdex)
  useEffect(() => {
    if (currentTicker.symbol && currentTicker.last) {
      const price = currentTicker.last >= 1000 
        ? currentTicker.last.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : currentTicker.last.toFixed(4);
      document.title = `${price} ${currentTicker.symbol} | Fund8`;
    } else {
      document.title = 'Fund8: Trading Portal';
    }
    
    // Cleanup: restaurar título original al desmontar
    return () => {
      document.title = 'Fund8: Trading Portal';
    };
  }, [currentTicker.symbol, currentTicker.last]);

  // Animate price changes
  useEffect(() => {
    const currentPrice = currentTicker.last || 0;
    if (prevPriceRef.current !== 0 && prevPriceRef.current !== currentPrice) {
      const direction = currentPrice > prevPriceRef.current ? 'up' : 'down';
      setPriceAnimation(direction);
      setTimeout(() => setPriceAnimation(''), 500);
    }
    prevPriceRef.current = currentPrice;
  }, [currentTicker.last]);

  // Formatear números grandes (volumen, market cap)
  const formatLargeNumber = (num) => {
    if (!num) return '$0';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  // Market cap viene del ticker ahora
  const marketCap = currentTicker.marketCap || 0;

  const coinSymbol = currentTicker.symbol ? currentTicker.symbol.split('/')[0] : 'BTC';
  const currentIcon = getCoinIcon(coinSymbol) || btcIcon;

  // Load NFT image - optimized for faster switching
  useEffect(() => {
    // Clear previous image immediately when NFT changes
    setNftImageUrl(null);
    setNftMetadata(null);
    
    if (selectedNFT && selectedNFT.ipfsLink) {
      const loadImage = async () => {
        try {
          // Try to get direct image URL first (faster)
          const directUrl = getImageUrl(selectedNFT.ipfsLink, selectedNFT.tokenId);
          
          // If it's a JSON metadata link, fetch metadata
          if (selectedNFT.ipfsLink.includes('.json')) {
            try {
              const meta = await getNftMetadata(selectedNFT.ipfsLink);
              if (meta && meta.image) {
                setNftMetadata(meta);
                // Use metadata image if available, otherwise use direct URL
                setNftImageUrl(meta.image || directUrl);
              } else {
                setNftImageUrl(directUrl);
              }
            } catch (metaError) {
              // If metadata fetch fails, use direct URL
              setNftImageUrl(directUrl);
            }
          } else {
            // Direct image URL
            setNftImageUrl(directUrl);
          }
        } catch (error) {
          console.error('[TradingPairHeader] Error loading NFT image:', error);
          const url = getImageUrl(selectedNFT.ipfsLink, selectedNFT.tokenId);
          setNftImageUrl(url);
        }
      };
      loadImage();
    }
  }, [selectedNFT?.tokenId, selectedNFT?.ipfsLink]); // Only depend on tokenId and ipfsLink, not the whole object

  const toggleDropdown = (e) => {
    if (e) {
      e.stopPropagation();
    }
    console.log('Toggle dropdown, current state:', showDropdown);
    setShowDropdown(prev => !prev);
  };

  const closeDropdown = (e) => {
    if (e) {
      e.stopPropagation();
    }
    console.log('Close dropdown');
    setShowDropdown(false);
  };

  const handleItemClick = (symbol, e) => {
    if (e) {
      e.stopPropagation();
    }
    console.log('Select pair:', symbol);
    setSelectedSymbol(symbol);
    setShowDropdown(false);
    setSearchQuery('');
  };

  // Función para alternar favoritos
  const toggleFavorite = (symbol, e) => {
    if (e) {
      e.stopPropagation();
    }
    setFavorites(prev => {
      if (prev.includes(symbol)) {
        return prev.filter(s => s !== symbol);
      } else {
        return [...prev, symbol];
      }
    });
  };

  // Filtrar y ordenar tickers según búsqueda, tab activo y filtro
  const filteredTickers = useMemo(() => {
    let filtered = tickers || [];
    
    filtered = filtered.filter(ticker => {
      const coinSymbol = ticker.symbol.split('/')[0];
      return hasLocalIcon(coinSymbol);
    });

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ticker => 
        ticker.symbol.toLowerCase().includes(query)
      );
    }

    // Filtrar por tab activo (por ahora todos son Futures/Perpetual)
    // En el futuro se podría diferenciar entre Futures y Spot
    if (activeTab === 'Spot') {
      // Por ahora no hay pares Spot, mostrar vacío
      filtered = [];
    }

    // Filtrar por sub-filtro
    if (activeFilter === 'New') {
      // Filtrar por pares nuevos - volumen bajo (< 10M USDT) indica mercados nuevos
      filtered = filtered.filter(ticker => {
        const vol = ticker.volume24h || 0;
        return vol > 0 && vol < 10000000; // Menos de 10M USDT
      });
    } else if (activeFilter === 'Pre-launch') {
      // Filtrar pre-lanzamiento - mercados con volumen muy bajo o cero
      filtered = filtered.filter(ticker => {
        const vol = ticker.volume24h || 0;
        return vol === 0 || vol < 1000; // Volumen casi cero
      });
    }
    // 'All markets' muestra todos (no filtra)

    // Ordenar por Last Price de mayor a menor
    filtered = filtered.sort((a, b) => (b.last || 0) - (a.last || 0));

    // Si está en Favorites, mostrar solo favoritos
    if (activeTab === 'Favorites') {
      filtered = filtered.filter(ticker => favorites.includes(ticker.symbol));
    }

    return filtered;
  }, [tickers, searchQuery, activeTab, activeFilter, favorites]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        selectorRef.current &&
        !selectorRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      // Add delay to prevent immediate close
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [showDropdown]);

  return (
    <div className="trading-pair-header">
      {/* Pair Selector */}
      <div className={`pair-selector-container ${showDropdown ? 'dropdown-open' : ''}`}>
        {/* Overlay for mobile */}
        {showDropdown && (
          <div 
            className="dropdown-overlay-mobile" 
            onClick={closeDropdown}
          />
        )}
        
        <button 
          ref={selectorRef}
          className="pair-selector" 
          onClick={toggleDropdown}
          type="button"
          style={{ 
            cursor: 'pointer', 
            userSelect: 'none', 
            WebkitTapHighlightColor: 'transparent',
            border: 'none',
            outline: 'none'
          }}
        >
          <img 
            src={currentIcon} 
            alt={coinSymbol}
            className="pair-icon"
          />
          <span className="pair-symbol">{currentTicker.symbol}</span>
          <span className="pair-badge">Spot</span>
          <span className="pair-arrow">▾</span>
        </button>

        {showDropdown && (
          <div ref={dropdownRef} className="pair-dropdown enhanced-dropdown">
            {/* Barra de búsqueda */}
            <div className="dropdown-header">
              <div className="search-container">
                <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 14L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input 
                  type="text" 
                  placeholder="Search" 
                  className="dropdown-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Pestañas principales */}
            <div className="dropdown-tabs">
              <button
                className={`tab-button ${activeTab === 'Favorites' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('Favorites');
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 0L8.57143 5.14286L14 5.71429L10 9.14286L11.1429 14L7 11.1429L2.85714 14L4 9.14286L0 5.71429L5.42857 5.14286L7 0Z" fill={activeTab === 'Favorites' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                </svg>
                Favorites
              </button>
              <button
                className={`tab-button ${activeTab === 'Futures' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('Futures');
                }}
              >
                Futures
              </button>
              <button
                className={`tab-button ${activeTab === 'Spot' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('Spot');
                }}
              >
                Spot
              </button>
            </div>

            {/* Sub-pestañas/Filtros */}
            <div className="dropdown-filters-container">
              <div className="dropdown-filters">
                {/* Solo mostrar filtros disponibles - Hyperliquid no tiene stocks */}
                {/* RWA no se muestra ya que Hyperliquid no tiene metadata para identificarlo */}
                {['All markets', 'New', 'Pre-launch'].map(filter => (
                  <button
                    key={filter}
                    className={`filter-button ${activeFilter === filter ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveFilter(filter);
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Encabezados de columna */}
            <div className="dropdown-column-headers">
              <div className="header-cell symbol-header">SYMBOLS / VOLUME</div>
              <div className="header-cell">LAST PRICE</div>
              <div className="header-cell">24H CHANGE</div>
              <div className="header-cell">FUNDING RATE</div>
            </div>

            {/* Lista de pares */}
            <div className="dropdown-list">
              {filteredTickers.length > 0 ? (
                filteredTickers.map(ticker => {
                  const changePercent = (ticker.change24hPercent || 0).toFixed(2);
                  const isPositive = parseFloat(changePercent) >= 0;
                  const tickerCoin = ticker.symbol.split('/')[0];
                  const isFavorite = favorites.includes(ticker.symbol);
                  const isSelected = ticker.symbol === selectedSymbol;
                  
                  // Formatear volumen (en USDT)
                  const formatVolume = (vol) => {
                    if (!vol || vol === 0) return '0';
                    if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
                    if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
                    if (vol >= 1e3) return `${(vol / 1e3).toFixed(2)}K`;
                    return vol.toLocaleString('en-US', { maximumFractionDigits: 2 });
                  };

                  // Funding rate desde Hyperliquid (ctx.funding viene como decimal)
                  const fundingRateValue = ticker.fundingRate || 0;
                  const fundingRate = fundingRateValue ? `${(fundingRateValue * 100).toFixed(4)}%` : '0.0000%';
                  
                  return (
                    <button 
                      key={ticker.symbol}
                      className={`dropdown-item enhanced-item ${isSelected ? 'selected' : ''}`}
                      onClick={(e) => handleItemClick(ticker.symbol, e)}
                      type="button"
                    >
                      {/* Columna 1: Icono, Símbolo, Apalancamiento, Volumen */}
                      <div className="item-column symbol-column">
                        <div className="item-icon-wrapper">
                          <CoinIcon 
                            symbol={tickerCoin}
                            className="dropdown-item-icon"
                            alt={tickerCoin}
                          />
                          <button
                            className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                            onClick={(e) => toggleFavorite(ticker.symbol, e)}
                            type="button"
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill={isFavorite ? 'currentColor' : 'none'}>
                              <path d="M6 0L7.34694 4.55453L12 4.2918L8.70711 7.12132L9.7082 12L6 9.55453L2.2918 12L3.29289 7.12132L0 4.2918L4.65306 4.55453L6 0Z" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                        <div className="item-symbol-info">
                          <div className="item-symbol-row">
                            <span className="item-symbol">{tickerCoin}</span>
                            <span className="item-leverage">20x</span>
                          </div>
                          <span className="item-volume">{formatVolume(ticker.volume24h)} USDT</span>
                        </div>
                      </div>

                      {/* Columna 2: Último precio */}
                      <div className="item-column price-column" style={{ display: 'flex', justifyContent: 'flex-end', minWidth: '120px' }}>
                        <span className="item-price" style={{ display: 'block', visibility: 'visible', opacity: 1 }}>
                          ${ticker.last ? ticker.last.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                        </span>
                      </div>

                      {/* Columna 3: Cambio 24h */}
                      <div className="item-column change-column" style={{ display: 'flex', justifyContent: 'flex-end', minWidth: '100px' }}>
                        <span className={`item-change ${isPositive ? 'positive' : 'negative'}`} style={{ display: 'block', visibility: 'visible', opacity: 1 }}>
                          {isPositive ? '+' : ''}{changePercent}%
                        </span>
                      </div>

                      {/* Columna 4: Funding Rate */}
                      <div className="item-column funding-column">
                        <span className="item-funding">{fundingRate}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="dropdown-empty">
                  <p>No pairs found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Current Price */}
      <div className="price-display">
        <span className="price-label">Price</span>
        <span className={`price-value animated-number ${priceAnimation ? `ticker-${priceAnimation}` : ''}`} style={{
          fontFeatureSettings: "'tnum'",
          letterSpacing: '-0.5px'
        }}>
          ${currentTicker.last.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        {priceAnimation && (
          <span className="price-change-indicator" style={{
            fontSize: '10px',
            marginLeft: '8px',
            opacity: 0.7,
            animation: 'fadeOut 0.5s ease-out'
          }}>
            {priceAnimation === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>

      {/* 24h Change */}
      <div className="stat-item">
        <div className="stat-label">24h Change</div>
        <div className={`stat-value ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '+' : ''}{currentTicker.change24h.toFixed(2)} / {isPositive ? '+' : ''}{changePercent}%
        </div>
      </div>

      {/* 24h High */}
      <div className="stat-item">
        <div className="stat-label">24h High</div>
        <div className="stat-value">${(currentTicker.high24h || currentTicker.last).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>

      {/* 24h Low */}
      <div className="stat-item">
        <div className="stat-label">24h Low</div>
        <div className="stat-value">${(currentTicker.low24h || currentTicker.last).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      </div>

      {/* 24h Volume */}
      <div className="stat-item">
        <div className="stat-label">24h Volume</div>
        <div className="stat-value animated-number">{formatLargeNumber(currentTicker.volume24h)}</div>
      </div>

      {/* Market Cap */}
      <div className="stat-item">
        <div className="stat-label">Market Cap</div>
        <div className="stat-value">{formatLargeNumber(marketCap)}</div>
      </div>

      {/* Data Source Indicator and NFT Account */}
      <div className="header-right-section">
        {/* Data Source Indicator */}
        <div className="data-source-indicator-header">
          <div className="source-badge-header">
            <span className="source-dot-header"></span>
            <span className="source-text-header">Powered by HYPERLIQUID</span>
          </div>
        </div>

        {/* NFT Account Display */}
        {selectedNFT && (
          <div
            className="nft-account-display-header"
            onClick={() => setShowNFTModal(true)}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              marginLeft: '20px',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              overflow: 'hidden',
              background: 'rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            >
              {nftImageUrl ? (
                <img
                  src={nftImageUrl}
                  alt={selectedNFT.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    console.error('[TradingPairHeader] Error loading NFT image:', nftImageUrl);
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <i className="fa fa-image" style={{ fontSize: '14px', color: '#718096' }}></i>
              )}
            </div>
            {/* Tooltip que aparece al hacer hover */}
            <div
              className="nft-tooltip"
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: '8px',
                padding: '8px 12px',
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
                opacity: 0,
                pointerEvents: 'none',
                transition: 'opacity 0.2s ease, transform 0.2s ease',
                transform: 'translateX(-50%) translateY(-4px)',
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: '#e2e8f0',
                  letterSpacing: '0.01em'
                }}>
                  {selectedNFT.name}
                </span>
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: '400', 
                  color: '#94a3b8',
                  letterSpacing: '0.01em'
                }}>
                  #{selectedNFT.tokenId}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NFT Selection Modal */}
      <NFTSelectionModal 
        forceShow={showNFTModal}
        onClose={() => setShowNFTModal(false)}
        onSelect={() => setShowNFTModal(false)}
      />
    </div>
  );
};

export default TradingPairHeader;

