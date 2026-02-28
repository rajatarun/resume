"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

export function NewsletterSubscribeForm() {
  const [message, setMessage] = useState<string>("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawEmail = formData.get("email");
    const email = typeof rawEmail === "string" ? rawEmail.trim() : "";

    if (!email) {
      setMessage("Please enter a valid email address.");
      return;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/public/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = (await response.json()) as { message?: string };
    setMessage(data.message ?? (response.ok ? "Subscribed successfully." : "Unable to subscribe right now."));
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input type="email" name="email" required placeholder="you@company.com" aria-label="Email address" />
      <Button type="submit">Subscribe</Button>
      {message ? <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p> : null}
    </form>
  );
}
