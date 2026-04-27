/**
 * Configuração central do Axios
 *
 * Conceito — Interceptors:
 * São middlewares do Axios que executam antes de cada requisição (request)
 * ou depois de cada resposta (response). Permitem centralizar lógica
 * repetitiva como: adicionar headers de auth, tratar erros globalmente, etc.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de requisição: adiciona o header de autenticação automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  // Só adiciona se ainda não foi definido — preserva o header explícito do login
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Basic ${token}`;
  }
  return config;
});

// Interceptor de resposta: redireciona para login em caso de 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
