import type { Metadata } from "next";
import { AddToCalendarButtons } from "@/components/AddToCalendarButtons";
import { AppointmentForm } from "@/components/AppointmentForm";
import { Card } from "@/components/Card";
import { PageShell } from "@/components/PageShell";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Let's Talk",
  description: "Connect with Tarun Raja over a Zoom call — swap notes on engineering, AI, or anything on your mind.",
  openGraph: {
    title: "Let's Talk — Tarun Raja",
    description: "Grab time for a conversation. No agenda required, just a good discussion.",
    url: "/appointment"
  }
};

const zoomLink = process.env.NEXT_PUBLIC_ZOOM_PERSONAL_LINK || "Not configured";
const zoomMeetingId = process.env.NEXT_PUBLIC_ZOOM_MEETING_ID || "Not configured";

export default function AppointmentPage() {
  return (
    <PageShell title="Let’s Talk" intro="Grab some time for a conversation — whether you want to swap notes on engineering, AI, or just connect.">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <Section title="Zoom meeting details">
            <p className="text-sm text-slate-600 dark:text-slate-300">Zoom link: <a href={zoomLink} className="focus-ring text-sky-600 underline">{zoomLink}</a></p>
            <p className="text-sm text-slate-600 dark:text-slate-300">Meeting ID: {zoomMeetingId}</p>
            <AddToCalendarButtons title="Chat with Tarun Raja" details="A conversation with Tarun Raja" location={zoomLink} />
          </Section>
        </Card>
        <Card>
          <Section title="Send a message" description="Drop me a note and I'll follow up over email.">
            <AppointmentForm />
          </Section>
        </Card>
      </div>
    </PageShell>
  );
}
