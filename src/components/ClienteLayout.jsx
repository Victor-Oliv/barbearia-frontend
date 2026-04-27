import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/cliente/inicio', label: 'Início', icon: '⬛' },
  { to: '/cliente/servicos', label: 'Serviços', icon: '✂' },
  { to: '/cliente/barbeiros', label: 'Barbeiros', icon: '👤' },
  { to: '/cliente/produtos', label: 'Produtos', icon: '📦' },
  { to: '/cliente/agendar', label: 'Agendar', icon: '📅' },
  { to: '/cliente/meus-agendamentos', label: 'Meus Agendamentos', icon: '📋' },
];

export default function ClienteLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="cliente-layout">
      <header className="cliente-header">
        <div className="cliente-header-brand">
          <span className="cliente-header-logo">✂ Barbearia</span>
        </div>

        {/* Nav desktop */}
        <nav className="cliente-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `cliente-nav-link${isActive ? ' active' : ''}`
              }
            >
              <span className="cliente-nav-icon">{item.icon}</span>
              <span className="cliente-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="cliente-header-user">
          <div className="user-avatar" style={{ fontSize: 12 }}>
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <span className="user-email" style={{ maxWidth: 140 }}>
            {user?.email}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Sair
          </button>
        </div>

        {/* Hambúrguer — só visível no mobile */}
        <button
          className="cliente-hamburger-btn"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Abrir menu"
        >
          <span /><span /><span />
        </button>
      </header>

      {/* Drawer mobile */}
      {menuOpen && (
        <div
          className="cliente-mobile-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <nav className={`cliente-mobile-nav${menuOpen ? ' open' : ''}`}>
        <div className="cliente-mobile-nav-header">
          <span style={{ fontSize: 14, fontWeight: 700 }}>Menu</span>
          <button
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 20, cursor: 'pointer' }}
            onClick={() => setMenuOpen(false)}
          >
            ×
          </button>
        </div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `cliente-mobile-nav-link${isActive ? ' active' : ''}`
            }
            onClick={() => setMenuOpen(false)}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        <button
          className="btn btn-secondary"
          style={{ margin: '16px', width: 'calc(100% - 32px)' }}
          onClick={handleLogout}
        >
          Sair
        </button>
      </nav>

      <main className="cliente-main">
        <Outlet />
      </main>
    </div>
  );
}
