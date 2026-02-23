import { RecruiterGate } from "@/components/web3/RecruiterGate";

const isRecruiterGateEnabled = () => {
  const value = process.env.ENABLE_RECRUITER_GATE;
  return value?.trim().toLowerCase() === "true";
};

export default function RecruiterPage() {
  return <RecruiterGate requireWalletGate={isRecruiterGateEnabled()} />;
}
