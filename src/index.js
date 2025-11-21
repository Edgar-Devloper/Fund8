import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { WalletProvider } from './context/WalletContext.js';
import { NotificationProvider } from './context/NotificationContext.js';
import ThemeContext from './context/ThemeContext';
import Markup from './jsx/index';
import './vendor/bootstrap-select/dist/css/bootstrap-select.min.css';
import './css/style.css';
import './scss/main.scss';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <ThemeContext>
          <NotificationProvider>
            <WalletProvider>
              <Markup />
            </WalletProvider>
          </NotificationProvider>
        </ThemeContext>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);

