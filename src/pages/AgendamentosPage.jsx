/**
 * Página de Agendamentos
 *
 * Conceito — Carregar dados dependentes:
 * O formulário de agendamento precisa de clientes, barbeiros e serviços
 * para popular os selects. Usamos Promise.all para carregar tudo em paralelo
 * quando o modal abre.
 */
import { useState, useEffect, useCallback } from 'react';
import { agendamentoService } from '../api/agendamentoService';
import { clienteService } from '../api/clienteService';
import { barbeiroService } from '../api/barbeiroService';
import { servicoService } from '../api/servicoService';
import Modal from '../components/Modal';

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Dados para os selects do formulário
  const [clientes, setClientes] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [servicos, setServicos] = useState([]);

  const [form, setForm] = useState({
    clienteId: '',
    barbeiroId: '',
    data: '',
    hora: '',
    servicosId: [],
  });

  const carregar = useCallback(() => {
    setLoading(true);
    agendamentoService
      .listar()
      .then(setAgendamentos)
      .catch(() => setError('Erro ao carregar agendamentos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // Carrega os dados do formulário quando o modal abre
  const abrirModal = () => {
    setModalOpen(true);
    setFormLoading(true);
    setError('');
    Promise.all([
      clienteService.listar(),
      barbeiroService.listar(),
      servicoService.listar(),
    ])
      .then(([c, b, s]) => {
        setClientes(c);
        setBarbeiros(b);
        setServicos(s);
      })
      .catch(() => setError('Erro ao carregar dados do formulário'))
      .finally(() => setFormLoading(false));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleServico = (id) => {
    setForm((prev) => ({
      ...prev,
      servicosId: prev.servicosId.includes(id)
        ? prev.servicosId.filter((s) => s !== id)
        : [...prev.servicosId, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await agendamentoService.criar({
        clienteId: Number(form.clienteId),
        barbeiroId: Number(form.barbeiroId),
        data: form.data,
        hora: form.hora + ':00', // backend espera HH:mm:ss
        servicosId: form.servicosId,
      });
      setModalOpen(false);
      setForm({ clienteId: '', barbeiroId: '', data: '', hora: '', servicosId: [] });
      carregar();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erro ao criar agendamento');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelar = async (id) => {
    if (!confirm('Deseja cancelar este agendamento?')) return;
    try {
      await agendamentoService.cancelar(id);
      carregar();
    } catch {
      alert('Erro ao cancelar agendamento');
    }
  };

  // Total selecionado no formulário
  const totalSelecionado = form.servicosId.reduce((acc, id) => {
    const s = servicos.find((sv) => sv.id === id);
    return acc + (s ? parseFloat(s.valorServico) : 0);
  }, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Agendamentos</h1>
          <p className="page-subtitle">{agendamentos.length} no total</p>
        </div>
        <button className="btn btn-primary" onClick={abrirModal}>
          + Novo Agendamento
        </button>
      </div>

      {error && !modalOpen && <div className="alert alert-error">{error}</div>}

      <div className="table-wrapper">
        <div className="table-toolbar">
          <span className="table-toolbar-title">Todos os agendamentos</span>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : agendamentos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <p>Nenhum agendamento cadastrado</p>
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
              {[...agendamentos]
                .sort((a, b) => {
                  const da = a.data + a.hora;
                  const db = b.data + b.hora;
                  return db.localeCompare(da);
                })
                .map((ag) => {
                  const dataFormatada = new Date(ag.data + 'T00:00:00').toLocaleDateString('pt-BR');
                  const isHoje = ag.data === new Date().toISOString().split('T')[0];
                  return (
                    <tr key={ag.id}>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {ag.id}
                      </td>
                      <td>
                        {dataFormatada}
                        {isHoje && (
                          <span className="badge badge-info" style={{ marginLeft: 6 }}>Hoje</span>
                        )}
                      </td>
                      <td>
                        <code style={{ fontFamily: 'var(--font-mono)' }}>
                          {ag.hora.slice(0, 5)}
                        </code>
                      </td>
                      <td style={{ fontWeight: 500 }}>{ag.cliente.nome}</td>
                      <td>{ag.barbeiro.nome}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                        {ag.itens.map((i) => i.servico.nomeServico).join(', ')}
                      </td>
                      <td>
                        <span
                          className="badge badge-success"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          R$ {parseFloat(ag.valorTotal).toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => handleCancelar(ag.id)}
                          >
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <Modal title="Novo Agendamento" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}

              {formLoading ? (
                <div className="loading-center"><div className="spinner" /></div>
              ) : (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Cliente *</label>
                      <select
                        name="clienteId"
                        className="form-input"
                        value={form.clienteId}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Selecione...</option>
                        {clientes.map((c) => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Barbeiro *</label>
                      <select
                        name="barbeiroId"
                        className="form-input"
                        value={form.barbeiroId}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Selecione...</option>
                        {barbeiros.map((b) => (
                          <option key={b.id} value={b.id}>{b.nome}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Data *</label>
                      <input
                        name="data"
                        type="date"
                        className="form-input"
                        value={form.data}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Hora *</label>
                      <input
                        name="hora"
                        type="time"
                        className="form-input"
                        value={form.hora}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Serviços * ({form.servicosId.length} selecionado{form.servicosId.length !== 1 ? 's' : ''})
                    </label>
                    <div className="services-list">
                      {servicos.map((s) => (
                        <label key={s.id} className="service-item">
                          <input
                            type="checkbox"
                            checked={form.servicosId.includes(s.id)}
                            onChange={() => toggleServico(s.id)}
                          />
                          <span className="service-item-name">{s.nomeServico}</span>
                          <span className="service-item-price">
                            R$ {parseFloat(s.valorServico).toFixed(2)}
                          </span>
                        </label>
                      ))}
                    </div>
                    {form.servicosId.length === 0 && (
                      <span className="form-hint">Selecione ao menos um serviço</span>
                    )}
                    {form.servicosId.length > 0 && (
                      <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                        Total:{' '}
                        <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                          R$ {totalSelecionado.toFixed(2)}
                        </strong>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || formLoading || form.servicosId.length === 0}
              >
                {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Agendar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
