import React, { useState, useCallback, useEffect } from "react";
import OrderForm from "../../components/trading/OrderForm";
import OrderBook from "../../components/trading/OrderBook";
import ChartWrapper from "../../components/trading/ChartWrapper";
import PairsModal from "../../components/trading/PairsModal";
import HyperliquidNav from "../../components/trading/HyperliquidNav";
import TradingPairHeader from "../../components/trading/TradingPairHeader";
import { HyperliquidTradingProvider } from "../../components/trading/context/HyperliquidTradingProvider";
import "../../components/trading/hyperliquid-theme.css";
import "../../components/trading/TradingComponents.css";
import "../../components/trading/responsive-adjustments.css";
import "./TradingPage.css";

const TradingPage = () => {
  const [showPairs, setShowPairs] = useState(false);
  const togglePairs = useCallback(() => setShowPairs((s) => !s), []);

  // Cerrar con ESC
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setShowPairs(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <HyperliquidTradingProvider>
      <HyperliquidNav />
      <TradingPairHeader />
      <div className="trading-page-content">

        {/* Layout estilo Hyperliquid: Chart izquierda | OrderForm + OrderBook + Trades derecha */}
        <div className="trading-main-layout">
          
          {/* COLUMNA IZQUIERDA: Chart (70%) */}
          <div className="trading-chart-column">
            <div className="chart-container">
              <ChartWrapper />
            </div>
          </div>

          {/* COLUMNA DERECHA: OrderForm + OrderBook (con Trades integrado) */}
          <div className="trading-side-column">
            
            {/* Order Form */}
            <div className="side-panel order-form-panel">
              <OrderForm />
            </div>

            {/* OrderBook con Trades integrado */}
            <div className="side-panel orderbook-trades-panel">
              <OrderBook />
            </div>

          </div>

        </div>

        {/* Modal Pares & Precio */}
        {showPairs && <PairsModal onClose={togglePairs} />}
      </div>
    </HyperliquidTradingProvider>
  );
};

export default TradingPage;
