import React, { useState, useCallback, useEffect } from "react";
import OrderForm from "../../components/trading/OrderForm";
import OrderBook from "../../components/trading/OrderBook";
import TradesTicker from "../../components/trading/TradesTicker";
import PriceTicker from "../../components/trading/PriceTicker";
import ChartWrapper from "../../components/trading/ChartWrapper";
import PairsModal from "../../components/trading/PairsModal";
import { MockTradingDataProvider } from "../../components/trading/context/MockTradingDataProvider";

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
    <MockTradingDataProvider>
      <div className="page-content">
        {/* Header */}
        <div className="d-flex align-items-center mb-3 flex-wrap gap-3">
          <h2 className="font-w600 mb-0 me-auto mb-2">Trading</h2>
          <button
            type="button"
            onClick={togglePairs}
            className="btn btn-sm btn-outline-primary"
          >
            {showPairs ? "Cerrar Pares" : "Pares & Precio"}
          </button>
          <div className="d-none d-md-flex align-items-center gap-2">
            <PriceTicker />
          </div>
        </div>

        {/* Chart full width */}
        <div className="row">
          <div className="col-12 mb-3">
            <div
              style={{ height: "60vh", minHeight: 420 }}
              className="bg-dark-subtle rounded position-relative p-2"
            >
              <ChartWrapper />
            </div>
          </div>
        </div>
        {/* Paneles inferiores */}
        <div className="row g-3">
          <div className="col-12 col-lg-4 d-flex">
            <div className="flex-grow-1 d-flex">
              <OrderBook />
            </div>
          </div>
          <div className="col-12 col-lg-4 d-flex">
            <div className="flex-grow-1 d-flex">
              <TradesTicker />
            </div>
          </div>
          <div className="col-12 col-lg-4 d-flex">
            <div className="flex-grow-1 d-flex">
              <OrderForm />
            </div>
          </div>
        </div>

        <p className="text-muted small mt-3">
          Datos simulados actualizándose para validar layout y UX. Layout
          vertical (chart arriba) en iteración inicial responsive.
        </p>

        {/* Modal Pares & Precio */}
        {showPairs && <PairsModal onClose={togglePairs} />}
      </div>
    </MockTradingDataProvider>
  );
};

export default TradingPage;
