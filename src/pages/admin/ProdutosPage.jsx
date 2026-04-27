import { useState, useEffect, useCallback } from 'react';
import { produtoService } from '../../api/produtoService';
import Modal from '../../components/Modal';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/Toast';

const EMPTY_FORM = { nome: '', descricao: '', preco: '', estoque: 0 };

export default function AdminProdutosPage() {
  const [produtos, setProdutos] = useState([]);
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
      const data = await produtoService.listar();
      setProdutos(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleEditChange = (e) =>
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const abrirEdicao = (produto) => {
    setEditando(produto);
    setEditForm({
      nome: produto.nome,
      descricao: produto.descricao || '',
      preco: produto.preco,
      estoque: produto.estoque,
    });
    setEditError('');
    setEditModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await produtoService.criar({
        ...form,
        preco: parseFloat(form.preco),
        estoque: parseInt(form.estoque, 10),
      });
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await carregar();
      addToast('Produto cadastrado com sucesso!', 'success');
    } catch (err) {
      setFormError(err.response?.data?.message ?? 'Erro ao cadastrar produto.');
      addToast('Erro ao cadastrar produto.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setEditError('');
    try {
      await produtoService.atualizar(editando.id, {
        nome: editForm.nome,
        descricao: editForm.descricao,
        preco: parseFloat(editForm.preco),
        estoque: parseInt(editForm.estoque, 10),
      });
      setEditModalOpen(false);
      setEditando(null);
      await carregar();
      addToast('Produto atualizado com sucesso!', 'success');
    } catch (err) {
      setEditError(err.response?.data?.message ?? 'Erro ao atualizar produto.');
      addToast('Erro ao atualizar produto.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await produtoService.deletar(confirmId);
      setConfirmId(null);
      await carregar();
      addToast('Produto excluído.', 'success');
    } catch (err) {
      setConfirmId(null);
      addToast(err.response?.data?.message ?? 'Erro ao excluir produto.', 'error');
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Produtos</h1>
          <p className="page-subtitle">{produtos.length} produto{produtos.length !== 1 ? 's' : ''} em estoque</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setFormError(''); setModalOpen(true); }}>
          + Novo Produto
        </button>
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <span className="table-toolbar-title">Estoque de produtos</span>
        </div>

        {produtos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <p>Nenhum produto cadastrado.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p, idx) => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{idx + 1}</td>
                  <td>📦 {p.nome}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.descricao || '—'}</td>
                  <td>
                    <span className="badge badge-success" style={{ fontFamily: 'var(--font-mono)' }}>
                      R$ {Number(p.preco).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${p.estoque > 0 ? 'badge-info' : 'badge-danger'}`}>
                      {p.estoque} un.
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => abrirEdicao(p)}>
                        Editar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirmId(p.id)}>
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
      <Modal isOpen={modalOpen} title="Novo Produto" onClose={() => setModalOpen(false)}>
        {formError && <div className="alert alert-error">{formError}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input name="nome" className="form-input" placeholder="Ex: Pomada Modeladora" value={form.nome} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <input name="descricao" className="form-input" placeholder="Descrição opcional" value={form.descricao} onChange={handleChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Preço (R$) *</label>
              <input name="preco" type="number" step="0.01" min="0.01" className="form-input" placeholder="0.00" value={form.preco} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Estoque *</label>
              <input name="estoque" type="number" min="0" className="form-input" placeholder="0" value={form.estoque} onChange={handleChange} required />
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
      <Modal isOpen={editModalOpen} title={`Editar Produto — ${editando?.nome}`} onClose={() => setEditModalOpen(false)}>
        {editError && <div className="alert alert-error">{editError}</div>}
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input name="nome" className="form-input" value={editForm.nome} onChange={handleEditChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <input name="descricao" className="form-input" value={editForm.descricao} onChange={handleEditChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Preço (R$) *</label>
              <input name="preco" type="number" step="0.01" min="0.01" className="form-input" value={editForm.preco} onChange={handleEditChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Estoque *</label>
              <input name="estoque" type="number" min="0" className="form-input" value={editForm.estoque} onChange={handleEditChange} required />
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
        title="Excluir Produto"
        message="Tem certeza que deseja excluir este produto?"
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}
