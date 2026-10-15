import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

// A generic overlay used by every create/edit/delete dialog in the app --
// backdrop click and Escape both close it, matching what a native <dialog>
// gives you for free. When `dirty` is set, closing asks before discarding a
// half-filled form.
export function Modal({ children, onClose, title, dirty = false }: { children: ReactNode; onClose: () => void; title: string; dirty?: boolean }) {
  const [confirming, setConfirming] = useState(false);

  function attemptClose() {
    if (dirty) setConfirming(true);
    else onClose();
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (confirming) setConfirming(false);
      else attemptClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="modal-backdrop" role="presentation" onClick={attemptClose}>
      <div aria-modal="true" className="modal" role="dialog" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="icon-button" onClick={attemptClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {confirming ? (
          <div className="stack">
            <p>Discard this draft?</p>
            <div className="modal-actions">
              <button className="icon-button" onClick={() => setConfirming(false)}>Keep editing</button>
              <button className="primary-button danger" onClick={onClose}>Discard</button>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
