import type { Metadata } from "next";
import { AddToCalendarButtons } from "@/components/AddToCalendarButtons";
import { AppointmentForm } from "@/components/AppointmentForm";
import { Card } from "@/components/Card";
import { PageShell } from "@/components/PageShell";
import { Section } from "@/components/Section";

export const metadata: Metadata = {
  title: "Appointment",
  description: "Book an appointment with Tarun Raja and access Zoom meeting details.",
  openGraph: {
    title: "Book an appointment with Tarun Raja",
    description: "Schedule a Zoom conversation for mentoring, architecture review, or advisory support.",
    url: "/appointment"
  }
};

const zoomLink = process.env.NEXT_PUBLIC_ZOOM_PERSONAL_LINK || "Not configured";
const zoomMeetingId = process.env.NEXT_PUBLIC_ZOOM_MEETING_ID || "Not configured";

export default function AppointmentPage() {
  return (
    <PageShell title="Book an appointment" intro="Let’s connect for mentoring, architecture strategy, or product delivery support.">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <Section title="Zoom meeting details">
            <p className="text-sm text-slate-600 dark:text-slate-300">Zoom link: <a href={zoomLink} className="focus-ring text-sky-600 underline">{zoomLink}</a></p>
            <p className="text-sm text-slate-600 dark:text-slate-300">Meeting ID: {zoomMeetingId}</p>
            <AddToCalendarButtons title="Session with Tarun Raja" details="Architecture/mentoring appointment" location={zoomLink} />
          </Section>
        </Card>
        <Card>
          <Section title="Appointment request form" description="No backend required. Your request is stored locally in the browser.">
            <AppointmentForm />
          </Section>
        </Card>
      </div>
    </PageShell>
  );
}
