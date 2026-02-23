import { OnchainIdentity } from "@/components/web3/OnchainIdentity";

export default function OnchainPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Onchain</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Read-only wallet identity overview with ENS and native balance data.
      </p>
      <OnchainIdentity />
    </div>
  );
}
