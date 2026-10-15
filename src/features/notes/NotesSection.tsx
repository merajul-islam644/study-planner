import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "../../shared/ui/Modal";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { notes } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import type { Note } from "../data/types";

// A note belongs to one subject, topic, assignment, exam or study session.
// An empty note is discarded with no record kept.
export function NotesSection({ attachType, attachId, title = "Notes" }: { attachType: Note["attachType"]; attachId: string; title?: string }) {
  const list = notes.useList();
  const mutations = notes.useMutations();
  const [editing, setEditing] = useState<Note | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<Note | null>(null);

  const items = (list.data ?? []).filter((note) => note.attachType === attachType && note.attachId === attachId);

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>{title}</h3>
        <button className="ghost-button" onClick={() => setCreating(true)}><Plus size={15} /> Add note</button>
      </div>

      {items.length === 0 ? (
        <p className="muted">No notes yet.</p>
      ) : (
        <div className="list-stack">
          {items.map((note) => (
            <div key={recordId(note)} className="note-card">
              <div className="row-between">
                <strong>{note.title || "Untitled note"}</strong>
                <div className="row">
                  <button className="ghost-button" onClick={() => setEditing(note)}>Edit</button>
                  <button className="icon-button" title="Remove note" onClick={() => setRemoving(note)}><Trash2 size={15} /></button>
                </div>
              </div>
              <NoteBody body={note.body ?? ""} />
              {note.tags && note.tags.length > 0 ? (
                <div className="chips">{note.tags.map((tag) => <span key={tag} className="chip">#{tag}</span>)}</div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {creating || editing ? (
        <NoteModal
          initial={editing ?? undefined}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSubmit={(values) => {
            // An empty note is discarded rather than saved.
            if (!values.title.trim() && !values.body.trim()) {
              setCreating(false);
              setEditing(null);
              return;
            }
            if (editing) {
              mutations.update.mutate({ id: recordId(editing), ...values }, { onSuccess: () => setEditing(null) });
            } else {
              mutations.create.mutate({ ...values, attachType, attachId }, { onSuccess: () => setCreating(false) });
            }
          }}
        />
      ) : null}

      {removing ? (
        <ConfirmDialog
          title="Remove note"
          message="Remove this note? This cannot be undone."
          onCancel={() => setRemoving(null)}
          onConfirm={() => mutations.remove.mutate({ id: recordId(removing) }, { onSuccess: () => setRemoving(null) })}
        />
      ) : null}
    </div>
  );
}

function NoteBody({ body }: { body: string }) {
  return (
    <div className="note-body">
      {body.split("\n").map((line, index) => {
        const key = `${index}-${line.slice(0, 8)}`;
        if (line.startsWith("# ")) return <strong key={key}>{line.slice(2)}</strong>;
        if (line.startsWith("- ")) return <div key={key}>• {line.slice(2)}</div>;
        if (line.startsWith("[ ] ")) return <div key={key}>☐ {line.slice(4)}</div>;
        if (line.startsWith("[x] ")) return <div key={key}>☑ {line.slice(4)}</div>;
        return <div key={key}>{line}</div>;
      })}
    </div>
  );
}

function NoteModal({ initial, onClose, onSubmit }: { initial?: Note; onClose: () => void; onSubmit: (values: { title: string; body: string; tags: string[] }) => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));

  function insert(marker: string) {
    setBody((current) => `${current}${current.endsWith("\n") || current === "" ? "" : "\n"}${marker}`);
  }

  return (
    <Modal title={initial ? "Edit note" : "Add note"} onClose={onClose} dirty={Boolean(title.trim() || body.trim() || tags.trim())}>
      <label className="form-field">
        <span>Title (optional)</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <div className="row" style={{ gap: 6 }}>
        <button type="button" className="choice" onClick={() => insert("# Heading")}>Heading</button>
        <button type="button" className="choice" onClick={() => insert("- Bullet")}>Bullet</button>
        <button type="button" className="choice" onClick={() => insert("[ ] Checklist item")}>Checklist</button>
        <button type="button" className="choice" onClick={() => insert("[Link](https://)")}>Link</button>
      </div>
      <label className="form-field">
        <span>Body</span>
        <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={8} />
      </label>
      <label className="form-field">
        <span>Tags (comma separated)</span>
        <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="formulas, revision" />
      </label>
      <div className="modal-actions">
        <button className="icon-button" onClick={onClose}>Cancel</button>
        <button className="primary-button" onClick={() => onSubmit({ title: title.trim(), body, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean) })}>Save note</button>
      </div>
    </Modal>
  );
}
