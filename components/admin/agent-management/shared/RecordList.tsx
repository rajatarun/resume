'use client';

import { Fragment, type ReactNode } from 'react';
import { EmptyState } from '@/components/admin/agent-management/shared/EmptyState';

/**
 * One list, two layouts.
 *
 * Agents, Teams, Roles and Departments each hand-rolled the same
 * `<table className="w-full border text-sm">`: no responsive treatment, so five
 * to seven columns were asked to fit a 390px phone; no dark mode, in an admin
 * that has it everywhere else; and no empty state. Doing it four times meant
 * fixing it four times, so it is done once here.
 *
 * Under `md` each record is a card — the primary column as its heading, the
 * rest as labelled rows, actions as full-height buttons. From `md` up it is the
 * table, which is the right shape once there is width for it.
 */

export interface RecordColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** The card's heading. Exactly one column should set it. */
  primary?: boolean;
  /** Kept in the table, dropped from the card — detail that is noise on a phone. */
  tableOnly?: boolean;
}

export interface RecordAction<T> {
  label: string;
  onClick: (row: T) => void;
  danger?: boolean;
}

export interface RecordSelection<T> {
  isSelected: (row: T) => boolean;
  onToggle: (row: T, next: boolean) => void;
  label: (row: T) => string;
}

const ACTION_BASE =
  'focus-ring min-h-[44px] rounded-lg px-3 text-sm font-medium transition md:min-h-0 md:px-0 md:py-1 md:font-normal md:underline';

function actionClass(danger?: boolean): string {
  return danger
    ? `${ACTION_BASE} border border-red-200 text-red-700 hover:bg-red-50 md:border-0 md:hover:bg-transparent dark:border-red-900/50 dark:text-red-400`
    : `${ACTION_BASE} border border-slate-300 text-slate-700 hover:bg-slate-100 md:border-0 md:hover:bg-transparent dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 md:dark:hover:bg-transparent`;
}

export function RecordList<T>({
  rows,
  rowKey,
  columns,
  actions = [],
  selection,
  expanded,
  loading,
  emptyTitle,
  emptyBody,
  emptyAction,
}: {
  rows: T[];
  rowKey: (row: T) => string;
  columns: ReadonlyArray<RecordColumn<T>>;
  actions?: ReadonlyArray<RecordAction<T>>;
  selection?: RecordSelection<T>;
  expanded?: (row: T) => ReactNode | null;
  loading: boolean;
  emptyTitle: string;
  emptyBody: string;
  emptyAction?: ReactNode;
}) {
  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading…</span>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} body={emptyBody} action={emptyAction} />;
  }

  const cardColumns = columns.filter((column) => !column.tableOnly);
  const primary = columns.find((column) => column.primary) ?? columns[0];
  const columnCount = columns.length + (selection ? 1 : 0) + (actions.length > 0 ? 1 : 0);

  return (
    <>
      {/* Phone: one card per record. */}
      <ul className="space-y-2.5 md:hidden">
        {rows.map((row) => {
          const detail = expanded?.(row) ?? null;
          return (
            <li
              key={rowKey(row)}
              className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-start gap-2.5">
                {selection && (
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0"
                    aria-label={selection.label(row)}
                    checked={selection.isSelected(row)}
                    onChange={(event) => selection.onToggle(row, event.target.checked)}
                  />
                )}
                <p className="min-w-0 flex-1 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {primary.cell(row)}
                </p>
              </div>

              <dl className="mt-2.5 space-y-1.5">
                {cardColumns
                  .filter((column) => column.key !== primary.key)
                  .map((column) => (
                    <div key={column.key} className="flex items-start justify-between gap-3">
                      <dt className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{column.header}</dt>
                      <dd className="min-w-0 break-words text-right text-sm text-slate-900 dark:text-slate-100">
                        {column.cell(row)}
                      </dd>
                    </div>
                  ))}
              </dl>

              {detail && <div className="mt-2.5 border-t pt-2.5 dark:border-slate-700">{detail}</div>}

              {actions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {actions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => action.onClick(row)}
                      className={actionClass(action.danger)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Tablet and up: the table, where the columns fit. */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              {selection && <th className="w-10 p-2.5" />}
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="p-2.5 text-left font-semibold text-slate-600 dark:text-slate-300"
                >
                  {column.header}
                </th>
              ))}
              {actions.length > 0 && (
                <th scope="col" className="p-2.5 text-left font-semibold text-slate-600 dark:text-slate-300">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const detail = expanded?.(row) ?? null;
              return (
                <Fragment key={rowKey(row)}>
                  <tr className="border-t border-slate-200 dark:border-slate-700">
                    {selection && (
                      <td className="p-2.5">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          aria-label={selection.label(row)}
                          checked={selection.isSelected(row)}
                          onChange={(event) => selection.onToggle(row, event.target.checked)}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.key} className="p-2.5 text-slate-900 dark:text-slate-100">
                        {column.cell(row)}
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className="p-2.5">
                        <div className="flex gap-3">
                          {actions.map((action) => (
                            <button
                              key={action.label}
                              type="button"
                              onClick={() => action.onClick(row)}
                              className={actionClass(action.danger)}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                  {detail && (
                    <tr className="border-t border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                      <td className="p-2.5" colSpan={columnCount}>
                        {detail}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
