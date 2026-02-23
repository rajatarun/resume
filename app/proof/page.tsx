import { WalletIdentity } from "@/components/web3/WalletIdentity";
import { getSessionFromCookie } from "@/lib/web3/siwe";

export default function ProofPage() {
  const session = getSessionFromCookie();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Proof</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        View connected wallet identity details and your SIWE authentication state.
      </p>
      <WalletIdentity signedIn={Boolean(session)} lastSignIn={session?.issuedAt} />
    </div>
  );
}
