"use client";

import { useState } from "react";
import { Button } from "@/components/Button";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button onClick={handleCopy} aria-live="polite" className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
      {copied ? "Copied!" : "Copy link"}
    </Button>
  );
}
