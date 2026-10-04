import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { PinyinProvider } from './context/PinyinContext.jsx';
import { TypographyProvider } from './context/TypographyContext.jsx';
import './styles/global.css';
import './styles/home.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PinyinProvider>
          <TypographyProvider>
            <App />
          </TypographyProvider>
        </PinyinProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
