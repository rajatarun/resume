'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { useToast } from '@/components/admin/ToastProvider';
import { ApiError, fetchJson } from '@/lib/admin/api';
import {
  KNOWLEDGE_UPLOAD_ACCEPT,
  KNOWLEDGE_UPLOAD_PATH,
  fileToKnowledgeUploadBody,
  isImageUpload,
  type KnowledgeBucket,
  type KnowledgeUploadResponse,
} from '@/lib/admin/knowledgeUpload';

function messageOf(error: unknown): string {
  if (error instanceof ApiError) {
    const details = error.details as { error?: unknown; message?: unknown } | undefined;
    if (details && typeof details.error === 'string') return details.error;
    if (details && typeof details.message === 'string') return details.message;
  }
  return error instanceof Error ? error.message : 'Request failed.';
}

type PendingUpload = {
  file: File;
  previewUrl: string | null;
  fromCamera: boolean;
};

function BucketUploadPanel({
  bucket,
  label,
  description,
  busy,
  onBusyChange,
}: {
  bucket: KnowledgeBucket;
  label: string;
  description: string;
  busy: KnowledgeBucket | null;
  onBusyChange: (next: KnowledgeBucket | null) => void;
}) {
  const toast = useToast();
  const [pending, setPending] = useState<PendingUpload | null>(null);

  useEffect(() => {
    return () => {
      if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
    };
  }, [pending?.previewUrl]);

  function clearPending() {
    setPending((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  }

  function onFileChosen(event: ChangeEvent<HTMLInputElement>, fromCamera: boolean) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setPending((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      const previewUrl = isImageUpload(file) ? URL.createObjectURL(file) : null;
      return { file, previewUrl, fromCamera };
    });
  }

  async function upload() {
    if (!pending) return;
    onBusyChange(bucket);
    try {
      const body = await fileToKnowledgeUploadBody(pending.file, { fromCamera: pending.fromCamera });
      const result = await fetchJson<KnowledgeUploadResponse>(KNOWLEDGE_UPLOAD_PATH[bucket], {
        method: 'POST',
        body,
      });
      const etag = result.etag ? ` · etag ${result.etag}` : '';
      toast.success(`Uploaded to ${result.bucket}: ${result.key}${etag}`);
      clearPending();
    } catch (error) {
      toast.error(messageOf(error));
    } finally {
      onBusyChange(null);
    }
  }

  const isBusy = busy === bucket;
  const disabled = busy !== null;

  return (
    <div className="space-y-3 rounded border p-3">
      <div>
        <h3 className="font-medium">{label}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center rounded bg-slate-900 px-3 py-2 text-sm text-white focus-within:ring-2 focus-within:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900">
          Choose file
          <input
            type="file"
            accept={KNOWLEDGE_UPLOAD_ACCEPT}
            className="sr-only"
            disabled={disabled}
            onChange={(event) => onFileChosen(event, false)}
          />
        </label>
        <label className="inline-flex cursor-pointer items-center rounded border border-slate-300 px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600">
          Take picture
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={disabled}
            onChange={(event) => onFileChosen(event, true)}
          />
        </label>
      </div>

      {pending && (
        <div className="space-y-2 rounded border bg-slate-50 p-3 text-sm dark:bg-slate-900">
          <p className="font-medium">{pending.file.name || 'Selected file'}</p>
          <p className="text-xs text-slate-500">
            {pending.file.type || 'unknown type'} · {(pending.file.size / 1024).toFixed(1)} KB
            {pending.fromCamera ? ' · camera' : ''}
          </p>
          {pending.previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- admin-only preview of a local blob URL
            <img
              src={pending.previewUrl}
              alt="Preview of selected upload"
              className="max-h-40 max-w-full rounded border object-contain"
            />
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={upload}
              disabled={disabled}
              className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
            >
              {isBusy ? 'Uploading…' : 'Upload to ContextWeave'}
            </button>
            <button
              type="button"
              onClick={clearPending}
              disabled={disabled}
              className="rounded border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Upload files (or camera photos) into ContextWeave finance and health buckets
 * via the content orchestrator admin API.
 */
export function KnowledgeUploadSettings() {
  const [busy, setBusy] = useState<KnowledgeBucket | null>(null);

  return (
    <section aria-labelledby="knowledge-upload-heading" className="space-y-5 rounded-lg border p-4">
      <div>
        <h2 id="knowledge-upload-heading" className="text-lg font-semibold">
          ContextWeave knowledge
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Upload documents and photos into the finance and health knowledge buckets. Files are sent
          to the content API as base64 JSON until a multipart endpoint exists.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BucketUploadPanel
          bucket="finance"
          label="Finance"
          description="Statements, receipts, tax notes, and other finance-related documents."
          busy={busy}
          onBusyChange={setBusy}
        />
        <BucketUploadPanel
          bucket="health"
          label="Health"
          description="Lab results, insurance forms, visit summaries, and other health records."
          busy={busy}
          onBusyChange={setBusy}
        />
      </div>
    </section>
  );
}
