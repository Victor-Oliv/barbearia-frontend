import { useState, useEffect } from 'react';
import { servicoService } from '../../api/servicoService';
import { useNavigate } from 'react-router-dom';

export default function ClienteServicosPage() {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    servicoService.listar().then(setServicos).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div style={{ padding: '32px', maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Nossos Serviços</h1>
          <p className="page-subtitle">Escolha os serviços e agende seu horário</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/cliente/agendar')}>
          Agendar Agora
        </button>
      </div>

      {servicos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✂</div>
          <p>Nenhum serviço disponível no momento.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {servicos.map((s) => (
            <div key={s.id} className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{s.nomeServico}</h3>
                {s.descricaoServico && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.descricaoServico}</p>
                )}
                {s.duracaoMinutos && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    ⏱ {s.duracaoMinutos} min
                  </p>
                )}
              </div>
              <span className="badge badge-success" style={{ fontFamily: 'var(--font-mono)', fontSize: 14, padding: '6px 12px', whiteSpace: 'nowrap' }}>
                R$ {Number(s.valorServico).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
