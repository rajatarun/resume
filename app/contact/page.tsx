import { resumeData } from "@/lib/data/resume";

export default function ContactPage() {
  return (
    <section className="prose-card">
      <h1 className="text-2xl font-bold">Contact</h1>
      <p className="mt-2">Email: {resumeData.profile.email}</p>
      <p>Phone: {resumeData.profile.phone}</p>
      <ul className="mt-4 list-disc pl-5">
        {resumeData.profile.links.map((link) => (
          <li key={link.url}><a href={link.url} className="text-brand-700 underline">{link.label}</a></li>
        ))}
      </ul>
    </section>
  );
}
