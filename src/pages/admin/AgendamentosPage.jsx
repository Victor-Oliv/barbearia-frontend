import { useState, useEffect, useCallback } from 'react';
import { agendamentoService } from '../../api/agendamentoService';
import { clienteService } from '../../api/clienteService';
import { barbeiroService } from '../../api/barbeiroService';
import { servicoService } from '../../api/servicoService';
import Modal from '../../components/Modal';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/Toast';

const EMPTY_FORM = { clienteId: '', barbeiroId: '', data: '', hora: '', servicosId: [] };
const hoje = new Date().toLocaleDateString('en-CA');

export default function AdminAgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState({ barbeiroId: '', data: '', hora: '', servicosId: [] });
  const [slotsNovo, setSlotsNovo] = useState([]);
  const [loadingNovo, setLoadingNovo] = useState(false);
  const [slotsDisponiveis, setSlotsDisponiveis] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [editError, setEditError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const { toasts, addToast, removeToast } = useToast();

  const carregar = useCallback(async () => {
    try {
      const data = await agendamentoService.listar();
      setAgendamentos(data.sort((a, b) => b.id - a.id));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const carregarAuxiliares = async () => {
    const [c, b, s] = await Promise.all([
      clienteService.listar(),
      barbeiroService.listar(),
      servicoService.listar(),
    ]);
    setClientes(c);
    setBarbeiros(b);
    setServicos(s);
  };

  const abrirModal = async () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setSlotsNovo([]);
    setModalOpen(true);
    await carregarAuxiliares();
  };

  const abrirEdicao = async (ag) => {
    setEditando(ag);
    const servicosIds = ag.itens?.map((i) => i.servico?.id) ?? [];
    const ef = {
      barbeiroId: String(ag.barbeiro?.id ?? ''),
      data: ag.data,
      hora: ag.hora?.slice(0, 5),
      servicosId: servicosIds,
    };
    setEditForm(ef);
    setEditError('');
    setSlotsDisponiveis([]);
    setEditModalOpen(true);
    await carregarAuxiliares();
    if (ag.barbeiro?.id && ag.data) {
      buscarSlotsEdicao(ag.barbeiro.id, ag.data, servicosIds, ag.id);
    }
  };

  const buscarSlotsNovo = useCallback(async (barbeiroId, data, servicosId) => {
    if (!barbeiroId || !data) return;
    setLoadingNovo(true);
    setSlotsNovo([]);
    try {
      const slots = await agendamentoService.horariosDisponiveis(barbeiroId, data, servicosId);
      setSlotsNovo(slots);
    } catch {
      setSlotsNovo([]);
    } finally {
      setLoadingNovo(false);
    }
  }, []);

  const buscarSlotsEdicao = async (barbeiroId, data, servicosId, agId) => {
    if (!barbeiroId || !data) return;
    setLoadingSlots(true);
    try {
      const slots = await agendamentoService.horariosDisponiveis(barbeiroId, data, servicosId);
      setSlotsDisponiveis(slots);
    } catch {
      setSlotsDisponiveis([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleNovoCampo = (field, value) => {
    const novoForm = { ...form, [field]: value, hora: '' };
    setForm(novoForm);
    buscarSlotsNovo(
      field === 'barbeiroId' ? value : novoForm.barbeiroId,
      field === 'data' ? value : novoForm.data,
      novoForm.servicosId,
    );
  };

  const toggleServico = (id) => {
    setForm((prev) => {
      const ids = prev.servicosId.includes(id)
        ? prev.servicosId.filter((x) => x !== id)
        : [...prev.servicosId, id];
      return { ...prev, servicosId: ids, hora: '' };
    });
  };

  // Busca slots de novo quando servicosId muda
  useEffect(() => {
    if (modalOpen && form.barbeiroId && form.data) {
      buscarSlotsNovo(form.barbeiroId, form.data, form.servicosId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.servicosId]);

  const toggleServicoEdit = (id) => {
    setEditForm((prev) => {
      const novosIds = prev.servicosId.includes(id)
        ? prev.servicosId.filter((x) => x !== id)
        : [...prev.servicosId, id];
      return { ...prev, servicosId: novosIds, hora: '' };
    });
  };

  // Busca slots quando servicosId do editForm muda
  useEffect(() => {
    if (editModalOpen && editForm.barbeiroId && editForm.data) {
      buscarSlotsEdicao(editForm.barbeiroId, editForm.data, editForm.servicosId, editando?.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editForm.servicosId]);

  const handleEditBarbeiroOuData = (field, value) => {
    const novoForm = { ...editForm, [field]: value, hora: '' };
    setEditForm(novoForm);
    if (novoForm.barbeiroId && novoForm.data) {
      buscarSlotsEdicao(novoForm.barbeiroId, novoForm.data, novoForm.servicosId, editando?.id);
    }
  };

  const totalSelecionado = servicos
    .filter((s) => form.servicosId.includes(s.id))
    .reduce((acc, s) => acc + Number(s.valorServico), 0);

  const totalEditSelecionado = servicos
    .filter((s) => editForm.servicosId.includes(s.id))
    .reduce((acc, s) => acc + Number(s.valorServico), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.servicosId.length === 0) {
      setFormError('Selecione ao menos um serviço.');
      return;
    }
    if (!form.hora) {
      setFormError('Selecione um horário disponível.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await agendamentoService.criar({
        clienteId: Number(form.clienteId),
        barbeiroId: Number(form.barbeiroId),
        data: form.data,
        hora: form.hora + ':00',
        servicosId: form.servicosId,
      });
      setModalOpen(false);
      await carregar();
      addToast('Agendamento criado com sucesso!', 'success');
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Erro ao criar agendamento.');
      addToast('Erro ao criar agendamento.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editForm.servicosId.length === 0) {
      setEditError('Selecione ao menos um serviço.');
      return;
    }
    if (!editForm.hora) {
      setEditError('Selecione um horário disponível.');
      return;
    }
    setSaving(true);
    setEditError('');
    try {
      await agendamentoService.atualizar(editando.id, {
        barbeiroId: Number(editForm.barbeiroId),
        data: editForm.data,
        hora: editForm.hora + ':00',
        servicosId: editForm.servicosId,
      });
      setEditModalOpen(false);
      setEditando(null);
      await carregar();
      addToast('Agendamento atualizado com sucesso!', 'success');
    } catch (err) {
      setEditError(err.response?.data?.message ?? 'Erro ao atualizar agendamento.');
      addToast('Erro ao atualizar agendamento.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelar = async () => {
    try {
      await agendamentoService.cancelar(confirmId);
      setConfirmId(null);
      await carregar();
      addToast('Agendamento cancelado.', 'success');
    } catch (err) {
      setConfirmId(null);
      addToast(err.response?.data?.message ?? 'Erro ao cancelar agendamento.', 'error');
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  // Item 3: exclui finalizados da listagem
  const agendamentosAtivos = agendamentos.filter((a) => a.status !== 'FINALIZADO');

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Agendamentos</h1>
          <p className="page-subtitle">{agendamentosAtivos.length} ativo(s)</p>
        </div>
        <button className="btn btn-primary" onClick={abrirModal}>
          + Novo Agendamento
        </button>
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <span className="table-toolbar-title">Agendamentos ativos (excluindo finalizados)</span>
        </div>

        {agendamentosAtivos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <p>Nenhum agendamento ativo.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Data</th>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Barbeiro</th>
                <th>Serviços</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {agendamentosAtivos.map((a, idx) => (
                <tr key={a.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{idx + 1}</td>
                  <td>
                    {a.data === hoje
                      ? <span className="badge badge-success">Hoje</span>
                      : <span style={{ fontSize: 13 }}>{a.data}</span>
                    }
                  </td>
                  <td><span className="badge badge-info">{a.hora?.slice(0, 5)}</span></td>
                  <td>{a.cliente?.nome}</td>
                  <td>{a.barbeiro?.nome}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12, maxWidth: 200 }}>
                    {a.itens?.map((i) => i.servico?.nomeServico).join(', ')}
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      R$ {Number(a.valorTotal).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => abrirEdicao(a)}>
                        Editar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(a.id)}>
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de novo agendamento */}
      <Modal isOpen={modalOpen} title="Novo Agendamento" onClose={() => setModalOpen(false)}>
        {formError && <div className="alert alert-error">{formError}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Cliente *</label>
            <select
              name="clienteId"
              className="form-input"
              value={form.clienteId}
              onChange={(e) => setForm((prev) => ({ ...prev, clienteId: e.target.value }))}
              required
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Barbeiro *</label>
            <select
              className="form-input"
              value={form.barbeiroId}
              onChange={(e) => handleNovoCampo('barbeiroId', e.target.value)}
              required
            >
              <option value="">Selecione um barbeiro</option>
              {barbeiros.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Data *</label>
            <input
              type="date"
              className="form-input"
              value={form.data}
              onChange={(e) => handleNovoCampo('data', e.target.value)}
              required
              min={hoje}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Serviços *</label>
            <div className="services-list">
              {servicos.map((s) => (
                <label key={s.id} className="service-item">
                  <input
                    type="checkbox"
                    checked={form.servicosId.includes(s.id)}
                    onChange={() => toggleServico(s.id)}
                  />
                  <span className="service-item-name">
                    {s.nomeServico}
                    {s.duracaoMinutos && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                        {s.duracaoMinutos}min
                      </span>
                    )}
                  </span>
                  <span className="service-item-price">R$ {Number(s.valorServico).toFixed(2)}</span>
                </label>
              ))}
            </div>
            {form.servicosId.length > 0 && (
              <p className="form-hint">Total: R$ {totalSelecionado.toFixed(2)}</p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Horário disponível *</label>
            {!form.barbeiroId || !form.data ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Selecione barbeiro e data para ver os horários.
              </p>
            ) : loadingNovo ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                <span className="spinner" style={{ width: 14, height: 14 }} />
                Buscando horários...
              </div>
            ) : slotsNovo.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--danger, #ef4444)' }}>
                Nenhum horário disponível para esta data.
              </p>
            ) : (
              <div className="time-slots">
                {slotsNovo.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={`time-slot-btn ${form.hora === slot ? 'selected' : ''}`}
                    onClick={() => setForm((prev) => ({ ...prev, hora: slot }))}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Agendar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de edição de agendamento */}
      <Modal isOpen={editModalOpen} title={`Editar Agendamento #${editando?.id}`} onClose={() => setEditModalOpen(false)}>
        {editError && <div className="alert alert-error">{editError}</div>}
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label className="form-label">Barbeiro *</label>
            <select
              className="form-input"
              value={editForm.barbeiroId}
              onChange={(e) => handleEditBarbeiroOuData('barbeiroId', e.target.value)}
              required
            >
              <option value="">Selecione um barbeiro</option>
              {barbeiros.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Data *</label>
              <input
                type="date"
                className="form-input"
                value={editForm.data}
                onChange={(e) => handleEditBarbeiroOuData('data', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Serviços *</label>
            <div className="services-list">
              {servicos.map((s) => (
                <label key={s.id} className="service-item">
                  <input
                    type="checkbox"
                    checked={editForm.servicosId.includes(s.id)}
                    onChange={() => toggleServicoEdit(s.id)}
                  />
                  <span className="service-item-name">
                    {s.nomeServico}
                    {s.duracaoMinutos && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                        {s.duracaoMinutos}min
                      </span>
                    )}
                  </span>
                  <span className="service-item-price">R$ {Number(s.valorServico).toFixed(2)}</span>
                </label>
              ))}
            </div>
            {editForm.servicosId.length > 0 && (
              <p className="form-hint">Total: R$ {totalEditSelecionado.toFixed(2)}</p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Horário disponível *</label>
            {loadingSlots ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                <span className="spinner" style={{ width: 14, height: 14 }} />
                Buscando horários...
              </div>
            ) : slotsDisponiveis.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                {editForm.barbeiroId && editForm.data
                  ? 'Nenhum horário disponível para esta data.'
                  : 'Selecione barbeiro, data e serviços para ver os horários.'}
              </p>
            ) : (
              <div className="time-slots">
                {slotsDisponiveis.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={`time-slot-btn ${editForm.hora === slot ? 'selected' : ''}`}
                    onClick={() => setEditForm((prev) => ({ ...prev, hora: slot }))}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setEditModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

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
