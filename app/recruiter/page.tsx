import { RecruiterPanel } from "@/components/RecruiterPanel";
import { RecruiterGate } from "@/components/web3/RecruiterGate";
import { resume } from "@/lib/resume";
import { getSessionFromCookie } from "@/lib/web3/siwe";

export default function RecruiterPage() {
  const session = getSessionFromCookie();

  if (!session) {
    return <RecruiterGate />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Recruiter</h1>
      <p className="text-sm text-zinc-500">Frontend-only recruiter tools powered by resume.json.</p>
      <RecruiterPanel data={resume} />
    </div>
  );
}
