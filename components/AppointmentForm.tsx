"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/Button";
import { Input, Textarea } from "@/components/Input";

export function AppointmentForm() {
  const [saved, setSaved] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    localStorage.setItem("appointmentRequest", JSON.stringify(Object.fromEntries(formData.entries())));
    setSaved(true);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input required name="name" placeholder="Your name" aria-label="Name" />
      <Input required type="email" name="email" placeholder="Your email" aria-label="Email" />
      <Textarea required name="agenda" placeholder="Meeting agenda" aria-label="Agenda" />
      <Input required name="preferredTime" placeholder="Preferred time (timezone included)" aria-label="Preferred time" />
      <div className="flex items-center gap-3">
        <Button type="submit">Save request</Button>
        <a className="focus-ring text-sm text-sky-600 underline" href="mailto:hello@tarunraja.dev?subject=Appointment%20Request">Use email fallback</a>
      </div>
      {saved ? <p className="text-sm text-emerald-600">Saved locally in your browser. I will confirm timing by email.</p> : null}
    </form>
  );
}
