import type { Metadata } from "next";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input, Textarea } from "@/components/Input";

export const metadata: Metadata = {
  title: "Contact",
  description: "Send a message to Tarun Raja using the contact form or social links.",
  openGraph: {
    title: "Contact Tarun Raja",
    description: "Reach out for leadership roles, mentoring, and engineering collaboration.",
    url: "/contact"
  }
};

export default function ContactPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <h1 className="text-3xl font-semibold tracking-tight">Contact</h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
          Use the form below. It submits through your email client for a simple no-backend workflow.
        </p>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <form action="mailto:hello@tarunraja.dev" method="post" encType="text/plain" className="space-y-3">
            <Input required name="name" placeholder="Your name" aria-label="Your name" />
            <Input required type="email" name="email" placeholder="you@company.com" aria-label="Your email" />
            <Input name="subject" placeholder="Subject" aria-label="Subject" />
            <Textarea required name="message" placeholder="How can I help?" aria-label="Message" />
            <Button type="submit">Send via email</Button>
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Social links</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a className="focus-ring text-sky-600 underline" href="#">LinkedIn (placeholder)</a></li>
            <li><a className="focus-ring text-sky-600 underline" href="#">GitHub (placeholder)</a></li>
            <li><a className="focus-ring text-sky-600 underline" href="#">X / Twitter (placeholder)</a></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
