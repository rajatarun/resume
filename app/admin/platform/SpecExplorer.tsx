'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// swagger-ui-react reaches for `window` at import time, so it cannot be part
// of the server-rendered bundle this statically-exported site produces --
// ssr:false defers it to the browser entirely, same reasoning as every other
// wallet/web3 component already in components/web3/.
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-40 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
      Loading API explorer…
    </div>
  ),
});

// SwaggerUI fetches `url` itself, straight from the browser -- the same
// raw.githubusercontent.com fetch the platform manifest uses, so a spec
// update on a product's own main branch shows up here on next page load
// with nothing in this repo to keep in sync.
export function SpecExplorer({ specUrl }: { specUrl: string }) {
  return (
    // swagger-ui-react ships its own light-only theme; a dark: variant here
    // would fight it (its internal text/background pairs aren't dark-mode
    // aware), so this panel stays light regardless of site theme -- the
    // same call the wallet-connect modal in components/web3/ already makes
    // for the same reason.
    <div className="swagger-explorer overflow-hidden rounded-xl border border-slate-200 bg-white">
      <SwaggerUI url={specUrl} docExpansion="list" defaultModelsExpandDepth={-1} />
    </div>
  );
}
