import api from './axios';

export const barbeiroService = {
  listar: () =>
    api.get('/barbeiros').then((r) => r.data),

  buscarPorId: (id) =>
    api.get(`/barbeiros/${id}`).then((r) => r.data),

  criar: (data) =>
    api.post('/barbeiros', data).then((r) => r.data),

  atualizar: (id, data) =>
    api.put(`/barbeiros/${id}`, data).then((r) => r.data),

  deletar: (id) =>
    api.delete(`/barbeiros/${id}`),
};
