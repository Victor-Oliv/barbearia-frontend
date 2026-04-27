/**
 * Página de Clientes
 * Demonstra o padrão CRUD completo:
 * - Listar todos
 * - Criar via modal
 * - Deletar com confirmação
 */
import { useState, useEffect, useCallback } from 'react';
import { clienteService } from '../api/clienteService';
import Modal from '../components/Modal';

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', senha: '' });
  const [search, setSearch] = useState('');

  const carregar = useCallback(() => {
    setLoading(true);
    clienteService
      .listar()
      .then(setClientes)
      .catch(() => setError('Erro ao carregar clientes'))
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
      await clienteService.criar(form);
      setModalOpen(false);
      setForm({ nome: '', telefone: '', email: '', senha: '' });
      carregar();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erro ao salvar cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletar = async (id, nome) => {
    if (!confirm(`Deseja remover o cliente "${nome}"?`)) return;
    try {
      await clienteService.deletar(id);
      carregar();
    } catch {
      alert('Erro ao remover cliente');
    }
  };

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{clientes.length} clientes cadastrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + Novo Cliente
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrapper">
        <div className="table-toolbar">
          <span className="table-toolbar-title">Todos os clientes</span>
          <input
            className="form-input"
            style={{ maxWidth: 240 }}
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <p>{search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</p>
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
              {clientesFiltrados.map((c) => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {c.id}
                  </td>
                  <td style={{ fontWeight: 500 }}>{c.nome}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.email}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.telefone || '—'}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => handleDeletar(c.id, c.nome)}
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
        <Modal title="Novo Cliente" onClose={() => setModalOpen(false)}>
          {error && <div className="alert alert-error" style={{ margin: '0 24px 0' }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input
                  name="nome"
                  className="form-input"
                  placeholder="Nome completo"
                  value={form.nome}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>

              <div className="form-row">
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
                <div className="form-group">
                  <label className="form-label">E-mail *</label>
                  <input
                    name="email"
                    type="email"
                    className="form-input"
                    placeholder="email@exemplo.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Senha *</label>
                <input
                  name="senha"
                  type="password"
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                  value={form.senha}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
                <span className="form-hint">A senha é usada para o cliente acessar o sistema</span>
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
