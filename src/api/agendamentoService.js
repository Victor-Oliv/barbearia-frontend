import api from './axios';

export const agendamentoService = {
  listar: () =>
    api.get('/agendamentos').then((r) => r.data),

  listarPorCliente: (clienteId) =>
    api.get(`/agendamentos/cliente/${clienteId}`).then((r) => r.data),

  buscarPorId: (id) =>
    api.get(`/agendamentos/${id}`).then((r) => r.data),

  criar: (data) =>
    api.post('/agendamentos', data).then((r) => r.data),

  atualizar: (id, data) =>
    api.put(`/agendamentos/${id}`, data).then((r) => r.data),

  cancelar: (id) =>
    api.delete(`/agendamentos/${id}`),

  horariosDisponiveis: (barbeiroId, data, servicosId = []) => {
    const params = new URLSearchParams();
    params.append('data', data);
    servicosId.forEach((id) => params.append('servicosId', id));
    return api.get(`/barbeiros/${barbeiroId}/horarios-disponiveis?${params.toString()}`).then((r) => r.data);
  },
};
