import type { Metadata } from "next";
import { Card } from "@/components/Card";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Recruiter",
  description: "Recruiter overview for Tarun Raja with strengths, domains, and engagement model.",
  openGraph: {
    title: "Tarun Raja Recruiter Panel",
    description: "Strengths, domain focus, and how to engage.",
    url: "/recruiter"
  }
};

const strengths = [
  "Turns ambiguous requirements into high-confidence delivery plans.",
  "Balances system reliability, product velocity, and developer experience.",
  "Builds strong engineering cultures through mentoring and clear ownership models."
];

const domains = ["Cloud Architecture", "Platform Engineering", "GenAI Productization", "Mentoring & Team Leadership"];

export default function RecruiterPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <h1 className="text-3xl font-semibold tracking-tight">Recruiter panel</h1>
        <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300">
          Tarun Raja is a full-stack engineering leader with deep experience in cloud-native modernization, platform foundations,
          and production-grade GenAI initiatives.
        </p>
      </section>

      <Section title="Core strengths">
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
          {strengths.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title="Domains">
        <div className="grid gap-3 sm:grid-cols-2">
          {domains.map((item) => (
            <Card key={item} className="py-4">
              <p className="font-medium">{item}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="How to engage">
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
          <li>For leadership hiring: share role scope, team stage, and product charter.</li>
          <li>For consulting/advisory: include timeline, architecture context, and desired outcomes.</li>
          <li>For mentoring: book an appointment and submit goals through the request form.</li>
        </ul>
      </Section>
    </div>
  );
}
