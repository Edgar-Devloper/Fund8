import React, { useEffect, useState } from "react";

const SESSION_KEY = "fund8_testnet_login_session";
const SESSION_DURATION_MS = 2 * 24 * 60 * 60 * 1000; // 2 días

// Credenciales hardcodeadas solo para testnet
const DEFAULT_USER = "fund8";
const DEFAULT_PASSWORD = "testnet";

// Se activa solo cuando el entorno de Hyperliquid está en testnet
const IS_TESTNET =
  typeof process !== "undefined" &&
  process.env &&
  process.env.REACT_APP_HYPERLIQUID_ENV === "testnet";

const TestnetAccessGate = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!IS_TESTNET) {
      // En mainnet o entornos distintos de testnet no bloqueamos nada
      setIsAuthorized(true);
      setIsChecking(false);
      return;
    }

    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) {
        setIsChecking(false);
        return;
      }

      const session = JSON.parse(raw);
      const now = Date.now();

      if (
        session &&
        typeof session.expiresAt === "number" &&
        now < session.expiresAt
      ) {
        setIsAuthorized(true);
      } else {
        // Sesión expirada o corrupta
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (e) {
      console.error("[TestnetAccessGate] Error leyendo sesión:", e);
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Permitir override por variables de entorno si existen
    const validUser = process.env.REACT_APP_TESTNET_LOGIN_USER || DEFAULT_USER;
    const validPassword =
      process.env.REACT_APP_TESTNET_LOGIN_PASSWORD || DEFAULT_PASSWORD;

    if (username === validUser && password === validPassword) {
      const now = Date.now();
      const session = {
        username,
        createdAt: now,
        expiresAt: now + SESSION_DURATION_MS,
      };

      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } catch (e) {
        console.error("[TestnetAccessGate] No se pudo guardar la sesión:", e);
      }

      setIsAuthorized(true);
    } else {
      setError("Invalid username or password");
    }
  };

  // Mientras comprobamos la sesión en testnet, evitamos parpadeos
  if (isChecking) {
    return null;
  }

  // Si no es testnet o ya está autorizado, renderizamos la app normal
  if (!IS_TESTNET || isAuthorized) {
    return children;
  }

  // Overlay de login que bloquea toda la app
  return (
    <div className="testnet-login-overlay">
      <div className="testnet-login-modal">
        <div className="testnet-login-header">
          <div className="testnet-login-logo">
            <span className="testnet-logo-mark">F</span>
            <span className="testnet-logo-text">FUND8</span>
          </div>
          <p className="testnet-login-env">Restricted access - Testnet</p>
        </div>

        <div className="testnet-login-body">
          <h2 className="testnet-login-title">Login required</h2>
          <p className="testnet-login-subtitle">
            This version is for testnet use only. Please enter the credentials
            to continue.
          </p>

          <form onSubmit={handleSubmit} className="testnet-login-form">
            <div className="testnet-form-group">
              <label htmlFor="testnet-username">Username</label>
              <input
                id="testnet-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="testnet-input"
                placeholder="fund8"
              />
            </div>

            <div className="testnet-form-group">
              <label htmlFor="testnet-password">Password</label>
              <input
                id="testnet-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="testnet-input"
                placeholder="testnet"
              />
            </div>

            {error && <div className="testnet-error">{error}</div>}

            <button type="submit" className="testnet-login-button">
              Entrar
            </button>

            <p className="testnet-login-hint">
              For internal testnet use only. The session will remain active for{" "}
              <strong>2 days</strong>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TestnetAccessGate;
