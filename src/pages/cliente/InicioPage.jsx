import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ClienteInicioPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const cards = [
    {
      icon: '✂',
      title: 'Nossos Serviços',
      desc: 'Veja todos os serviços disponíveis e seus preços.',
      to: '/cliente/servicos',
      label: 'Ver Serviços',
    },
    {
      icon: '👤',
      title: 'Nossa Equipe',
      desc: 'Conheça os barbeiros disponíveis.',
      to: '/cliente/barbeiros',
      label: 'Ver Barbeiros',
    },
    {
      icon: '📅',
      title: 'Agendar Horário',
      desc: 'Faça um novo agendamento de forma rápida.',
      to: '/cliente/agendar',
      label: 'Agendar Agora',
    },
    {
      icon: '📋',
      title: 'Meus Agendamentos',
      desc: 'Veja seu histórico de agendamentos.',
      to: '/cliente/meus-agendamentos',
      label: 'Ver Histórico',
    },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Bem-vindo, {user?.email?.split('@')[0]}!</h1>
        <p className="page-subtitle">O que você deseja fazer hoje?</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {cards.map((card) => (
          <div key={card.to} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(card.to)}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{card.icon}</div>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{card.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>{card.desc}</p>
            <button className="btn btn-secondary btn-sm">{card.label}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
