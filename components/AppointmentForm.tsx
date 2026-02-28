"use client";

import { FormEvent } from "react";
import { Button } from "@/components/Button";
import { Input, Textarea } from "@/components/Input";

type AppointmentRequest = {
  name: string;
  email: string;
  agenda: string;
  preferredTime: string;
};

async function submitAppointment(formData: AppointmentRequest) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/public/appointment`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        agenda: formData.agenda,
        preferredTime: formData.preferredTime,
      }),
    }
  );

  const data = await res.json();

  if (data.ok) {
    alert("Request sent successfully!");
  } else {
    alert("Failed to send request");
  }
}

export function AppointmentForm() {
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await submitAppointment({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      agenda: String(formData.get("agenda") ?? ""),
      preferredTime: String(formData.get("preferredTime") ?? ""),
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Input required name="name" placeholder="Your name" aria-label="Name" />
      <Input required type="email" name="email" placeholder="Your email" aria-label="Email" />
      <Textarea required name="agenda" placeholder="Meeting agenda" aria-label="Agenda" />
      <Input required name="preferredTime" placeholder="Preferred time (timezone included)" aria-label="Preferred time" />
      <div className="flex items-center gap-3">
        <Button type="submit">Save request</Button>
        <a className="focus-ring text-sm text-sky-600 underline" href="mailto:rajatarun12@gmail.com?subject=Appointment%20Request">Use email fallback</a>
      </div>
    </form>
  );
}
