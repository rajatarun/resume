"use client";

import { useEffect, useState } from "react";

type Options<T> = { defaultValues?: Partial<T>; values?: Partial<T> };

export function useForm<T extends Record<string, unknown>>(options?: Options<T>) {
  const [values, setValues] = useState<Partial<T>>(options?.values ?? options?.defaultValues ?? {});

  useEffect(() => {
    if (options?.values) setValues(options.values);
  }, [JSON.stringify(options?.values)]);

  const register = (name: keyof T) => ({
    name: String(name),
    value: (values[name] ?? "") as string,
    onChange: (event: { target: { value: unknown } }) => setValues((current) => ({ ...current, [name]: event.target.value }))
  });

  const handleSubmit = (fn: (vals: T) => void) => (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();
    fn(values as T);
  };

  const reset = (next?: Partial<T>) => setValues(next ?? options?.defaultValues ?? {});

  return { register, handleSubmit, reset };
}
