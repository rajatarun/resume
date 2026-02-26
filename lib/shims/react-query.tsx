"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type QueryKey = readonly unknown[];

type Listener = () => void;

class Client {
  private listeners = new Set<Listener>();
  notify() { this.listeners.forEach((l) => l()); }
  subscribe(listener: Listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  async invalidateQueries(_: { queryKey: QueryKey }) { this.notify(); }
}

const Ctx = createContext<Client | null>(null);

export class QueryClient extends Client {}

export function QueryClientProvider({ children, client }: { children: ReactNode; client: QueryClient }) {
  return <Ctx.Provider value={client}>{children}</Ctx.Provider>;
}

export function useQueryClient() {
  const c = useContext(Ctx);
  if (!c) throw new Error("Missing QueryClientProvider");
  return c;
}

export function useQuery<T>({ queryKey, queryFn, enabled = true, refetchInterval }: { queryKey: QueryKey; queryFn: () => Promise<T>; enabled?: boolean; refetchInterval?: number }) {
  const client = useQueryClient();
  const [data, setData] = useState<T | undefined>();
  const [isLoading, setLoading] = useState(enabled);
  const [isError, setError] = useState(false);
  const [error, setErrObj] = useState<unknown>();
  const inflight = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = async () => {
      inflight.current += 1;
      setLoading(true);
      setError(false);
      try {
        const result = await queryFn();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(true);
          setErrObj(err);
        }
      } finally {
        inflight.current -= 1;
        if (!cancelled && inflight.current === 0) setLoading(false);
      }
    };
    void load();
    const unsub = client.subscribe(() => { void load(); });
    return () => { cancelled = true; unsub(); };
  }, [client, enabled, JSON.stringify(queryKey)]);

  useEffect(() => {
    if (!enabled || !refetchInterval) return;
    const i = setInterval(() => void queryFn().then(setData).catch((e) => { setError(true); setErrObj(e); }), refetchInterval);
    return () => clearInterval(i);
  }, [enabled, queryFn, refetchInterval]);

  return { data, isLoading, isError, error };
}

export function useQueries({ queries }: { queries: Array<{ queryKey: QueryKey; queryFn: () => Promise<unknown>; enabled?: boolean }> }) {
  const client = useQueryClient();
  const [results, setResults] = useState<Array<{ data: unknown; isLoading: boolean; isError: boolean; error: unknown }>>(
    () => queries.map((q) => ({ data: undefined, isLoading: q.enabled !== false, isError: false, error: undefined })),
  );

  useEffect(() => {
    let cancelled = false;

    const load = async (index: number) => {
      const query = queries[index];
      if (!query || query.enabled === false) return;

      setResults((current) => current.map((item, idx) => (idx === index ? { ...item, isLoading: true, isError: false, error: undefined } : item)));

      try {
        const data = await query.queryFn();
        if (!cancelled) {
          setResults((current) => current.map((item, idx) => (idx === index ? { ...item, data, isLoading: false } : item)));
        }
      } catch (error) {
        if (!cancelled) {
          setResults((current) => current.map((item, idx) => (idx === index ? { ...item, isError: true, error, isLoading: false } : item)));
        }
      }
    };

    setResults(queries.map((q) => ({ data: undefined, isLoading: q.enabled !== false, isError: false, error: undefined })));
    queries.forEach((_, index) => {
      void load(index);
    });

    const unsub = client.subscribe(() => {
      queries.forEach((_, index) => {
        void load(index);
      });
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [client, JSON.stringify(queries.map((q) => [q.queryKey, q.enabled]))]);

  return results;
}

export function useMutation<TData = unknown, TVars = unknown>({ mutationFn, onSuccess, onError }: { mutationFn: (vars: TVars | undefined) => Promise<TData>; onSuccess?: (data: TData) => void; onError?: (error: unknown) => void }) {
  const [isPending, setPending] = useState(false);
  const [data, setData] = useState<TData | undefined>();
  const mutate = useCallback((vars?: TVars) => {
    setPending(true);
    void mutationFn(vars)
      .then((result) => {
        setData(result);
        onSuccess?.(result);
      })
      .catch((error) => onError?.(error))
      .finally(() => setPending(false));
  }, [mutationFn, onError, onSuccess]);

  return useMemo(() => ({ mutate, isPending, data }), [mutate, isPending, data]);
}
