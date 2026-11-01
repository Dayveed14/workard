import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import App from './App.jsx';
import './index.css';

const app = (
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);

const root = document.getElementById('root');

// Pages prerendered at build time (/, /login, /signup) are "hydrated" (React takes over the
// existing HTML). Only do that if the HTML was built for THIS url — some hosts serve the home
// page's HTML for every path, and hydrating the wrong markup causes errors.
const prerenderedFor = root.dataset.prerendered;
const path = window.location.pathname.replace(/\/$/, '') || '/';

if (prerenderedFor && prerenderedFor === path && root.firstElementChild) {
  hydrateRoot(root, app);
} else {
  root.innerHTML = '';
  createRoot(root).render(app);
}
