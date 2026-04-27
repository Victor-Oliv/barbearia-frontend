import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { agendamentoService } from '../../api/agendamentoService';
import { barbeiroService } from '../../api/barbeiroService';
import { servicoService } from '../../api/servicoService';
import { configuracaoService } from '../../api/configuracaoService';

const DIAS_PT = { MONDAY:'Segunda',TUESDAY:'Terça',WEDNESDAY:'Quarta',THURSDAY:'Quinta',FRIDAY:'Sexta',SATURDAY:'Sábado',SUNDAY:'Domingo' };
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/Toast';

export default function NovoAgendamentoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const [barbeiros, setBarbeiros] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [form, setForm] = useState({ barbeiroId: '', data: '', servicosId: [], hora: '' });
  const [slotsDisponiveis, setSlotsDisponiveis] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [folgas, setFolgas] = useState([]);
  const [diasFechados, setDiasFechados] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([barbeiroService.listar(), servicoService.listar()]).then(([b, s]) => {
      setBarbeiros(b);
      setServicos(s);
    });
    configuracaoService.buscarHorario()
      .then((h) => setDiasFechados(
        ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']
          .filter((d) => !(h.diasAbertos ?? []).includes(d))
      ))
      .catch(() => {});
  }, []);

  const buscarSlots = useCallback(async (barbeiroId, data, servicosId) => {
    if (!barbeiroId || !data) return;
    setLoadingSlots(true);
    setSlotsDisponiveis([]);
    try {
      const slots = await agendamentoService.horariosDisponiveis(barbeiroId, data, servicosId);
      setSlotsDisponiveis(slots);
    } catch {
      setSlotsDisponiveis([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (!form.barbeiroId) { setFolgas([]); return; }
    configuracaoService.listarFolgas(form.barbeiroId)
      .then((list) => setFolgas(list.map((f) => f.data)))
      .catch(() => setFolgas([]));
  }, [form.barbeiroId]);

  const handleBarbeiroOuData = (field, value) => {
    const novoForm = { ...form, [field]: value, hora: '' };
    setForm(novoForm);
    buscarSlots(
      field === 'barbeiroId' ? value : novoForm.barbeiroId,
      field === 'data' ? value : novoForm.data,
      novoForm.servicosId
    );
  };

  const dataBloqueada = form.data && folgas.includes(form.data);
  const diaSemanaFechado = (() => {
    if (!form.data) return false;
    const dias = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
    const dow = dias[new Date(form.data + 'T12:00:00').getDay()];
    return diasFechados.includes(dow);
  })();

  const toggleServico = (id) => {
    setForm((prev) => {
      const ids = prev.servicosId.includes(id)
        ? prev.servicosId.filter((x) => x !== id)
        : [...prev.servicosId, id];
      return { ...prev, servicosId: ids, hora: '' };
    });
  };

  // Busca slots quando servicosId muda (após o state ser atualizado)
  useEffect(() => {
    if (form.barbeiroId && form.data) {
      buscarSlots(form.barbeiroId, form.data, form.servicosId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.servicosId]);

  const totalSelecionado = servicos
    .filter((s) => form.servicosId.includes(s.id))
    .reduce((acc, s) => acc + Number(s.valorServico), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.servicosId.length === 0) {
      setError('Selecione ao menos um serviço.');
      return;
    }
    if (!form.hora) {
      setError('Selecione um horário disponível.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await agendamentoService.criar({
        clienteId: user.id,
        barbeiroId: Number(form.barbeiroId),
        data: form.data,
        hora: form.hora + ':00',
        servicosId: form.servicosId,
      });
      addToast('Agendamento realizado com sucesso!', 'success');
      setTimeout(() => navigate('/cliente/meus-agendamentos'), 1500);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erro ao realizar agendamento.');
      addToast('Erro ao realizar agendamento.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const podeBuscarSlots = form.barbeiroId && form.data && !dataBloqueada && !diaSemanaFechado;

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div style={{ padding: '32px', maxWidth: 560, margin: '0 auto' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Novo Agendamento</h1>
            <p className="page-subtitle">Escolha barbeiro, data e serviços</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Barbeiro *</label>
              <select
                className="form-input"
                value={form.barbeiroId}
                onChange={(e) => handleBarbeiroOuData('barbeiroId', e.target.value)}
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
                onChange={(e) => handleBarbeiroOuData('data', e.target.value)}
                required
                min={new Date().toLocaleDateString('en-CA')}
              />
              {folgas.length > 0 && (
                <p style={{ fontSize: 12, color: 'var(--danger, #ef4444)', marginTop: 4 }}>
                  Datas indisponíveis: {folgas.join(', ')}
                </p>
              )}
              {dataBloqueada && (
                <p style={{ fontSize: 13, color: 'var(--danger, #ef4444)', marginTop: 4, fontWeight: 500 }}>
                  Esta data está bloqueada por folga do barbeiro. Escolha outra data.
                </p>
              )}
              {diaSemanaFechado && !dataBloqueada && (
                <p style={{ fontSize: 13, color: 'var(--danger, #ef4444)', marginTop: 4, fontWeight: 500 }}>
                  A barbearia não abre neste dia da semana.
                </p>
              )}
              {diasFechados.length > 0 && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Fechado: {diasFechados.map((d) => DIAS_PT[d]).join(', ')}
                </p>
              )}
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
                <p className="form-hint" style={{ marginTop: 8 }}>
                  Total estimado: <strong>R$ {totalSelecionado.toFixed(2)}</strong>
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Horário disponível *</label>
              {!podeBuscarSlots ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Selecione barbeiro e data para ver os horários disponíveis.
                </p>
              ) : loadingSlots ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 13 }}>
                  <span className="spinner" style={{ width: 14, height: 14 }} />
                  Buscando horários disponíveis...
                </div>
              ) : slotsDisponiveis.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--danger, #ef4444)' }}>
                  Nenhum horário disponível para esta data. Tente outra data ou barbeiro.
                </p>
              ) : (
                <div className="time-slots">
                  {slotsDisponiveis.map((slot) => (
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

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px' }}
              disabled={saving}
            >
              {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Confirmar Agendamento'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
