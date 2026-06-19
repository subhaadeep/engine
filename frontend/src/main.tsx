import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Mount — keep this file dead-simple so nothing can break it
const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found in index.html');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
