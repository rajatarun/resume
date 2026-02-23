"use client";

import { useState } from "react";
import { SiweMessage } from "siwe";
import { useAccount, useChainId, useSignMessage } from "wagmi";

type SiweButtonProps = {
  onSuccess?: () => void;
};

export function SiweButton({ onSuccess }: SiweButtonProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync, isPending } = useSignMessage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!address) return;

    setError(null);
    setLoading(true);

    try {
      // Use the canonical nonce route and include cookies so nonce/session state is shared.
      const nonceResponse = await fetch("/api/auth/nonce", {
        cache: "no-store",
        credentials: "include"
      });

      if (!nonceResponse.ok) {
        let nonceError = "Could not fetch SIWE nonce.";

        try {
          // Bubble up API-provided errors instead of masking everything with a generic message.
          const body = (await nonceResponse.json()) as { error?: string };
          if (body.error) {
            nonceError = body.error;
          }
        } catch {
          // Ignore non-JSON error responses and keep the default message.
        }

        throw new Error(`${nonceError} (status ${nonceResponse.status})`);
      }

      const { nonce } = (await nonceResponse.json()) as { nonce: string };

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in with Ethereum to access recruiter tools.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce
      });

      const preparedMessage = message.prepareMessage();
      const signature = await signMessageAsync({ message: preparedMessage });

      const verifyResponse = await fetch("/api/siwe/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: preparedMessage, signature })
      });

      if (!verifyResponse.ok) {
        const body = (await verifyResponse.json()) as { error?: string };
        throw new Error(body.error ?? "SIWE verification failed.");
      }

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
    </div>
  );
}
