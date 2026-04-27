import api from './axios';

export const configuracaoService = {
  buscarHorario: () =>
    api.get('/configuracoes/horario').then((r) => r.data),

  salvarHorario: (data) =>
    api.put('/configuracoes/horario', data).then((r) => r.data),

  listarFolgas: (barbeiroId) =>
    api.get(`/barbeiros/${barbeiroId}/folgas`).then((r) => r.data),

  registrarFolga: (barbeiroId, data) =>
    api.post(`/barbeiros/${barbeiroId}/folgas`, data).then((r) => r.data),

  removerFolga: (barbeiroId, folgaId) =>
    api.delete(`/barbeiros/${barbeiroId}/folgas/${folgaId}`),
};
