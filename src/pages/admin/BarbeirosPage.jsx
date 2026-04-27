import { useState, useEffect, useCallback } from 'react';
import { barbeiroService } from '../../api/barbeiroService';
import Modal from '../../components/Modal';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/Toast';

const EMPTY_FORM = { nome: '', telefone: '', email: '', senha: '' };

export default function AdminBarbeirosPage() {
  const [barbeiros, setBarbeiros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState({ nome: '', telefone: '', senha: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [editError, setEditError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const { toasts, addToast, removeToast } = useToast();

  const carregar = useCallback(async () => {
    try {
      const data = await barbeiroService.listar();
      setBarbeiros(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleEditChange = (e) =>
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const abrirEdicao = (barbeiro) => {
    setEditando(barbeiro);
    setEditForm({ nome: barbeiro.nome, telefone: barbeiro.telefone || '', senha: '' });
    setEditError('');
    setEditModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await barbeiroService.criar(form);
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await carregar();
      addToast('Barbeiro cadastrado com sucesso!', 'success');
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Erro ao cadastrar barbeiro.');
      addToast('Erro ao cadastrar barbeiro.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setEditError('');
    try {
      await barbeiroService.atualizar(editando.id, {
        nome: editForm.nome,
        telefone: editForm.telefone,
        email: editando.email,
        senha: editForm.senha || undefined,
      });
      setEditModalOpen(false);
      setEditando(null);
      await carregar();
      addToast('Barbeiro atualizado com sucesso!', 'success');
    } catch (err) {
      setEditError(err.response?.data?.message ?? 'Erro ao atualizar barbeiro.');
      addToast('Erro ao atualizar barbeiro.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await barbeiroService.deletar(confirmId);
      setConfirmId(null);
      await carregar();
      addToast('Barbeiro excluído.', 'success');
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
          <h1 className="page-title">Barbeiros</h1>
          <p className="page-subtitle">{barbeiros.length} cadastrado{barbeiros.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setFormError(''); setModalOpen(true); }}>
          + Novo Barbeiro
        </button>
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <span className="table-toolbar-title">Equipe</span>
        </div>

        {barbeiros.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✂</div>
            <p>Nenhum barbeiro cadastrado.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {barbeiros.map((b, idx) => (
                <tr key={b.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{idx + 1}</td>
                  <td>✂ {b.nome}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{b.email || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{b.telefone || '—'}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => abrirEdicao(b)}>
                        Editar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(b.id)}>
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
      <Modal isOpen={modalOpen} title="Novo Barbeiro" onClose={() => setModalOpen(false)}>
        {formError && <div className="alert alert-error">{formError}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input name="nome" className="form-input" value={form.nome} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Telefone</label>
            <input name="telefone" className="form-input" placeholder="(11) 99999-9999" value={form.telefone} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">E-mail (para login)</label>
            <input name="email" type="email" className="form-input" placeholder="barbeiro@barbearia.com" value={form.email} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Senha (para login)</label>
            <input name="senha" type="password" className="form-input" placeholder="Mínimo 6 caracteres" minLength={6} value={form.senha} onChange={handleChange} />
            <span className="form-hint">Preencha para habilitar acesso ao painel admin.</span>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Cadastrar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de edição */}
      <Modal isOpen={editModalOpen} title={`Editar Barbeiro — ${editando?.nome}`} onClose={() => setEditModalOpen(false)}>
        {editError && <div className="alert alert-error">{editError}</div>}
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input name="nome" className="form-input" value={editForm.nome} onChange={handleEditChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Telefone</label>
            <input name="telefone" className="form-input" placeholder="(11) 99999-9999" value={editForm.telefone} onChange={handleEditChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Nova Senha <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(deixe em branco para manter)</span></label>
            <input name="senha" type="password" className="form-input" placeholder="Mínimo 6 caracteres" minLength={6} value={editForm.senha} onChange={handleEditChange} />
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
        title="Excluir Barbeiro"
        message="Tem certeza que deseja excluir este barbeiro? Agendamentos vinculados podem ser afetados."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}
