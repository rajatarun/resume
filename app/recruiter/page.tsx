import { RecruiterPanel } from "@/components/RecruiterPanel";
import { resume } from "@/lib/resume";

export default function RecruiterPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Recruiter</h1>
      <p className="text-sm text-zinc-500">Frontend-only recruiter tools powered by resume.json.</p>
      <RecruiterPanel data={resume} />
    </div>
  );
}
