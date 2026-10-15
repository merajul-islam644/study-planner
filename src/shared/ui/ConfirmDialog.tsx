import { Modal } from "./Modal";

export function ConfirmDialog({
  message,
  onCancel,
  onConfirm,
  title,
  confirmLabel = "Delete",
  tone = "danger"
}: {
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p>{message}</p>
      <div className="modal-actions">
        <button className="icon-button" onClick={onCancel}>Cancel</button>
        <button className={`primary-button ${tone === "danger" ? "danger" : ""}`} onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
