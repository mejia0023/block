interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ message, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl px-8 py-7 w-[360px] shadow-2xl">
        <p className="mb-5 text-sm">{message}</p>
        <div className="flex gap-3">
          <button
            className="bg-red-500 text-white border-none px-3.5 py-1.5 rounded-md cursor-pointer text-xs font-semibold"
            onClick={onConfirm}
          >
            Confirmar
          </button>
          <button
            className="bg-slate-200 text-slate-800 border-none px-3.5 py-1.5 rounded-md cursor-pointer text-xs"
            onClick={onCancel}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
