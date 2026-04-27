import { useEffect, useState } from 'react';

/**
 * Container que renderiza todos os toasts ativos.
 * Posicionado no canto inferior direito da tela via CSS position:fixed.
 */
export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

/**
 * Item individual de toast.
 * Usa um useEffect para disparar a animação de entrada logo após montar.
 * O ícone muda conforme o tipo: success ✓ | error ✕ | info ℹ
 */
function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // requestAnimationFrame garante que o CSS transition seja disparado
    // (o elemento precisa ser pintado antes de aplicar a classe .visible)
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const icons = { success: '✓', error: '✕', info: 'ℹ' };

  return (
    <div className={`toast toast-${toast.type}${visible ? ' toast-visible' : ''}`}>
      <span className="toast-icon">{icons[toast.type] ?? 'ℹ'}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={() => onRemove(toast.id)}>
        ×
      </button>
    </div>
  );
}
