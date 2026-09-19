import type { ReactNode } from 'react';

/**
 * A labelled field with room for an explanation.
 *
 * These forms used `placeholder` as their only label, which disappears the
 * moment you type and is not an accessible name — and left the meaning of a
 * term like "Schema Ref" entirely to the reader. A field whose name does not
 * explain itself needs a sentence, not a shorter placeholder.
 */
export function FormField({
  label,
  htmlFor,
  hint,
  footer,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  /** Detail that only makes sense once the hint has been read. */
  footer?: ReactNode;
  required?: boolean;
  children: ReactNode;
}) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      {children}
      {hint && (
        <p id={hintId} className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
      {footer}
    </div>
  );
}
