/**
 * Modal reutilizável.
 *
 * Uso:
 *   <Modal title="Novo Cliente" onClose={() => setOpen(false)}>
 *     <form>...</form>
 *   </Modal>
 */

import { useEffect } from 'react';

/**
 * Adicionado suporte à prop `isOpen` para controle declarativo.
 * Quando isOpen=false, o modal não renderiza nada (null).
 * Isso evita ter que envolver o componente com {condicao && <Modal>}.
 */
export default function Modal({ isOpen = true, title, onClose, children }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>
        {/* modal-body aplica padding: 24px em todo o conteúdo filho */}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
