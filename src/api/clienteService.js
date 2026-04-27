import api from './axios';

/**
 * Serviços de API para Clientes.
 * Centralizar chamadas aqui evita duplicação de código nas páginas.
 * Se a URL do endpoint mudar, só precisa alterar aqui.
 */

export const clienteService = {
  listar: () =>
    api.get('/clientes').then((r) => r.data),

  buscarPorId: (id) =>
    api.get(`/clientes/${id}`).then((r) => r.data),

  criar: (data) =>
    api.post('/clientes', data).then((r) => r.data),

  atualizar: (id, data) =>
    api.put(`/clientes/${id}`, data).then((r) => r.data),

  deletar: (id) =>
    api.delete(`/clientes/${id}`),
};
