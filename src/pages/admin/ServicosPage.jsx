import { useState, useEffect, useCallback } from 'react';
import { servicoService } from '../../api/servicoService';
import Modal from '../../components/Modal';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/Toast';

const EMPTY_FORM = { nomeServico: '', descricaoServico: '', valorServico: '', duracaoMinutos: '' };

export default function AdminServicosPage() {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [editError, setEditError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const { toasts, addToast, removeToast } = useToast();

  const carregar = useCallback(async () => {
    try {
      const data = await servicoService.listar();
      setServicos(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const totalGeral = servicos.reduce((acc, s) => acc + Number(s.valorServico || 0), 0);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleEditChange = (e) =>
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const abrirEdicao = (servico) => {
    setEditando(servico);
    setEditForm({
      nomeServico: servico.nomeServico,
      descricaoServico: servico.descricaoServico || '',
      valorServico: servico.valorServico,
      duracaoMinutos: servico.duracaoMinutos ?? '',
    });
    setEditError('');
    setEditModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await servicoService.criar({
        ...form,
        valorServico: parseFloat(form.valorServico),
        duracaoMinutos: form.duracaoMinutos ? parseInt(form.duracaoMinutos, 10) : null,
      });
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await carregar();
      addToast('Serviço criado com sucesso!', 'success');
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Erro ao criar serviço.');
      addToast('Erro ao criar serviço.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setEditError('');
    try {
      await servicoService.atualizar(editando.id, {
        nomeServico: editForm.nomeServico,
        descricaoServico: editForm.descricaoServico,
        valorServico: parseFloat(editForm.valorServico),
        duracaoMinutos: editForm.duracaoMinutos ? parseInt(editForm.duracaoMinutos, 10) : null,
      });
      setEditModalOpen(false);
      setEditando(null);
      await carregar();
      addToast('Serviço atualizado com sucesso!', 'success');
    } catch (err) {
      setEditError(err.response?.data?.message ?? 'Erro ao atualizar serviço.');
      addToast('Erro ao atualizar serviço.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await servicoService.deletar(confirmId);
      setConfirmId(null);
      await carregar();
      addToast('Serviço excluído.', 'success');
    } catch (err) {
      setConfirmId(null);
      addToast(err.response?.data?.message ?? 'Erro ao excluir. Verifique se há agendamentos vinculados.', 'error');
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Serviços</h1>
          <p className="page-subtitle">{servicos.length} serviço{servicos.length !== 1 ? 's' : ''} cadastrado{servicos.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setFormError(''); setModalOpen(true); }}>
          + Novo Serviço
        </button>
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <span className="table-toolbar-title">Tabela de serviços</span>
          {servicos.length > 0 && (
            <span className="badge badge-default" style={{ fontFamily: 'var(--font-mono)' }}>
              Total: R$ {totalGeral.toFixed(2)}
            </span>
          )}
        </div>

        {servicos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🗒</div>
            <p>Nenhum serviço cadastrado.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Duração</th>
                <th>Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {servicos.map((s, idx) => (
                <tr key={s.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{idx + 1}</td>
                  <td>{s.nomeServico}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.descricaoServico || '—'}</td>
                  <td>
                    {s.duracaoMinutos
                      ? <span className="badge badge-info">{s.duracaoMinutos} min</span>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>
                    <span className="badge badge-success" style={{ fontFamily: 'var(--font-mono)' }}>
                      R$ {Number(s.valorServico).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => abrirEdicao(s)}>
                        Editar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(s.id)}>
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de cadastro */}
      <Modal isOpen={modalOpen} title="Novo Serviço" onClose={() => setModalOpen(false)}>
        {formError && <div className="alert alert-error">{formError}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome do Serviço *</label>
            <input name="nomeServico" className="form-input" placeholder="Ex: Corte de Cabelo" value={form.nomeServico} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <input name="descricaoServico" className="form-input" placeholder="Descrição opcional" value={form.descricaoServico} onChange={handleChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Valor (R$) *</label>
              <input name="valorServico" type="number" step="0.01" min="0.01" className="form-input" placeholder="0.00" value={form.valorServico} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Duração (minutos)</label>
              <input name="duracaoMinutos" type="number" min="1" className="form-input" placeholder="Ex: 30" value={form.duracaoMinutos} onChange={handleChange} />
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de edição */}
      <Modal isOpen={editModalOpen} title={`Editar Serviço — ${editando?.nomeServico}`} onClose={() => setEditModalOpen(false)}>
        {editError && <div className="alert alert-error">{editError}</div>}
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label className="form-label">Nome do Serviço *</label>
            <input name="nomeServico" className="form-input" value={editForm.nomeServico} onChange={handleEditChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <input name="descricaoServico" className="form-input" value={editForm.descricaoServico} onChange={handleEditChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Valor (R$) *</label>
              <input name="valorServico" type="number" step="0.01" min="0.01" className="form-input" value={editForm.valorServico} onChange={handleEditChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Duração (minutos)</label>
              <input name="duracaoMinutos" type="number" min="1" className="form-input" value={editForm.duracaoMinutos} onChange={handleEditChange} />
            </div>
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
        title="Excluir Serviço"
        message="Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}
