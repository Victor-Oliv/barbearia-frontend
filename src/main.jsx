/**
 * main.jsx — Ponto de entrada da aplicação React
 *
 * StrictMode: Modo de desenvolvimento que detecta problemas potenciais.
 * Renderiza os componentes duas vezes no dev para identificar efeitos colaterais.
 * Não tem impacto em produção.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
