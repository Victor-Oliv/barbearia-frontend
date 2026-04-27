import { useState, useEffect } from 'react';
import { produtoService } from '../../api/produtoService';

export default function ClienteProdutosPage() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    produtoService.listar().then(setProdutos).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div style={{ padding: '32px', maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Produtos</h1>
          <p className="page-subtitle">Produtos disponíveis na barbearia</p>
        </div>
      </div>

      {produtos.length === 0 ? (
        <div className="empty-state" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 24px' }}>
          <div className="empty-state-icon">📦</div>
          <p>Nenhum produto disponível no momento.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {produtos.map((p) => (
            <div key={p.id} className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>📦</div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{p.nome}</h3>
              {p.descricao && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.4 }}>
                  {p.descricao}
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span className="badge badge-success" style={{ fontFamily: 'var(--font-mono)', fontSize: 14 }}>
                  R$ {Number(p.preco).toFixed(2)}
                </span>
                <span className={`badge ${p.estoque > 0 ? 'badge-info' : 'badge-danger'}`}>
                  {p.estoque > 0 ? `${p.estoque} un.` : 'Esgotado'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
