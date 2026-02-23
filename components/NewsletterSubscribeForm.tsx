"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

export function NewsletterSubscribeForm() {
  const [message, setMessage] = useState<string>("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");

    const response = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await response.json();
    setMessage(data.message);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input type="email" name="email" required placeholder="you@company.com" aria-label="Email address" />
      <Button type="submit">Subscribe</Button>
      {message ? <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p> : null}
    </form>
  );
}
