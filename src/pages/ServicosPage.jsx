import { useState, useEffect, useCallback } from 'react';
import { servicoService } from '../api/servicoService';
import Modal from '../components/Modal';

export default function ServicosPage() {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nomeServico: '', descricaoServico: '', valorServico: '' });

  const carregar = useCallback(() => {
    setLoading(true);
    servicoService
      .listar()
      .then(setServicos)
      .catch(() => setError('Erro ao carregar serviços'))
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
      await servicoService.criar({
        ...form,
        valorServico: parseFloat(form.valorServico),
      });
      setModalOpen(false);
      setForm({ nomeServico: '', descricaoServico: '', valorServico: '' });
      carregar();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erro ao salvar serviço');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletar = async (id, nome) => {
    if (!confirm(`Deseja remover o serviço "${nome}"?`)) return;
    try {
      await servicoService.deletar(id);
      carregar();
    } catch {
      alert('Erro ao remover serviço. Pode haver agendamentos vinculados.');
    }
  };

  const total = servicos.reduce((acc, s) => acc + parseFloat(s.valorServico || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Serviços</h1>
          <p className="page-subtitle">{servicos.length} serviços disponíveis</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + Novo Serviço
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrapper">
        <div className="table-toolbar">
          <span className="table-toolbar-title">Catálogo de Serviços</span>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : servicos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🗒️</div>
            <p>Nenhum serviço cadastrado</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Serviço</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {servicos.map((s) => (
                <tr key={s.id}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {s.id}
                  </td>
                  <td style={{ fontWeight: 500 }}>{s.nomeServico}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    {s.descricaoServico || '—'}
                  </td>
                  <td>
                    <span
                      className="badge badge-success"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      R$ {parseFloat(s.valorServico).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => handleDeletar(s.id, s.nomeServico)}
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
        <Modal title="Novo Serviço" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-group">
                <label className="form-label">Nome do Serviço *</label>
                <input
                  name="nomeServico"
                  className="form-input"
                  placeholder="Ex: Corte masculino"
                  value={form.nomeServico}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descrição</label>
                <input
                  name="descricaoServico"
                  className="form-input"
                  placeholder="Descrição opcional"
                  value={form.descricaoServico}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Valor (R$) *</label>
                <input
                  name="valorServico"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={form.valorServico}
                  onChange={handleChange}
                  required
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
