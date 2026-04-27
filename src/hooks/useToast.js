import { useState, useCallback } from 'react';

/**
 * Hook que gerencia uma fila de notificações toast.
 *
 * Como funciona:
 * - addToast(mensagem, tipo) adiciona um toast à lista
 * - Após 4 segundos, o toast some automaticamente (setTimeout)
 * - removeToast(id) remove manualmente (botão X)
 *
 * Uso:
 *   const { toasts, addToast, removeToast } = useToast();
 *   addToast('Cliente criado!', 'success');
 *   addToast('Erro ao salvar', 'error');
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    // Cria ID único combinando timestamp + random para evitar colisões
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Remove automaticamente após 4 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
