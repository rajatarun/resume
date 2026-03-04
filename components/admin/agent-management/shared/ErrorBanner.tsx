'use client';

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-center justify-between rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      <span>{message}</span>
      <button
        type="button"
        className="ml-2 rounded border border-red-300 px-2 py-0.5 text-xs"
        onClick={onDismiss}
      >
        Dismiss
      </button>
    </div>
  );
}
