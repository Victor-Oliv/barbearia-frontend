/**
 * App.jsx — Roteamento separado por role de usuário
 *
 * Estrutura de rotas:
 * /login, /cadastro                → públicas
 * /admin/*                         → ROLE_BARBEIRO (com sidebar)
 * /cliente/*                       → ROLE_CLIENTE (com topbar)
 * /                                → redireciona conforme role
 *
 * O componente RootRedirect lê user.role do AuthContext
 * e envia cada tipo de usuário para sua área correta.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ClienteLayout from './components/ClienteLayout';
import LoginPage from './pages/LoginPage';
import CadastroPage from './pages/CadastroPage';

// Páginas Admin
import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminClientesPage from './pages/admin/ClientesPage';
import AdminBarbeirosPage from './pages/admin/BarbeirosPage';
import AdminServicosPage from './pages/admin/ServicosPage';
import AdminProdutosPage from './pages/admin/ProdutosPage';
import AdminAgendamentosPage from './pages/admin/AgendamentosPage';
import AdminConfiguracoesPage from './pages/admin/ConfiguracoesPage';

// Páginas Cliente
import ClienteInicioPage from './pages/cliente/InicioPage';
import ClienteServicosPage from './pages/cliente/ServicosPage';
import ClienteBarbeirosPage from './pages/cliente/BarbeirosPage';
import ClienteProdutosPage from './pages/cliente/ProdutosPage';
import NovoAgendamentoPage from './pages/cliente/NovoAgendamentoPage';
import MeusAgendamentosPage from './pages/cliente/MeusAgendamentosPage';

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'BARBEIRO') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/cliente/inicio" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<CadastroPage />} />

          {/* Área do Admin/Barbeiro */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="BARBEIRO">
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="clientes" element={<AdminClientesPage />} />
            <Route path="barbeiros" element={<AdminBarbeirosPage />} />
            <Route path="servicos" element={<AdminServicosPage />} />
            <Route path="produtos" element={<AdminProdutosPage />} />
            <Route path="agendamentos" element={<AdminAgendamentosPage />} />
            <Route path="configuracoes" element={<AdminConfiguracoesPage />} />
          </Route>

          {/* Área do Cliente */}
          <Route
            path="/cliente"
            element={
              <ProtectedRoute>
                <ClienteLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/cliente/inicio" replace />} />
            <Route path="inicio" element={<ClienteInicioPage />} />
            <Route path="servicos" element={<ClienteServicosPage />} />
            <Route path="barbeiros" element={<ClienteBarbeirosPage />} />
            <Route path="produtos" element={<ClienteProdutosPage />} />
            <Route path="agendar" element={<NovoAgendamentoPage />} />
            <Route path="meus-agendamentos" element={<MeusAgendamentosPage />} />
          </Route>

          {/* Raiz — redireciona conforme role */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
