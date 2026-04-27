/**
 * Modal de confirmação para ações destrutivas.
 * Substitui o window.confirm() nativo do browser, que:
 *   - Bloqueia a thread do JS
 *   - Não pode ser estilizado
 *   - Parece desatualizado
 *
 * Uso:
 *   <ConfirmModal
 *     isOpen={confirmOpen}
 *     title="Excluir cliente"
 *     message="Tem certeza? Esta ação não pode ser desfeita."
 *     onConfirm={handleDelete}
 *     onCancel={() => setConfirmOpen(false)}
 *   />
 */
export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  danger = true,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal"
        style={{ maxWidth: 400 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 14 }}>
            {message}
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
