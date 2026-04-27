import { useState, useEffect, useCallback } from 'react';
import { configuracaoService } from '../../api/configuracaoService';
import { barbeiroService } from '../../api/barbeiroService';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/Toast';

export default function AdminConfiguracoesPage() {
  const { toasts, addToast, removeToast } = useToast();

  const DIAS = [
    { key: 'MONDAY', label: 'Segunda' },
    { key: 'TUESDAY', label: 'Terça' },
    { key: 'WEDNESDAY', label: 'Quarta' },
    { key: 'THURSDAY', label: 'Quinta' },
    { key: 'FRIDAY', label: 'Sexta' },
    { key: 'SATURDAY', label: 'Sábado' },
    { key: 'SUNDAY', label: 'Domingo' },
  ];

  // Horário de funcionamento
  const [horario, setHorario] = useState({
    abertura: '08:00',
    fechamento: '19:00',
    diasAbertos: ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'],
    horariosPorDia: {},
  });
  // Quais dias têm horário personalizado ativo na UI
  const [diasPersonalizados, setDiasPersonalizados] = useState({});
  const [savingHorario, setSavingHorario] = useState(false);

  // Folgas
  const [barbeiros, setBarbeiros] = useState([]);
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState('');
  const [folgas, setFolgas] = useState([]);
  const [novaFolgaData, setNovaFolgaData] = useState('');
  const [savingFolga, setSavingFolga] = useState(false);
  const [confirmFolgaId, setConfirmFolgaId] = useState(null);

  const carregarHorario = useCallback(async () => {
    try {
      const data = await configuracaoService.buscarHorario();
      const porDia = data.horariosPorDia ?? {};
      setHorario({
        abertura: data.abertura?.slice(0, 5) ?? '08:00',
        fechamento: data.fechamento?.slice(0, 5) ?? '19:00',
        diasAbertos: data.diasAbertos ?? ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'],
        horariosPorDia: Object.fromEntries(
          Object.entries(porDia).map(([k, v]) => [k, {
            abertura: v.abertura?.slice(0, 5) ?? '',
            fechamento: v.fechamento?.slice(0, 5) ?? '',
          }])
        ),
      });
      // Marca dias que já têm horário personalizado salvo
      const pers = {};
      Object.keys(porDia).forEach((k) => { pers[k] = true; });
      setDiasPersonalizados(pers);
    } catch {
      // usa padrão
    }
  }, []);

  const carregarBarbeiros = useCallback(async () => {
    const data = await barbeiroService.listar();
    setBarbeiros(data);
  }, []);

  useEffect(() => {
    carregarHorario();
    carregarBarbeiros();
  }, [carregarHorario, carregarBarbeiros]);

  const carregarFolgas = useCallback(async (barbeiroId) => {
    if (!barbeiroId) { setFolgas([]); return; }
    try {
      const data = await configuracaoService.listarFolgas(barbeiroId);
      setFolgas(data.sort((a, b) => a.data.localeCompare(b.data)));
    } catch {
      setFolgas([]);
    }
  }, []);

  const handleBarbeiroChange = (id) => {
    setBarbeiroSelecionado(id);
    carregarFolgas(id);
  };

  const toggleDia = (key) => {
    setHorario((p) => ({
      ...p,
      diasAbertos: p.diasAbertos.includes(key)
        ? p.diasAbertos.filter((x) => x !== key)
        : [...p.diasAbertos, key],
    }));
  };

  const togglePersonalizado = (key) => {
    setDiasPersonalizados((p) => {
      const novo = { ...p, [key]: !p[key] };
      // Se desativando, remove do horariosPorDia
      if (p[key]) {
        setHorario((h) => {
          const porDia = { ...h.horariosPorDia };
          delete porDia[key];
          return { ...h, horariosPorDia: porDia };
        });
      } else {
        // Inicia com horário global
        setHorario((h) => ({
          ...h,
          horariosPorDia: {
            ...h.horariosPorDia,
            [key]: { abertura: h.abertura, fechamento: h.fechamento },
          },
        }));
      }
      return novo;
    });
  };

  const setHorarioDia = (key, field, value) => {
    setHorario((h) => ({
      ...h,
      horariosPorDia: {
        ...h.horariosPorDia,
        [key]: { ...(h.horariosPorDia[key] ?? {}), [field]: value },
      },
    }));
  };

  const handleSalvarHorario = async (e) => {
    e.preventDefault();
    setSavingHorario(true);
    try {
      // Monta horariosPorDia apenas com os dias personalizados ativos
      const porDia = {};
      Object.entries(diasPersonalizados).forEach(([k, ativo]) => {
        if (ativo && horario.horariosPorDia[k]) {
          const { abertura, fechamento } = horario.horariosPorDia[k];
          if (abertura && fechamento) {
            porDia[k] = { abertura: abertura + ':00', fechamento: fechamento + ':00' };
          }
        }
      });
      await configuracaoService.salvarHorario({
        abertura: horario.abertura + ':00',
        fechamento: horario.fechamento + ':00',
        diasAbertos: horario.diasAbertos,
        horariosPorDia: porDia,
      });
      addToast('Horário de funcionamento salvo!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message ?? 'Erro ao salvar horário.', 'error');
    } finally {
      setSavingHorario(false);
    }
  };

  const handleRegistrarFolga = async (e) => {
    e.preventDefault();
    if (!barbeiroSelecionado) { addToast('Selecione um barbeiro.', 'error'); return; }
    if (!novaFolgaData) { addToast('Informe a data da folga.', 'error'); return; }
    setSavingFolga(true);
    try {
      await configuracaoService.registrarFolga(barbeiroSelecionado, { data: novaFolgaData });
      setNovaFolgaData('');
      await carregarFolgas(barbeiroSelecionado);
      addToast('Folga registrada!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message ?? 'Erro ao registrar folga.', 'error');
    } finally {
      setSavingFolga(false);
    }
  };

  const handleRemoverFolga = async () => {
    try {
      await configuracaoService.removerFolga(barbeiroSelecionado, confirmFolgaId);
      setConfirmFolgaId(null);
      await carregarFolgas(barbeiroSelecionado);
      addToast('Folga removida.', 'success');
    } catch (err) {
      setConfirmFolgaId(null);
      addToast(err.response?.data?.message ?? 'Erro ao remover folga.', 'error');
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Horário de funcionamento e folgas dos barbeiros</p>
        </div>
      </div>

      {/* Horário de Funcionamento */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2 className="card-title">Horário de Funcionamento</h2>
        </div>
        <form onSubmit={handleSalvarHorario}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Abertura (padrão)</label>
              <input
                type="time"
                className="form-input"
                value={horario.abertura}
                onChange={(e) => setHorario((p) => ({ ...p, abertura: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fechamento (padrão)</label>
              <input
                type="time"
                className="form-input"
                value={horario.fechamento}
                onChange={(e) => setHorario((p) => ({ ...p, fechamento: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Dias de Funcionamento</label>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
              Marque "Personalizar" para definir um horário diferente para um dia específico.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {DIAS.map((d) => {
                const aberto = horario.diasAbertos.includes(d.key);
                const personalizado = diasPersonalizados[d.key] && aberto;
                return (
                  <div key={d.key} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    {/* Checkbox do dia */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', minWidth: 90, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <input type="checkbox" checked={aberto} onChange={() => toggleDia(d.key)} />
                      {d.label}
                    </label>

                    {/* Toggle personalizar (só se o dia estiver aberto) */}
                    {aberto && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>
                        <input type="checkbox" checked={!!diasPersonalizados[d.key]} onChange={() => togglePersonalizado(d.key)} />
                        Personalizar horário
                      </label>
                    )}

                    {/* Inputs de horário específico */}
                    {personalizado && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="time"
                          className="form-input"
                          style={{ width: 110, padding: '4px 8px', fontSize: 13 }}
                          value={horario.horariosPorDia[d.key]?.abertura ?? ''}
                          onChange={(e) => setHorarioDia(d.key, 'abertura', e.target.value)}
                        />
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>às</span>
                        <input
                          type="time"
                          className="form-input"
                          style={{ width: 110, padding: '4px 8px', fontSize: 13 }}
                          value={horario.horariosPorDia[d.key]?.fechamento ?? ''}
                          onChange={(e) => setHorarioDia(d.key, 'fechamento', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
            <button type="submit" className="btn btn-primary" disabled={savingHorario}>
              {savingHorario ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Salvar Horário'}
            </button>
          </div>
        </form>
      </div>

      {/* Folgas dos Barbeiros */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Folgas dos Barbeiros</h2>
        </div>

        <div className="form-group">
          <label className="form-label">Selecione o Barbeiro</label>
          <select
            className="form-input"
            style={{ maxWidth: 300 }}
            value={barbeiroSelecionado}
            onChange={(e) => handleBarbeiroChange(e.target.value)}
          >
            <option value="">Selecione...</option>
            {barbeiros.map((b) => (
              <option key={b.id} value={b.id}>{b.nome}</option>
            ))}
          </select>
        </div>

        {barbeiroSelecionado && (
          <>
            <form onSubmit={handleRegistrarFolga} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 20 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Data da Folga</label>
                <input
                  type="date"
                  className="form-input"
                  value={novaFolgaData}
                  onChange={(e) => setNovaFolgaData(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={savingFolga}>
                {savingFolga ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '+ Registrar Folga'}
              </button>
            </form>

            {folgas.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhuma folga registrada para este barbeiro.</p>
              </div>
            ) : (
              <div className="table-wrapper" style={{ border: 'none', padding: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Dia da Semana</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {folgas.map((f) => {
                      const dt = new Date(f.data + 'T12:00:00');
                      return (
                        <tr key={f.id}>
                          <td>
                            <span className="badge badge-warning">{f.data}</span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {dt.toLocaleDateString('pt-BR', { weekday: 'long' })}
                          </td>
                          <td>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setConfirmFolgaId(f.id)}
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmFolgaId !== null}
        title="Remover Folga"
        message="Tem certeza que deseja remover esta folga? Agendamentos nesta data serão permitidos novamente."
        confirmLabel="Remover"
        onConfirm={handleRemoverFolga}
        onCancel={() => setConfirmFolgaId(null)}
      />
    </>
  );
}
