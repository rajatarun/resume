"use client";

import { useState } from "react";
import { getAddress } from "ethers";
import { SiweMessage } from "siwe";
import { useAccount, useChainId, useSignMessage } from "wagmi";
import { siweNonce, siweVerify } from "@/lib/siweClient";
import { setSiweSession } from "@/lib/web3/siweClientSession";

type SiweButtonProps = {
  onSuccess?: () => void;
};

export function SiweButton({ onSuccess }: SiweButtonProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync, isPending } = useSignMessage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedInAddress, setSignedInAddress] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!address) return;

    const checksumAddress = getAddress(address);

    setError(null);
    setSignedInAddress(null);
    setLoading(true);

    try {
      const { sessionId, nonce } = await siweNonce();

      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address: checksumAddress,
        statement: "Sign in with Ethereum to access recruiter tools.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce
      });

      if (process.env.NODE_ENV === "development") {
        console.debug("[siwe] checksum", {
          original: address,
          checksummed: checksumAddress
        });
      }

      const preparedMessage = siweMessage.prepareMessage();

      if (process.env.NODE_ENV === "development") {
        console.debug("[siwe] prepared message", {
          preview: preparedMessage.slice(0, 120),
          newlineCount: (preparedMessage.match(/\n/g) ?? []).length
        });
      }

      const signature = await signMessageAsync({ message: preparedMessage });

      const verified = await siweVerify({ sessionId, message: preparedMessage, signature });

      if (!verified.token) {
        throw new Error("SIWE verification did not return a token.");
      }

      const verifiedAddress = verified.address ? getAddress(verified.address) : checksumAddress;

      setSiweSession(verified.token, verifiedAddress);
      setSignedInAddress(verifiedAddress);
      onSuccess?.();
    } catch (siweError) {
      const message = siweError instanceof Error ? siweError.message : "SIWE sign-in failed.";
      if (/rejected|denied/i.test(message)) {
        setError("Signature request rejected. Please approve the SIWE signature to sign in.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={!isConnected || loading || isPending}
        className="focus-ring rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
      >
        {loading || isPending ? "Signing in..." : "Sign in with Ethereum"}
      </button>
      {error && <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>}
      {signedInAddress && (
        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
          Signed in as {signedInAddress}
        </p>
      )}
    </div>
  );
}
