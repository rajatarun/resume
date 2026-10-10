'use client';

import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { useToast } from '@/components/admin/ToastProvider';
import { ApiError, fetchJson } from '@/lib/admin/api';
import {
  FOOD_CATEGORIES,
  STAY_TYPES,
  TRIP_TYPES,
  emptyFood,
  emptyPlace,
  emptyStay,
  emptyTrip,
  emptyVisit,
  normalizeTrip,
  suggestId,
  toPayload,
  tripCounts,
  tripFromFile,
  validateTrip,
  type Trip,
  type TripPlace,
} from './tripForm';

const REBUILD_NOTE: Record<string, string> = {
  triggered: 'The site is rebuilding; /traveller updates in a few minutes.',
  'not-configured': '/traveller updates on the next site deploy.',
};

const input =
  'w-full min-w-0 rounded border px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900';
const small =
  'rounded border px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800';
const primary =
  'rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900';

function messageOf(error: unknown): string {
  if (error instanceof ApiError) {
    const details = error.details as { error?: unknown } | undefined;
    if (details && typeof details.error === 'string') return details.error;
  }
  return error instanceof Error ? error.message : 'Request failed.';
}

const blankToNull = (value: string) => (value.trim() === '' ? null : value);
const numberOrNull = (value: string) => (value.trim() === '' ? null : Number(value));

/** A labelled field; the label wraps the control so it needs no id. */
function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label
      className={`grid gap-1 text-xs text-slate-600 dark:text-slate-400 ${wide ? 'sm:col-span-2' : ''}`}
    >
      {label}
      {children}
    </label>
  );
}

function RatingSelect({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <select
      className={input}
      value={value ?? ''}
      onChange={(e) => onChange(numberOrNull(e.target.value))}
    >
      <option value="">No stars</option>
      {[5, 4, 3, 2, 1].map((n) => (
        <option key={n} value={n}>
          {'★'.repeat(n)}
        </option>
      ))}
    </select>
  );
}

/**
 * Admin → Settings → Travel data → Trips. One trip at a time: its own
 * fields, then each town with what I saw, ate and where I stayed. Save sends
 * the whole trip (PUT /admin/travel/{id}); a new trip can start blank or from
 * a JSON file, and any trip can be downloaded as JSON.
 */
export function TripEditor() {
  const toast = useToast();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Trip | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [filter, setFilter] = useState('');

  async function reload(selectId?: string) {
    try {
      const data = await fetchJson<{ trips: Trip[] }>('/admin/travel');
      const list = data.trips.map(normalizeTrip);
      list.sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));
      setTrips(list);
      if (selectId) {
        const found = list.find((t) => t.id === selectId);
        if (found) {
          setDraft(structuredClone(found));
          setIsNew(false);
        }
      }
    } catch (error) {
      setLoadError(messageOf(error));
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const problems = useMemo(() => (draft ? validateTrip(draft) : []), [draft]);
  const shown = (trips ?? []).filter((t) =>
    `${t.title ?? ''} ${t.id} ${t.places.map((p) => p.city ?? '').join(' ')}`
      .toLowerCase()
      .includes(filter.toLowerCase()),
  );

  const edit = (change: (trip: Trip) => void) =>
    setDraft((current) => {
      if (!current) return current;
      const next = structuredClone(current);
      change(next);
      return next;
    });
  const editPlace = (i: number, change: (place: TripPlace) => void) =>
    edit((t) => change(t.places[i]));

  function open(trip: Trip) {
    setDraft(structuredClone(trip));
    setIsNew(false);
    setConfirmDelete(false);
  }

  function startNew() {
    setDraft(emptyTrip());
    setIsNew(true);
    setConfirmDelete(false);
  }

  async function save() {
    if (!draft || problems.length) return;
    setBusy(true);
    try {
      const body = toPayload(draft);
      if (isNew && trips?.some((t) => t.id === body.id)) {
        throw new Error(`A trip with id ${body.id} already exists. Open it, or pick another id.`);
      }
      const saved = await fetchJson<{ trip: Trip; rebuild: string }>(
        `/admin/travel/${encodeURIComponent(body.id)}`,
        { method: 'PUT', body },
      );
      toast.success(
        `Saved “${saved.trip.title ?? saved.trip.id}”. ${REBUILD_NOTE[saved.rebuild] ?? ''}`,
      );
      await reload(saved.trip.id);
    } catch (error) {
      toast.error(messageOf(error));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!draft || isNew) return;
    setBusy(true);
    try {
      await fetchJson(`/admin/travel/${encodeURIComponent(draft.id)}`, { method: 'DELETE' });
      toast.success(`Deleted “${draft.title ?? draft.id}”.`);
      setDraft(null);
      setConfirmDelete(false);
      await reload();
    } catch (error) {
      toast.error(messageOf(error));
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!draft) return;
    const blob = new Blob([JSON.stringify(toPayload(draft), null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draft.id || 'trip'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function uploadOne(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const trip = tripFromFile(JSON.parse(await file.text()));
      // Opens in the form first: nothing is saved until Save.
      setDraft(trip);
      setIsNew(!trips?.some((t) => t.id === trip.id));
      setConfirmDelete(false);
      toast.success(`Loaded “${trip.title ?? trip.id}” from ${file.name}. Check it, then Save.`);
    } catch (error) {
      toast.error(
        error instanceof SyntaxError ? `${file.name} is not valid JSON.` : messageOf(error),
      );
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium">Trips</h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={small} onClick={startNew} disabled={busy}>
            New trip
          </button>
          <label
            className={`${small} cursor-pointer focus-within:ring-2 focus-within:ring-sky-500`}
          >
            Open a trip JSON
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={uploadOne}
            />
          </label>
        </div>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        One trip at a time: its towns, and what you saw, ate and where you stayed in each. Dates and
        nights stay here; the website gets the trip without them, and without fast food or the home
        area.
      </p>
      {loadError && (
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
        >
          Couldn&apos;t load the trips: {loadError}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <div className="space-y-2">
          <label className="block">
            <span className="sr-only">Find a trip</span>
            <input
              className={input}
              placeholder="Find a trip or town"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </label>
          <ul className="max-h-[36rem] space-y-1 overflow-y-auto rounded border p-1 text-sm dark:border-slate-700">
            {trips === null && !loadError && <li className="p-2 text-slate-500">Loading…</li>}
            {trips?.length === 0 && (
              <li className="p-2 text-slate-500">No trips yet. Start one with New trip.</li>
            )}
            {shown.map((trip) => {
              const c = tripCounts(trip);
              const selected = draft?.id === trip.id && !isNew;
              return (
                <li key={trip.id}>
                  <button
                    type="button"
                    onClick={() => open(trip)}
                    aria-current={selected ? 'true' : undefined}
                    className={`w-full rounded px-2 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 ${selected ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                  >
                    <span className="block font-medium">{trip.title ?? trip.id}</span>
                    <span className="block text-xs text-slate-500">
                      {trip.startDate ?? 'no date'} · {c.towns} towns
                      {c.stays ? ` · ${c.stays} stays` : ''}
                      {c.food ? ` · ${c.food} food` : ''}
                      {c.visited ? ` · ${c.visited} sights` : ''}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {!draft ? (
          <p className="rounded border border-dashed p-6 text-sm text-slate-500 dark:border-slate-700">
            Pick a trip to edit it, start a new one, or open a trip JSON.
          </p>
        ) : (
          <form
            className="min-w-0 space-y-4 rounded border p-4 dark:border-slate-700"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Title" wide>
                <input
                  className={input}
                  value={draft.title ?? ''}
                  onChange={(e) => edit((t) => (t.title = blankToNull(e.target.value)))}
                />
              </Field>
              <Field label={isNew ? 'Trip id (cannot change after saving)' : 'Trip id'}>
                <div className="flex gap-2">
                  <input
                    className={input}
                    value={draft.id}
                    readOnly={!isNew}
                    onChange={(e) => edit((t) => (t.id = e.target.value))}
                  />
                  {isNew && (
                    <button
                      type="button"
                      className={small}
                      onClick={() => edit((t) => (t.id = suggestId(t.title, t.startDate)))}
                    >
                      Suggest
                    </button>
                  )}
                </div>
              </Field>
              <Field label="Kind of trip">
                <select
                  className={input}
                  value={draft.tripType ?? ''}
                  onChange={(e) => edit((t) => (t.tripType = blankToNull(e.target.value)))}
                >
                  <option value="">Not set</option>
                  {[...new Set([...TRIP_TYPES, ...(draft.tripType ? [draft.tripType] : [])])].map(
                    (type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ),
                  )}
                </select>
              </Field>
              <Field label="Start date (admin only)">
                <input
                  type="date"
                  className={input}
                  value={draft.startDate ?? ''}
                  onChange={(e) => edit((t) => (t.startDate = blankToNull(e.target.value)))}
                />
              </Field>
              <Field label="End date (admin only)">
                <input
                  type="date"
                  className={input}
                  value={draft.endDate ?? ''}
                  onChange={(e) => edit((t) => (t.endDate = blankToNull(e.target.value)))}
                />
              </Field>
              <Field label="The story, in your words" wide>
                <textarea
                  rows={4}
                  className={input}
                  value={draft.summary ?? ''}
                  onChange={(e) => edit((t) => (t.summary = blankToNull(e.target.value)))}
                />
              </Field>
              <Field label="What stayed with you (one per line)" wide>
                <textarea
                  rows={3}
                  className={input}
                  value={draft.highlights.join('\n')}
                  onChange={(e) => edit((t) => (t.highlights = e.target.value.split('\n')))}
                />
              </Field>
            </div>
            {draft.photos.length > 0 && (
              <p className="text-xs text-slate-500">
                {draft.photos.length} photos from Ask Photos are kept as they are.
              </p>
            )}

            {draft.places.map((place, i) => (
              // eslint-disable-next-line react/no-array-index-key -- rows are fully controlled; position is the identity
              <fieldset key={i} className="space-y-3 rounded border p-3 dark:border-slate-700">
                <legend className="px-1 text-sm font-medium">
                  Town {i + 1}
                  {place.city ? `: ${place.city}` : ''}
                </legend>
                <div className="grid gap-2 sm:grid-cols-5">
                  <Field label="Town">
                    <input
                      className={input}
                      value={place.city ?? ''}
                      onChange={(e) => editPlace(i, (p) => (p.city = blankToNull(e.target.value)))}
                    />
                  </Field>
                  <Field label="State / region">
                    <input
                      className={input}
                      value={place.region ?? ''}
                      onChange={(e) =>
                        editPlace(i, (p) => (p.region = blankToNull(e.target.value)))
                      }
                    />
                  </Field>
                  <Field label="Country (US, IN…)">
                    <input
                      className={input}
                      maxLength={2}
                      value={place.countryCode ?? ''}
                      onChange={(e) =>
                        editPlace(i, (p) => (p.countryCode = blankToNull(e.target.value)))
                      }
                    />
                  </Field>
                  <Field label="Latitude">
                    <input
                      type="number"
                      step="any"
                      className={input}
                      value={place.lat ?? ''}
                      onChange={(e) => editPlace(i, (p) => (p.lat = numberOrNull(e.target.value)))}
                    />
                  </Field>
                  <Field label="Longitude">
                    <input
                      type="number"
                      step="any"
                      className={input}
                      value={place.lng ?? ''}
                      onChange={(e) => editPlace(i, (p) => (p.lng = numberOrNull(e.target.value)))}
                    />
                  </Field>
                </div>

                <Rows
                  title="What you saw"
                  addLabel="Add a sight"
                  count={place.visited.length}
                  onAdd={() => editPlace(i, (p) => p.visited.push(emptyVisit()))}
                >
                  {place.visited.map((visit, j) => (
                    // eslint-disable-next-line react/no-array-index-key -- rows are fully controlled; position is the identity
                    <Row key={j} onRemove={() => editPlace(i, (p) => p.visited.splice(j, 1))}>
                      <Field label="Name">
                        <input
                          className={input}
                          value={visit.name}
                          onChange={(e) =>
                            editPlace(i, (p) => (p.visited[j].name = e.target.value))
                          }
                        />
                      </Field>
                      <Field label="A line about it" wide>
                        <input
                          className={input}
                          value={visit.note ?? ''}
                          onChange={(e) =>
                            editPlace(i, (p) => (p.visited[j].note = blankToNull(e.target.value)))
                          }
                        />
                      </Field>
                    </Row>
                  ))}
                </Rows>

                <Rows
                  title="Where you stayed"
                  addLabel="Add a stay"
                  count={place.stays.length}
                  onAdd={() => editPlace(i, (p) => p.stays.push(emptyStay()))}
                >
                  {place.stays.map((stay, j) => (
                    // eslint-disable-next-line react/no-array-index-key -- rows are fully controlled; position is the identity
                    <Row key={j} onRemove={() => editPlace(i, (p) => p.stays.splice(j, 1))}>
                      <Field label="Name (listing or hotel)">
                        <input
                          className={input}
                          value={stay.name ?? ''}
                          onChange={(e) =>
                            editPlace(i, (p) => (p.stays[j].name = blankToNull(e.target.value)))
                          }
                        />
                      </Field>
                      <Field label="Kind">
                        <select
                          className={input}
                          value={stay.type}
                          onChange={(e) =>
                            editPlace(
                              i,
                              (p) =>
                                (p.stays[j].type = e.target
                                  .value as Trip['places'][number]['stays'][number]['type']),
                            )
                          }
                        >
                          {STAY_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Your stars">
                        <RatingSelect
                          value={stay.rating}
                          onChange={(v) => editPlace(i, (p) => (p.stays[j].rating = v))}
                        />
                      </Field>
                      <Field label="Check-in (admin only)">
                        <input
                          type="date"
                          className={input}
                          value={stay.checkIn ?? ''}
                          onChange={(e) =>
                            editPlace(i, (p) => (p.stays[j].checkIn = blankToNull(e.target.value)))
                          }
                        />
                      </Field>
                      <Field label="Nights (admin only)">
                        <input
                          type="number"
                          min={1}
                          max={365}
                          className={input}
                          value={stay.nights ?? ''}
                          onChange={(e) =>
                            editPlace(i, (p) => (p.stays[j].nights = numberOrNull(e.target.value)))
                          }
                        />
                      </Field>
                      <Field label="Your review" wide>
                        <textarea
                          rows={2}
                          className={input}
                          value={stay.review ?? ''}
                          onChange={(e) =>
                            editPlace(i, (p) => (p.stays[j].review = blankToNull(e.target.value)))
                          }
                        />
                      </Field>
                    </Row>
                  ))}
                </Rows>

                <Rows
                  title="Where you ate"
                  addLabel="Add a café or restaurant"
                  count={place.food.length}
                  onAdd={() => editPlace(i, (p) => p.food.push(emptyFood()))}
                >
                  {place.food.map((food, j) => (
                    // eslint-disable-next-line react/no-array-index-key -- rows are fully controlled; position is the identity
                    <Row key={j} onRemove={() => editPlace(i, (p) => p.food.splice(j, 1))}>
                      <Field label="Name">
                        <input
                          className={input}
                          value={food.name}
                          onChange={(e) => editPlace(i, (p) => (p.food[j].name = e.target.value))}
                        />
                      </Field>
                      <Field label="Kind">
                        <select
                          className={input}
                          value={food.category}
                          onChange={(e) =>
                            editPlace(
                              i,
                              (p) =>
                                (p.food[j].category = e.target
                                  .value as Trip['places'][number]['food'][number]['category']),
                            )
                          }
                        >
                          {FOOD_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Your stars">
                        <RatingSelect
                          value={food.rating}
                          onChange={(v) => editPlace(i, (p) => (p.food[j].rating = v))}
                        />
                      </Field>
                      <Field label="A line about it">
                        <input
                          className={input}
                          value={food.note ?? ''}
                          onChange={(e) =>
                            editPlace(i, (p) => (p.food[j].note = blankToNull(e.target.value)))
                          }
                        />
                      </Field>
                      <Field label="Your review" wide>
                        <textarea
                          rows={2}
                          className={input}
                          value={food.review ?? ''}
                          onChange={(e) =>
                            editPlace(i, (p) => (p.food[j].review = blankToNull(e.target.value)))
                          }
                        />
                      </Field>
                    </Row>
                  ))}
                </Rows>

                <button
                  type="button"
                  className={`${small} text-red-700 dark:text-red-300`}
                  onClick={() => edit((t) => t.places.splice(i, 1))}
                >
                  Remove this town
                </button>
              </fieldset>
            ))}
            <button
              type="button"
              className={small}
              onClick={() => edit((t) => t.places.push(emptyPlace()))}
            >
              Add a town
            </button>

            {problems.length > 0 && (
              <ul
                role="alert"
                className="list-disc space-y-1 rounded border border-amber-300 bg-amber-50 p-3 pl-6 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
              >
                {problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t pt-3 dark:border-slate-700">
              <button type="submit" className={primary} disabled={busy || problems.length > 0}>
                {busy ? 'Saving…' : isNew ? 'Save new trip' : 'Save trip'}
              </button>
              <button type="button" className={small} onClick={download}>
                Download JSON
              </button>
              {!isNew &&
                (confirmDelete ? (
                  <span className="flex items-center gap-2 text-sm">
                    Delete “{draft.title ?? draft.id}” for good?
                    <button
                      type="button"
                      className={`${small} text-red-700 dark:text-red-300`}
                      onClick={() => void remove()}
                      disabled={busy}
                    >
                      Yes, delete
                    </button>
                    <button type="button" className={small} onClick={() => setConfirmDelete(false)}>
                      Keep it
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className={`${small} text-red-700 dark:text-red-300`}
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete trip
                  </button>
                ))}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Rows({
  title,
  addLabel,
  count,
  onAdd,
  children,
}: {
  title: string;
  addLabel: string;
  count: number;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {title} {count > 0 && `(${count})`}
      </p>
      {children}
      <button type="button" className={small} onClick={onAdd}>
        {addLabel}
      </button>
    </div>
  );
}

function Row({ children, onRemove }: { children: ReactNode; onRemove: () => void }) {
  return (
    <div className="grid gap-2 rounded bg-slate-50 p-2 sm:grid-cols-3 dark:bg-slate-900/50">
      {children}
      <div className="flex items-end">
        <button type="button" className={small} onClick={onRemove}>
          Remove
        </button>
      </div>
    </div>
  );
}
