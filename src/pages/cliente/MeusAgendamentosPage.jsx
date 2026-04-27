import { useState, useEffect, useCallback } from 'react';
import { agendamentoService } from '../../api/agendamentoService';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/Toast';

const hoje = new Date().toISOString().split('T')[0];

export default function MeusAgendamentosPage() {
  const { user } = useAuth();
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null);
  const { toasts, addToast, removeToast } = useToast();

  const carregar = useCallback(async () => {
    try {
      const data = await agendamentoService.listarPorCliente(user.id);
      setAgendamentos(data.sort((a, b) => b.id - a.id));
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleCancelar = async () => {
    try {
      await agendamentoService.cancelar(confirmId);
      setConfirmId(null);
      await carregar();
      addToast('Agendamento cancelado com sucesso.', 'success');
    } catch (err) {
      setConfirmId(null);
      const msg = err.response?.data?.message ?? 'Erro ao cancelar agendamento.';
      addToast(msg, 'error');
    }
  };

  const isFuturo = (data, hora) => {
    const dt = new Date(`${data}T${hora}`);
    return dt > new Date();
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Meus Agendamentos</h1>
            <p className="page-subtitle">{agendamentos.length} agendamento{agendamentos.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {agendamentos.length === 0 ? (
          <div className="empty-state" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 24px' }}>
            <div className="empty-state-icon">📅</div>
            <p>Você ainda não tem agendamentos.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {agendamentos.map((a) => (
              <div key={a.id} className="card" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                      {a.data === hoje
                        ? <span className="badge badge-success">Hoje</span>
                        : <span className="badge badge-default">{a.data}</span>
                      }
                      <span className="badge badge-info">{a.hora?.slice(0, 5)}</span>
                      {a.status === 'FINALIZADO' && <span className="badge badge-success">Finalizado</span>}
                      {a.status === 'CANCELADO'  && <span className="badge badge-danger">Cancelado</span>}
                      {a.status === 'AGENDADO'   && <span className="badge badge-default">Agendado</span>}
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                      {a.barbeiro?.nome}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {a.itens?.map((i) => i.servico?.nomeServico).join(' · ')}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                      R$ {Number(a.valorTotal).toFixed(2)}
                    </p>
                    {isFuturo(a.data, a.hora) && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setConfirmId(a.id)}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmId !== null}
        title="Cancelar Agendamento"
        message="Tem certeza que deseja cancelar este agendamento?"
        confirmLabel="Cancelar Agendamento"
        onConfirm={handleCancelar}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}
