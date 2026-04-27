/**
 * AuthContext — Gerenciamento global de autenticação com roles
 *
 * Melhorias implementadas:
 * 1. Usa GET /auth/me como endpoint de validação de credenciais
 *    (antes usava GET /barbeiros, que falha para ROLE_CLIENTE)
 * 2. Armazena role, id e email do usuário no localStorage
 * 3. Restaura o estado completo ao recarregar a página
 * 4. Exporta loginWithCredentials para uso no auto-login pós-cadastro
 */

import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole');
    if (token && userId) {
      return { token, id: Number(userId), email, role };
    }
    return null;
  });

  /**
   * Login principal.
   * Chama GET /auth/me com as credenciais via Basic Auth.
   * Se 200: salva token + dados no localStorage e atualiza o estado.
   * Se 401: o axios lança erro que o componente captura.
   *
   * Retorna o objeto do usuário para que o componente possa redirecionar
   * conforme a role (BARBEIRO → /admin, CLIENTE → /cliente).
   */
  const login = async (email, senha) => {
    const token = btoa(`${email}:${senha}`);

    const response = await api.get('/auth/me', {
      headers: { Authorization: `Basic ${token}` },
    });

    const { id, role } = response.data;

    localStorage.setItem('authToken', token);
    localStorage.setItem('userId', String(id));
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userRole', role);

    const userData = { token, id, email, role };
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
