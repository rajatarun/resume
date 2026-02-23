"use client";

import type { ReactNode } from "react";

export class QueryClient {}

export function QueryClientProvider({ children }: { children: ReactNode; client: QueryClient }) {
  return children;
}
