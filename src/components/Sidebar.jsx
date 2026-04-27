import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  {
    section: 'Principal',
    links: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: '⬛' },
    ],
  },
  {
    section: 'Cadastros',
    links: [
      { to: '/admin/clientes', label: 'Clientes', icon: '👤' },
      { to: '/admin/barbeiros', label: 'Barbeiros', icon: '✂' },
      { to: '/admin/servicos', label: 'Serviços', icon: '🗒' },
      { to: '/admin/produtos', label: 'Produtos', icon: '📦' },
    ],
  },
  {
    section: 'Agenda',
    links: [
      { to: '/admin/agendamentos', label: 'Agendamentos', icon: '📅' },
    ],
  },
  {
    section: 'Configurações',
    links: [
      { to: '/admin/configuracoes', label: 'Horário & Folgas', icon: '⚙' },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
      <div className="sidebar-logo">
        <h1>Barbearia</h1>
        <span>Sistema de Gestão</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((section) => (
          <div key={section.section} className="nav-section">
            <div className="nav-section-label">{section.section}</div>
            {section.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `nav-link${isActive ? ' active' : ''}`
                }
                end={link.to === '/admin/dashboard'}
                onClick={onClose}
              >
                <span className="nav-icon">{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <span className="user-email">{user?.email}</span>
        </div>
        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleLogout}>
          Sair
        </button>
      </div>
    </aside>
  );
}
