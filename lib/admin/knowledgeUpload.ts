/** JSON body for POST /admin/knowledge/{finance|health}/upload */
export type KnowledgeUploadRequest = {
  filename: string;
  contentType: string;
  contentBase64: string;
};

export type KnowledgeUploadResponse = {
  bucket: string;
  key: string;
  etag?: string;
};

export const KNOWLEDGE_UPLOAD_ACCEPT =
  'image/*,.pdf,.png,.jpg,.jpeg,.gif,.webp,.bmp,.txt,application/pdf,text/plain';

export const KNOWLEDGE_UPLOAD_PATH = {
  finance: '/admin/knowledge/finance/upload',
  health: '/admin/knowledge/health/upload',
} as const;

export type KnowledgeBucket = keyof typeof KNOWLEDGE_UPLOAD_PATH;

/** Strip the `data:*;base64,` prefix from a FileReader data URL. */
export function stripDataUrlPrefix(dataUrl: string): string {
  const comma = dataUrl.indexOf(',');
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

/** Keep a useful basename; drop path segments and odd characters. */
export function sanitizeUploadFilename(original: string): string {
  const base = original.split(/[/\\]/).pop()?.trim() || 'upload';
  const cleaned = base.replace(/[^\w.\-()+ ]/g, '_').replace(/\s+/g, ' ').trim();
  return cleaned || 'upload';
}

export function cameraCaptureFilename(now = Date.now()): string {
  return `photo-${now}.jpg`;
}

export function uploadFilename(
  file: Pick<File, 'name'>,
  options?: { fromCamera?: boolean; now?: number },
): string {
  if (options?.fromCamera) return cameraCaptureFilename(options?.now);
  return sanitizeUploadFilename(file.name);
}

export function isImageUpload(file: Pick<File, 'type' | 'name'>): boolean {
  if (file.type.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|webp|bmp)$/i.test(file.name);
}

export function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Could not read file.'));
    };
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(blob);
  });
}

export async function fileToKnowledgeUploadBody(
  file: File,
  options?: { fromCamera?: boolean; now?: number },
): Promise<KnowledgeUploadRequest> {
  const dataUrl = await readBlobAsDataUrl(file);
  return {
    filename: uploadFilename(file, options),
    contentType: file.type || 'application/octet-stream',
    contentBase64: stripDataUrlPrefix(dataUrl),
  };
}
