'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { useToast } from '@/components/admin/ToastProvider';
import { ApiError, fetchJson } from '@/lib/admin/api';
import { TripEditor } from '@/components/admin/trips/TripEditor';

interface AdminTrip {
  id: string;
  title: string | null;
  startDate: string | null;
  endDate: string | null;
  places: { city: string | null; region: string | null; countryCode: string | null }[];
}

interface AdminDiningEntry {
  name: string;
  category: string;
  city: string | null;
  region: string | null;
  visits: number;
  reason?: string;
  alsoListedAs?: string[];
}

interface AdminReview {
  name: string;
  rating: number;
  matched: string[];
  public: boolean;
  hiddenBecause: string[];
}

interface AdminDining {
  uploaded: number;
  kept: AdminDiningEntry[];
  excluded: AdminDiningEntry[];
  reviews?: AdminReview[];
  notes?: Omit<AdminReview, 'rating'>[];
  updatedAt: string | null;
}

const REBUILD_NOTE: Record<string, string> = {
  triggered: 'The site is rebuilding; /traveller updates in a few minutes.',
  'not-configured': '/traveller updates on the next site deploy (no rebuild hook is set).',
};

/** The API's own error text ({"error": "..."}), which names the field that is wrong. */
function messageOf(error: unknown): string {
  if (error instanceof ApiError) {
    const details = error.details as { error?: unknown } | undefined;
    if (details && typeof details.error === 'string') return details.error;
  }
  return error instanceof Error ? error.message : 'Request failed.';
}

async function readJsonFile(event: ChangeEvent<HTMLInputElement>): Promise<unknown> {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) throw new Error('No file chosen.');
  try {
    return JSON.parse(await file.text());
  } catch {
    throw new Error(`${file.name} is not valid JSON.`);
  }
}

/**
 * The data behind /traveller, kept in the content API:
 *
 *   - the travel journal from Ask Photos (POST /admin/travel). Trips are
 *     added or replaced by id, so it can be uploaded a year at a time. Shown
 *     here with dates; the website only ever gets it without them.
 *   - cafés and restaurants from the card export (POST /admin/dining), which
 *     replaces the list. Shown here with what was left out and why; the
 *     website gets the kept list without visit counts.
 */
export function TravelDataSettings() {
  const toast = useToast();
  const [trips, setTrips] = useState<AdminTrip[] | null>(null);
  const [dining, setDining] = useState<AdminDining | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'journal' | 'dining' | 'reviews' | 'notes' | null>(null);
  const [reviewsText, setReviewsText] = useState('');
  const [replaceReviews, setReplaceReviews] = useState(false);
  const [notesText, setNotesText] = useState('');
  // Bumped after a journal upload, so the trip editor reloads its list.
  const [journalVersion, setJournalVersion] = useState(0);

  async function saveNotes() {
    setBusy('notes');
    try {
      const saved = await fetchJson<AdminDining & { rebuild: string }>('/admin/dining/notes', {
        method: 'POST',
        body: { text: notesText },
      });
      setDining(saved);
      setNotesText('');
      const notes = saved.notes ?? [];
      const shown = notes.filter((note) => note.public).length;
      toast.success(
        `Saved ${notes.length} notes; ${shown} public, ${notes.length - shown} hidden by the filters. ${REBUILD_NOTE[saved.rebuild] ?? 'The site rebuild could not be started.'}`,
      );
    } catch (error) {
      toast.error(messageOf(error));
    } finally {
      setBusy(null);
    }
  }

  async function saveReviews() {
    setBusy('reviews');
    try {
      const saved = await fetchJson<AdminDining & { rebuild: string }>('/admin/dining/reviews', {
        method: 'POST',
        body: { text: reviewsText, replace: replaceReviews },
      });
      setDining(saved);
      setReviewsText('');
      setReplaceReviews(false);
      const reviews = saved.reviews ?? [];
      const shown = reviews.filter((review) => review.public).length;
      toast.success(
        `${reviews.length} reviews saved in all; ${shown} public, ${reviews.length - shown} hidden by the filters. ${REBUILD_NOTE[saved.rebuild] ?? 'The site rebuild could not be started.'}`,
      );
    } catch (error) {
      toast.error(messageOf(error));
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    Promise.all([
      fetchJson<{ trips: AdminTrip[] }>('/admin/travel'),
      fetchJson<AdminDining>('/admin/dining'),
    ])
      .then(([journal, diningList]) => {
        setTrips(journal.trips);
        setDining(diningList);
      })
      .catch((error: unknown) => setLoadError(messageOf(error)));
  }, []);

  async function uploadJournal(event: ChangeEvent<HTMLInputElement>) {
    setBusy('journal');
    try {
      const body = await readJsonFile(event);
      const saved = await fetchJson<{ saved: number; total: number; rebuild: string }>(
        '/admin/travel',
        { method: 'POST', body },
      );
      const journal = await fetchJson<{ trips: AdminTrip[] }>('/admin/travel');
      setTrips(journal.trips);
      setJournalVersion((v) => v + 1);
      toast.success(
        `Saved ${saved.saved} trips (${saved.total} in the journal). ${REBUILD_NOTE[saved.rebuild] ?? 'The site rebuild could not be started.'}`,
      );
    } catch (error) {
      toast.error(messageOf(error));
    } finally {
      setBusy(null);
    }
  }

  async function uploadDining(event: ChangeEvent<HTMLInputElement>) {
    setBusy('dining');
    try {
      const body = await readJsonFile(event);
      const saved = await fetchJson<AdminDining & { rebuild: string }>('/admin/dining', {
        method: 'POST',
        body,
      });
      setDining(saved);
      toast.success(
        `Kept ${saved.kept.length} of ${saved.uploaded}; left out ${saved.excluded.length}. ${REBUILD_NOTE[saved.rebuild] ?? 'The site rebuild could not be started.'}`,
      );
    } catch (error) {
      toast.error(messageOf(error));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="travel-data-heading" className="space-y-5 rounded-lg border p-4">
      <div>
        <h2 id="travel-data-heading" className="text-lg font-semibold">
          Travel data
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          What <code>/traveller</code> shows. Dates and visit counts stay here: the public page gets
          the journal without dates and the cafés without counts.
        </p>
      </div>

      {loadError && (
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
        >
          Couldn&apos;t load the travel data: {loadError}
        </p>
      )}

      <TripEditor key={journalVersion} />

      <div className="grid gap-6 border-t pt-5 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="font-medium">Many trips at once</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            The Ask Photos JSON, as it comes: one year, several, or just trips. Trips with an id
            already here are replaced, so you can upload it in pieces.{' '}
            {trips && `${trips.length} trips stored.`}
          </p>
          <label className="inline-flex cursor-pointer items-center rounded bg-slate-900 px-3 py-2 text-sm text-white focus-within:ring-2 focus-within:ring-sky-500 dark:bg-slate-100 dark:text-slate-900">
            {busy === 'journal' ? 'Uploading…' : 'Upload journal JSON'}
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              disabled={busy !== null}
              onChange={uploadJournal}
            />
          </label>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium">Cafés & restaurants</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            The card-transaction export. Replaces the list. Fast food, delivery apps, card offers,
            workplace cafeterias and unreadable entries are left out.
          </p>
          <label className="inline-flex cursor-pointer items-center rounded bg-slate-900 px-3 py-2 text-sm text-white focus-within:ring-2 focus-within:ring-sky-500 dark:bg-slate-100 dark:text-slate-900">
            {busy === 'dining' ? 'Uploading…' : 'Upload cafés JSON'}
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              disabled={busy !== null}
              onChange={uploadDining}
            />
          </label>
          {dining && dining.uploaded > 0 && (
            <details className="rounded border p-3 text-sm">
              <summary className="cursor-pointer font-medium">
                {dining.kept.length} shown, {dining.excluded.length} left out
              </summary>
              <ul className="mt-2 max-h-80 space-y-1 overflow-y-auto">
                {dining.excluded.map((entry) => (
                  <li
                    key={`${entry.name}-${entry.city ?? ''}`}
                    className="flex justify-between gap-3"
                  >
                    <span>{entry.name}</span>
                    <span className="shrink-0 text-xs text-slate-500">{entry.reason}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>

      <div className="space-y-3 border-t pt-5">
        <h3 className="font-medium">Reviews</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Paste your reviews as you write them: section headings, then <code>Name — 4★</code> and a
          paragraph. Each lands on the place it names (or adds one). Saving adds to the reviews
          already saved; a place reviewed again takes the new review. A reviewed fast-food or
          home-area place stays off the public page, and so does anything under a “Local DFW”
          heading.
        </p>
        <label className="block">
          <span className="sr-only">Reviews</span>
          <textarea
            value={reviewsText}
            onChange={(event) => setReviewsText(event.target.value)}
            rows={8}
            placeholder={'Coffee Shops, Bakeries & Cafés\n\nSome Café — 5★\nWhat I like about it…'}
            className="w-full rounded border p-2 font-mono text-sm dark:bg-slate-900"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={replaceReviews}
            onChange={(event) => setReplaceReviews(event.target.checked)}
          />
          Replace all saved reviews with these
        </label>
        <button
          type="button"
          onClick={saveReviews}
          disabled={busy !== null || !reviewsText.trim()}
          className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
        >
          {busy === 'reviews' ? 'Saving…' : 'Save reviews'}
        </button>
        {dining?.reviews && dining.reviews.length > 0 && (
          <details className="rounded border p-3 text-sm">
            <summary className="cursor-pointer font-medium">
              {dining.reviews.filter((review) => review.public).length} of {dining.reviews.length}{' '}
              reviews public
            </summary>
            <ul className="mt-2 max-h-80 space-y-1 overflow-y-auto">
              {dining.reviews.map((review) => (
                <li key={review.name} className="flex justify-between gap-3">
                  <span>
                    {review.name} · {review.rating}★
                    {review.matched.length === 0 && (
                      <span className="text-slate-500"> (new place)</span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {review.public ? 'public' : `hidden: ${review.hiddenBecause.join(', ')}`}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      <div className="space-y-3 border-t pt-5">
        <h3 className="font-medium">Notes</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Places with an address, a score and a line on what they are:{' '}
          <code>* Name (address) – 4.5/5. What it is.</code> Only the city and state are kept. Each
          note lands on the place it names (or adds one) and gives it a city, so home-area places
          are caught. Scores show as plain text, never as your stars. Saving replaces all notes.
        </p>
        <label className="block">
          <span className="sr-only">Notes</span>
          <textarea
            value={notesText}
            onChange={(event) => setNotesText(event.target.value)}
            rows={8}
            placeholder={
              'Out-of-State Dining (Travel)\n * Some Place (City, ST) – 4.6/5. What it is.'
            }
            className="w-full rounded border p-2 font-mono text-sm dark:bg-slate-900"
          />
        </label>
        <button
          type="button"
          onClick={saveNotes}
          disabled={busy !== null || !notesText.trim()}
          className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
        >
          {busy === 'notes' ? 'Saving…' : 'Save notes'}
        </button>
        {dining?.notes && dining.notes.length > 0 && (
          <details className="rounded border p-3 text-sm">
            <summary className="cursor-pointer font-medium">
              {dining.notes.filter((note) => note.public).length} of {dining.notes.length} notes
              public
            </summary>
            <ul className="mt-2 max-h-80 space-y-1 overflow-y-auto">
              {dining.notes.map((note) => (
                <li key={note.name} className="flex justify-between gap-3">
                  <span>
                    {note.name}
                    {note.matched.length === 0 && (
                      <span className="text-slate-500"> (new place)</span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {note.public ? 'public' : `hidden: ${note.hiddenBecause.join(', ')}`}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </section>
  );
}
