"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ResumeArtifactKey } from "@/lib/artifacts";
import { artifactsByKey } from "@/lib/artifacts";
import type { ExperienceItem } from "@/lib/resume";
import { isRecruiterPassHolder } from "@/lib/recruiterPass";
import { onSiweSessionChange, restoreSiweSession } from "@/lib/web3/siweClientSession";

type ExperienceTimelineProps = {
  experience: (ExperienceItem & { artifactKey: ResumeArtifactKey })[];
  showProofLink?: boolean;
};


const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

export function ExperienceTimeline({ experience, showProofLink = false }: ExperienceTimelineProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [isHolder, setIsHolder] = useState(false);

  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  const contractAddress = process.env.NEXT_PUBLIC_RECRUITER_PASS_CONTRACT_ADDRESS;

  const chainName = chainId === "80002" ? "Polygon Amoy" : chainId ? `Chain ${chainId}` : undefined;
  const explorerLink = useMemo(() => {
    if (!contractAddress) {
      return undefined;
    }

    if (chainId === "80002") {
      return `https://amoy.polygonscan.com/address/${contractAddress}`;
    }

    return undefined;
  }, [chainId, contractAddress]);

  const refreshSession = useCallback(async () => {
    try {
      const session = await restoreSiweSession();
      setAuthenticated(session.authenticated);

      if (!session.authenticated || !session.address) {
        setIsHolder(false);
        return;
      }

      const holder = await isRecruiterPassHolder(session.address);
      setIsHolder(holder);
    } catch {
      setAuthenticated(false);
      setIsHolder(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
    return onSiweSessionChange(() => {
      void refreshSession();
    });
  }, [refreshSession]);

  return (
    <div className="space-y-6">
      {experience.map((item) => {
        const artifact = artifactsByKey[item.artifactKey];

        return (
          <article key={`${item.company}-${item.title}-${item.startYear}`} className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg font-semibold">{item.title} · {item.company}</h3>
              <p className="text-sm text-zinc-500">{item.startYear} — {item.endYearOrPresent}</p>
            </div>
            {showProofLink ? (
              <Link href="/proof" className="mt-1 inline-flex text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300">
                🔗 Proof registry
              </Link>
            ) : null}
            {item.location && <p className="mt-1 text-sm text-zinc-500">{item.location}</p>}
            <ul className="mt-3 space-y-2">
              {item.highlights.map((highlight) => (
                <li key={`${item.title}-${highlight.label}`} className="text-sm leading-6">
                  <span className="font-medium">{highlight.label}:</span> {highlight.text}
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-700 dark:bg-zinc-900/60">
              <p className="font-semibold">Proof-of-Work</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sky-700 dark:text-sky-300">
                <a href={artifact.publicProofUrl} className="underline underline-offset-2">
                  View public proof
                </a>
                <span className={`rounded-md px-2 py-1 ${authenticated ? "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"}`}>
                  Verify on-chain
                </span>
              </div>

              {authenticated && isHolder && contractAddress ? (
                <div className="mt-2 text-zinc-600 dark:text-zinc-300">
                  <p>
                    Contract: <span className="font-medium">{formatAddress(contractAddress)}</span>
                    {chainName ? ` · ${chainName}` : ""}
                  </p>
                  {explorerLink ? (
                    <a href={explorerLink} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                      View contract on explorer
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
