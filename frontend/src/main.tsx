import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Hide loading splash once React is mounted
if (typeof window.__hideSplash === 'function') {
  window.__hideSplash();
}

declare global {
  interface Window { __hideSplash?: () => void; }
}
