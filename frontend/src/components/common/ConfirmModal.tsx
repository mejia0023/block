interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ message, onConfirm, onCancel }: Props) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn-danger" onClick={onConfirm}>Confirmar</button>
          <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
