import { useState } from "react";
import { blocksClient } from "../../lib/blocks/client";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const CONFIG_NAME = "Default";

export type UploadResult = { fileId: string; fileName: string; fileSize: number };

export const ACCEPTED_EXTENSIONS = ".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.txt,.csv,.ppt,.pptx,.xlsx";

export function fileTooLarge(file: File): boolean {
  return file.size > MAX_FILE_BYTES;
}

// Uploads a document through Blocks Data storage: request a pre-signed URL,
// then PUT the bytes to it. Access modifier Private keeps each student's
// attachments reachable only by the tenant's signed-in users.
export async function uploadFile(file: File): Promise<UploadResult> {
  if (fileTooLarge(file)) throw new Error("Files must be 25 MB or smaller.");

  const presign = (await blocksClient.data.files.presignedUploadUrl({
    name: file.name,
    configurationName: CONFIG_NAME,
    accessModifier: "Private",
    sizeInBytes: file.size,
    contentType: file.type || "application/octet-stream"
  })) as {
    uploadUrl?: string;
    fileId?: string;
    isSuccess?: boolean;
    errors?: Record<string, string>;
  };

  if (!presign || presign.isSuccess === false || !presign.uploadUrl || !presign.fileId) {
    throw new Error("We couldn't upload that file. Please try again.");
  }

  await blocksClient.data.files.uploadToUrl({
    url: presign.uploadUrl,
    body: file,
    contentType: file.type || "application/octet-stream"
  });

  return { fileId: presign.fileId, fileName: file.name, fileSize: file.size };
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function run(file: File): Promise<UploadResult | undefined> {
    setUploading(true);
    setError(undefined);
    try {
      return await uploadFile(file);
    } catch (caught) {
      setError((caught as Error).message);
      return undefined;
    } finally {
      setUploading(false);
    }
  }

  return { uploading, error, run };
}

export async function openFile(fileId: string): Promise<void> {
  const record = (await blocksClient.data.files.get(fileId, { configurationName: CONFIG_NAME })) as {
    data?: { downloadUrl?: string; url?: string };
    downloadUrl?: string;
    url?: string;
  };
  const url = record?.data?.downloadUrl ?? record?.data?.url ?? record?.downloadUrl ?? record?.url;
  if (url) window.open(url, "_blank", "noopener");
}
