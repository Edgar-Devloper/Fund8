import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThirdwebProvider } from 'thirdweb/react';
import { client } from './features/third-web/libs/client.lib';
import { store } from './store/store';
import { WalletProvider } from './context/WalletContext.js';
import ThirdwebSync from './context/ThirdwebSync';
import { AuthProvider } from './context/AuthContext.js';
import { NFTProvider } from './context/NFTContext.js';
import { PlatformProvider } from './context/PlatformContext.js';
import { NotificationProvider } from './context/NotificationContext.js';
import { SettingsProvider } from './context/SettingsContext.js';
import ThemeContext from './context/ThemeContext';
import Markup from './jsx/index';
// CSS esencial para Trading
import './css/style.css';
import './scss/main.scss';
// Inicializar i18n (necesario para traducciones)
import './i18n/config';
// Hyperliquid Theme Global (necesario para Trading)
import './jsx/global-hyperliquid-theme.css';
// Inicializar sistema de versionado de caché
import { initCacheVersion } from './utils/cacheVersion';

// Inicializar sistema de caché al cargar la aplicación
initCacheVersion();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // StrictMode deshabilitado temporalmente para mejorar rendimiento inicial
  // <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        {client && ThirdwebProvider ? (
          <ThirdwebProvider>
            <WalletProvider>
              <ThirdwebSync />
              <PlatformProvider>
                <ThemeContext>
                  <NotificationProvider>
                    <AuthProvider>
                    <NFTProvider>
                    <SettingsProvider>
                      <Markup />
                    </SettingsProvider>
                    </NFTProvider>
                    </AuthProvider>
                  </NotificationProvider>
                </ThemeContext>
              </PlatformProvider>
            </WalletProvider>
          </ThirdwebProvider>
        ) : (
          <ThemeContext>
            <NotificationProvider>
              <WalletProvider>
                <PlatformProvider>
                  <AuthProvider>
                  <NFTProvider>
                  <SettingsProvider>
                    <Markup />
                  </SettingsProvider>
                  </NFTProvider>
                  </AuthProvider>
                </PlatformProvider>
              </WalletProvider>
            </NotificationProvider>
          </ThemeContext>
        )}
      </Provider>
    </BrowserRouter>
  // </React.StrictMode>
);

