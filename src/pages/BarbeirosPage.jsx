import { useState, useEffect, useCallback } from 'react';
import { barbeiroService } from '../api/barbeiroService';
import Modal from '../components/Modal';

export default function BarbeirosPage() {
  const [barbeiros, setBarbeiros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nome: '', telefone: '' });

  const carregar = useCallback(() => {
    setLoading(true);
    barbeiroService
      .listar()
      .then(setBarbeiros)
      .catch(() => setError('Erro ao carregar barbeiros'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await barbeiroService.criar(form);
      setModalOpen(false);
      setForm({ nome: '', telefone: '' });
      carregar();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erro ao salvar barbeiro');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletar = async (id, nome) => {
    if (!confirm(`Deseja remover o barbeiro "${nome}"?`)) return;
    try {
      await barbeiroService.deletar(id);
      carregar();
    } catch {
      alert('Erro ao remover barbeiro. Pode haver agendamentos vinculados.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Barbeiros</h1>
          <p className="page-subtitle">{barbeiros.length} barbeiros cadastrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + Novo Barbeiro
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrapper">
        <div className="table-toolbar">
          <span className="table-toolbar-title">Equipe</span>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : barbeiros.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✂️</div>
            <p>Nenhum barbeiro cadastrado</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nome</th>
                <th>Telefone</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {barbeiros.map((b) => (
                <tr key={b.id}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {b.id}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    <span style={{ marginRight: 8 }}>✂️</span>
                    {b.nome}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{b.telefone || '—'}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => handleDeletar(b.id, b.nome)}
                      >
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <Modal title="Novo Barbeiro" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input
                  name="nome"
                  className="form-input"
                  placeholder="Nome do barbeiro"
                  value={form.nome}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input
                  name="telefone"
                  className="form-input"
                  placeholder="(11) 99999-9999"
                  value={form.telefone}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Salvar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
