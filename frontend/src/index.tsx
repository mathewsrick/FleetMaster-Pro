
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { db } from './services/db';
import './assets/mobile-menu-fix.css';

// Inicializa la base de datos (SQLITE Mock o API)
db.init();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
