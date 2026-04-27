import { useState, useEffect, useCallback } from 'react';
import { clienteService } from '../../api/clienteService';
import { barbeiroService } from '../../api/barbeiroService';
import { servicoService } from '../../api/servicoService';
import { agendamentoService } from '../../api/agendamentoService';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/Toast';
import api from '../../api/axios';

const STATUS_LABEL = { AGENDADO: 'Aguardando', FINALIZADO: 'Finalizado', CANCELADO: 'Cancelado' };
const STATUS_CLS   = { AGENDADO: 'badge-info', FINALIZADO: 'badge-success', CANCELADO: 'badge-danger' };

function TabelaAgendamentos({ lista, togglingId, onToggle }) {
  return (
    <div className="table-wrapper" style={{ border: 'none' }}>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Hora</th>
            <th>Cliente</th>
            <th>Barbeiro</th>
            <th>Serviços</th>
            <th>Total</th>
            <th>Status</th>
            {onToggle && <th></th>}
          </tr>
        </thead>
        <tbody>
          {lista.map((a, idx) => (
            <tr key={a.id} style={{ opacity: a.status === 'FINALIZADO' ? 0.65 : 1 }}>
              <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{idx + 1}</td>
              <td><span className="badge badge-info">{a.hora?.slice(0, 5)}</span></td>
              <td style={{ fontWeight: 500 }}>{a.cliente?.nome}</td>
              <td>{a.barbeiro?.nome}</td>
              <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                {a.itens?.map((i) => i.servico?.nomeServico).join(', ')}
              </td>
              <td>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  R$ {Number(a.valorTotal).toFixed(2)}
                </span>
              </td>
              <td>
                <span className={`badge ${STATUS_CLS[a.status] ?? 'badge-default'}`}>
                  {STATUS_LABEL[a.status] ?? a.status}
                </span>
              </td>
              {onToggle && (
                <td>
                  <button
                    className={`btn btn-sm ${a.status === 'FINALIZADO' ? 'btn-secondary' : 'btn-primary'}`}
                    disabled={togglingId === a.id}
                    onClick={() => onToggle(a)}
                    title={a.status === 'FINALIZADO' ? 'Marcar como Aguardando' : 'Marcar como Finalizado'}
                  >
                    {togglingId === a.id
                      ? <span className="spinner" style={{ width: 12, height: 12 }} />
                      : a.status === 'FINALIZADO' ? 'Desfazer' : 'Finalizar'}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { toasts, addToast, removeToast } = useToast();
  const [stats, setStats] = useState({ clientes: 0, barbeiros: 0, servicos: 0, agendamentos: 0 });
  const [agendamentosHoje, setAgendamentosHoje] = useState([]);
  const [agendamentosAmanha, setAgendamentosAmanha] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  const hoje = new Date().toLocaleDateString('en-CA');
  const amanha = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-CA');
  })();

  const carregar = useCallback(async () => {
    const fmt = (v) => v?.toString().slice(0, 10);
    try {
      const [clientes, barbeiros, servicos, agendamentos] = await Promise.all([
        clienteService.listar(),
        barbeiroService.listar(),
        servicoService.listar(),
        agendamentoService.listar(),
      ]);
      setStats({
        clientes: clientes.length,
        barbeiros: barbeiros.length,
        servicos: servicos.length,
        agendamentos: agendamentos.length,
      });
      const sortHora = (a, b) => (a.hora ?? '').localeCompare(b.hora ?? '');
      setAgendamentosHoje(agendamentos.filter((a) => fmt(a.data) === hoje).sort(sortHora));
      setAgendamentosAmanha(agendamentos.filter((a) => fmt(a.data) === amanha).sort(sortHora));
    } finally {
      setLoading(false);
    }
  }, [hoje, amanha]);

  useEffect(() => { carregar(); }, [carregar]);

  const toggleStatus = async (ag) => {
    const novoStatus = ag.status === 'FINALIZADO' ? 'AGENDADO' : 'FINALIZADO';
    setTogglingId(ag.id);
    try {
      const updated = await api.patch(`/agendamentos/${ag.id}/status?status=${novoStatus}`).then((r) => r.data);
      setAgendamentosHoje((prev) =>
        prev.map((a) => (a.id === ag.id ? { ...a, status: updated.status } : a))
      );
    } catch (err) {
      addToast(err.response?.data?.message ?? 'Erro ao atualizar status.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const agora = new Date();
  const finalizados = agendamentosHoje.filter((a) => a.status === 'FINALIZADO');
  const proximosHoje = agendamentosHoje.filter((a) => {
    if (a.status === 'FINALIZADO') return false;
    const [h, m] = (a.hora ?? '00:00').split(':').map(Number);
    const t = new Date(); t.setHours(h, m, 0, 0);
    return t > agora;
  });
  const proximoCliente = proximosHoje[0];

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </p>
          </div>
        </div>

        {/* Estatísticas globais */}
        <div className="stats-grid">
          {[
            { label: 'Clientes',     value: stats.clientes,     icon: '👤' },
            { label: 'Barbeiros',    value: stats.barbeiros,    icon: '✂'  },
            { label: 'Serviços',     value: stats.servicos,     icon: '🗒' },
            { label: 'Agendamentos', value: stats.agendamentos, icon: '📅' },
          ].map((card) => (
            <div key={card.label} className="stat-card">
              <div className="stat-icon">{card.icon}</div>
              <div>
                <div className="stat-value">{card.value}</div>
                <div className="stat-label">{card.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Métricas do dia */}
        <div className="stats-grid" style={{ marginTop: 0 }}>
          <div className="stat-card" style={{ borderLeft: '3px solid var(--text-primary)' }}>
            <div className="stat-icon">📋</div>
            <div>
              <div className="stat-value">{agendamentosHoje.length}</div>
              <div className="stat-label">Total hoje</div>
            </div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #3b82f6' }}>
            <div className="stat-icon">⏳</div>
            <div>
              <div className="stat-value">{proximosHoje.length}</div>
              <div className="stat-label">Próximos</div>
            </div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #22c55e' }}>
            <div className="stat-icon">✅</div>
            <div>
              <div className="stat-value">{finalizados.length}</div>
              <div className="stat-label">Finalizados</div>
            </div>
          </div>
          <div className="stat-card" style={{ borderLeft: '3px solid #f59e0b' }}>
            <div className="stat-icon">📆</div>
            <div>
              <div className="stat-value">{agendamentosAmanha.length}</div>
              <div className="stat-label">Amanhã</div>
            </div>
          </div>
        </div>

        {/* Próximo atendimento em destaque */}
        {proximoCliente && (
          <div className="card" style={{ borderLeft: '4px solid #3b82f6', marginBottom: 16 }}>
            <div className="card-header">
              <h2 className="card-title">Próximo Atendimento</h2>
              <span className="badge badge-info">{proximoCliente.hora?.slice(0, 5)}</span>
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: '8px 0' }}>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Cliente</p>
                <p style={{ fontWeight: 600 }}>{proximoCliente.cliente?.nome}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Barbeiro</p>
                <p style={{ fontWeight: 600 }}>{proximoCliente.barbeiro?.nome}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Serviços</p>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {proximoCliente.itens?.map((i) => i.servico?.nomeServico).join(', ')}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Total</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  R$ {Number(proximoCliente.valorTotal).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Agendamentos de Hoje */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <h2 className="card-title">Agendamentos de Hoje</h2>
            <span className="badge badge-info">{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
          {agendamentosHoje.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <p>Nenhum agendamento para hoje.</p>
            </div>
          ) : (
            <TabelaAgendamentos
              lista={agendamentosHoje}
              togglingId={togglingId}
              onToggle={toggleStatus}
            />
          )}
        </div>

        {/* Agendamentos de Amanhã */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Agendamentos de Amanhã</h2>
            <span className="badge badge-default">
              {new Date(amanha + 'T12:00:00').toLocaleDateString('pt-BR')}
            </span>
          </div>
          {agendamentosAmanha.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📆</div>
              <p>Nenhum agendamento para amanhã.</p>
            </div>
          ) : (
            <TabelaAgendamentos
              lista={agendamentosAmanha}
              togglingId={null}
              onToggle={null}
            />
          )}
        </div>
      </div>
    </>
  );
}
