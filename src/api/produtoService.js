import api from './axios';

export const produtoService = {
  listar: () =>
    api.get('/produtos').then((r) => r.data),

  buscarPorId: (id) =>
    api.get(`/produtos/${id}`).then((r) => r.data),

  criar: (data) =>
    api.post('/produtos', data).then((r) => r.data),

  atualizar: (id, data) =>
    api.put(`/produtos/${id}`, data).then((r) => r.data),

  deletar: (id) =>
    api.delete(`/produtos/${id}`),
};
