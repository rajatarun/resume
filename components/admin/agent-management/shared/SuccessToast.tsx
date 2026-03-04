'use client';

import { useEffect } from 'react';

export function SuccessToast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 2500);
    return () => window.clearTimeout(timer);
  }, [message, onDone]);

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white shadow">
      {message}
    </div>
  );
}
