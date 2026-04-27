import { useState, useEffect } from 'react';
import { barbeiroService } from '../../api/barbeiroService';
import { useNavigate } from 'react-router-dom';

export default function ClienteBarbeirosPage() {
  const [barbeiros, setBarbeiros] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    barbeiroService.listar().then(setBarbeiros).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div style={{ padding: '32px', maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Nossa Equipe</h1>
          <p className="page-subtitle">Profissionais à sua disposição</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/cliente/agendar')}>
          Agendar Horário
        </button>
      </div>

      {barbeiros.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✂</div>
          <p>Nenhum barbeiro disponível no momento.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {barbeiros.map((b) => (
            <div key={b.id} className="card" style={{ textAlign: 'center', padding: '28px 24px' }}>
              <div style={{ width: 56, height: 56, background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 12px' }}>
                {b.nome?.[0]?.toUpperCase()}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{b.nome}</h3>
              {b.telefone && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.telefone}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
