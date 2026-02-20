import { RecruiterConsole } from "@/components/recruiter-console";

export default function RecruiterPage() {
  return (
    <div className="space-y-4">
      <section className="prose-card">
        <h1 className="text-2xl font-bold">Recruiter Workspace</h1>
        <p className="text-sm text-slate-600">Privacy notice: JD text is processed for this request and not stored by default.</p>
      </section>
      <RecruiterConsole />
    </div>
  );
}
