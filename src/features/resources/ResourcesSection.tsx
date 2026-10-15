import { useRef, useState } from "react";
import { Link2, Paperclip, Plus, Trash2 } from "lucide-react";
import { Modal } from "../../shared/ui/Modal";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { useToast } from "../../shared/ui/toast";
import { resources } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { formatFileSize } from "../../lib/format";
import { useFileUpload, openFile, ACCEPTED_EXTENSIONS } from "./uploads";
import type { Resource, ResourceType } from "../data/types";

const TYPES: ResourceType[] = ["YouTube Video", "PDF", "Website", "Online Course", "Document", "Personal Resource"];

// Resources linked to a subject (and optionally a topic). A resource is
// either a web address starting with https:// or a file up to 25 MB.
export function ResourcesSection({ subjectId, topicId }: { subjectId: string; topicId?: string }) {
  const list = resources.useList();
  const mutations = resources.useMutations();
  const upload = useFileUpload();
  const { show } = useToast();
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<Resource | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const items = (list.data ?? []).filter((resource) => resource.subjectId === subjectId && !resource.attachType);

  async function onPick(file: File | undefined) {
    if (!file) return;
    const result = await upload.run(file);
    if (!result) return;
    mutations.create.mutate({
      title: result.fileName,
      type: file.type === "application/pdf" ? "PDF" : "Document",
      url: "",
      fileId: result.fileId,
      fileName: result.fileName,
      fileSize: result.fileSize,
      subjectId,
      topicId
    }, { onSuccess: () => show("Resource added.", "success") });
    if (fileRef.current) fileRef.current.value = "";
  }

  function open(resource: Resource) {
    if (resource.fileId) { void openFile(resource.fileId); return; }
    if (resource.url) window.open(resource.url, "_blank", "noopener");
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Resources</h3>
        <div className="row">
          <input ref={fileRef} type="file" accept={ACCEPTED_EXTENSIONS} hidden onChange={(event) => onPick(event.target.files?.[0])} />
          <button className="ghost-button" disabled={upload.uploading} onClick={() => fileRef.current?.click()}><Paperclip size={15} /> {upload.uploading ? "Uploading…" : "Upload file"}</button>
          <button className="ghost-button" onClick={() => setCreating(true)}><Plus size={15} /> Add link</button>
        </div>
      </div>

      {upload.error ? <div className="field-error">{upload.error}</div> : null}
      {items.length === 0 ? (
        <p className="muted">No resources yet. Add a link or upload a file.</p>
      ) : (
        <div className="list-stack">
          {items.map((resource) => (
            <div key={recordId(resource)} className="list-row">
              <div className="list-row-main">
                <strong>{resource.title}</strong>
                <span className="muted">{resource.type}{resource.fileSize ? ` · ${formatFileSize(resource.fileSize)}` : ""}</span>
              </div>
              <div className="row">
                <button className="ghost-button" onClick={() => open(resource)}><Link2 size={14} /> Open</button>
                <button className="icon-button" title="Remove" onClick={() => setRemoving(resource)}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating ? (
        <ResourceLinkModal
          onClose={() => setCreating(false)}
          onSubmit={(values) => mutations.create.mutate({ ...values, subjectId, topicId }, { onSuccess: () => { setCreating(false); show("Resource added.", "success"); } })}
        />
      ) : null}

      {removing ? (
        <ConfirmDialog
          title="Remove resource"
          message="Remove this resource? This cannot be undone."
          onCancel={() => setRemoving(null)}
          onConfirm={() => mutations.remove.mutate({ id: recordId(removing) }, { onSuccess: () => setRemoving(null) })}
        />
      ) : null}
    </div>
  );
}

function ResourceLinkModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (values: { title: string; type: ResourceType; url: string; description: string }) => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ResourceType>("Website");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  return (
    <Modal title="Add resource link" onClose={onClose} dirty={Boolean(title.trim() || url.trim() || description.trim())}>
      <div className="field-grid">
        <label className="form-field field-span">
          <span>Title</span>
          <input value={title} onChange={(event) => { setTitle(event.target.value); setError(""); }} />
        </label>
        <div className="form-field field-span">
          <span>Type</span>
          <div className="choice-row" role="radiogroup" aria-label="Resource type">
            {TYPES.map((option) => (
              <button key={option} type="button" role="radio" aria-checked={type === option} className={`choice ${type === option ? "selected" : ""}`} onClick={() => setType(option)}>{option}</button>
            ))}
          </div>
        </div>
        <label className="form-field field-span">
          <span>Link</span>
          <input value={url} onChange={(event) => { setUrl(event.target.value); setError(""); }} placeholder="https://" />
        </label>
        <label className="form-field field-span">
          <span>Description (optional)</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
      </div>
      {error ? <div className="field-error">{error}</div> : null}
      <div className="modal-actions">
        <button className="icon-button" onClick={onClose}>Cancel</button>
        <button
          className="primary-button"
          onClick={() => {
            if (!title.trim()) { setError("Title is required."); return; }
            if (!url.startsWith("http://") && !url.startsWith("https://")) { setError("Enter a web address starting with https://"); return; }
            onSubmit({ title: title.trim(), type, url, description: description.trim() });
          }}
        >
          Save resource
        </button>
      </div>
    </Modal>
  );
}
