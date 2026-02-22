import { resume } from "@/lib/resume";

export default function ContactPage() {
  return (
    <section className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
      <h1 className="text-3xl font-semibold">Contact</h1>
      <div className="mt-4 space-y-2 text-sm">
        <p><span className="font-medium">Location:</span> {resume.header.location}</p>
        <p><span className="font-medium">Phone:</span> {resume.header.phone}</p>
        <p><span className="font-medium">Email:</span> {resume.header.email}</p>
        <p><span className="font-medium">Links:</span> {resume.header.links.join(", ")}</p>
      </div>
    </section>
  );
}
