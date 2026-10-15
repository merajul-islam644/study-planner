import { useRef } from "react";
import { Paperclip, Trash2 } from "lucide-react";
import { resources } from "../data/entities";
import { recordId } from "../../lib/blocks/data";
import { useFileUpload, openFile, ACCEPTED_EXTENSIONS } from "./uploads";
import { formatFileSize } from "../../lib/format";

// Attachments on an assignment are Resource records carrying the uploaded
// file id, name and size, linked by attachType/attachId.
export function AttachmentsField({ attachType, attachId }: { attachType: string; attachId: string }) {
  const list = resources.useList();
  const mutations = resources.useMutations();
  const upload = useFileUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  const items = (list.data ?? []).filter((resource) => resource.attachType === attachType && resource.attachId === attachId);

  async function onPick(file: File | undefined) {
    if (!file) return;
    const result = await upload.run(file);
    if (!result) return;
    mutations.create.mutate({
      title: result.fileName,
      type: "Document",
      url: "",
      fileId: result.fileId,
      fileName: result.fileName,
      fileSize: result.fileSize,
      subjectId: "",
      topicId: "",
      attachType,
      attachId
    });
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Attachments</h3>
        <button className="ghost-button" disabled={upload.uploading} onClick={() => inputRef.current?.click()}>
          <Paperclip size={15} /> {upload.uploading ? "Uploading…" : "Attach file"}
        </button>
      </div>
      <input ref={inputRef} type="file" accept={ACCEPTED_EXTENSIONS} hidden onChange={(event) => onPick(event.target.files?.[0])} />
      {upload.error ? <div className="field-error">{upload.error}</div> : null}

      {items.length === 0 ? (
        <p className="muted">No attachments yet. PDFs, images and documents up to 25 MB each.</p>
      ) : (
        <div className="list-stack">
          {items.map((item) => (
            <div key={recordId(item)} className="list-row">
              <div className="list-row-main">
                <strong>{item.fileName ?? item.title}</strong>
                <span className="muted">{formatFileSize(item.fileSize)}</span>
              </div>
              <div className="row">
                <button className="ghost-button" onClick={() => item.fileId && openFile(item.fileId)}>Open</button>
                <button className="icon-button" title="Remove" onClick={() => mutations.remove.mutate({ id: recordId(item) })}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
