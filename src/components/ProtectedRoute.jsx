/**
 * ProtectedRoute — Protege rotas que exigem autenticação e/ou role específico.
 *
 * Lógica:
 * 1. Se não há usuário logado → redireciona para /login
 * 2. Se há role requerida e o usuário não tem essa role →
 *    redireciona para a área correta (BARBEIRO → /admin, CLIENTE → /cliente)
 * 3. Se tudo OK → renderiza os filhos
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'BARBEIRO') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/cliente/inicio" replace />;
  }

  return children;
}
