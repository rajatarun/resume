"use client";

import { Button } from "@/components/Button";

type Props = {
  title: string;
  details: string;
  location: string;
};

export function AddToCalendarButtons({ title, details, location }: Props) {
  const start = new Date();
  start.setDate(start.getDate() + 2);
  start.setHours(16, 0, 0, 0);
  const end = new Date(start.getTime() + 30 * 60 * 1000);

  const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const googleHref = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}&dates=${formatDate(start)}/${formatDate(end)}`;

  const downloadICS = () => {
    const content = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${title}\nDESCRIPTION:${details}\nLOCATION:${location}\nDTSTART:${formatDate(start)}\nDTEND:${formatDate(end)}\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tarun-raja-appointment.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <a href={googleHref} target="_blank" rel="noreferrer" className="focus-ring inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">Add to Google Calendar</a>
      <Button type="button" onClick={downloadICS} className="bg-slate-800 hover:bg-slate-700">Download ICS</Button>
    </div>
  );
}
