# Tarun Raja — Personal Website

Professional personal website built with **Next.js App Router + TypeScript + TailwindCSS**.

## Features

- Deep-link pages:
  - `/` home landing page with pill-style navigation cards
  - `/store`, `/website`, `/portfolio`, `/blog`, `/blog/[slug]`, `/appointment`, `/newsletter`
- Reusable design system components (`PageShell`, `Section`, `Card`, `PillLink`, `Badge`, `Button`, `Input`)
- SEO metadata per page + OpenGraph
- `sitemap.xml` and `robots.txt`
- Newsletter mock API route with in-memory storage
- Appointment page reads Zoom details from environment variables
- Web3 wallet connection (Injected, WalletConnect, Coinbase Wallet) + SIWE session auth
- Protected recruiter area (`/recruiter`) with SIWE gate
- Onchain identity pages (`/proof`, `/onchain`)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Run dev server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Environment Setup

Add the following to `.env.local`:

```env
NEXT_PUBLIC_ZOOM_PERSONAL_LINK=https://zoom.us/j/your-meeting-id
NEXT_PUBLIC_ZOOM_MEETING_ID=your-meeting-id

NEXT_PUBLIC_SIWE_API_BASE=https://<api-id>.execute-api.<region>.amazonaws.com/<stage>
WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
```

- `NEXT_PUBLIC_SIWE_API_BASE` is required and is called directly by the browser for SIWE nonce/verify/session/me.
- Configure API Gateway CORS to allow your Amplify domain (and localhost during development), including `GET, POST` methods and `content-type, authorization` headers.
- `WALLETCONNECT_PROJECT_ID` is required for WalletConnect v2.
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` mirrors the same value for client-side WalletConnect/Web3Modal initialization.


### Local SIWE test

1. Set `NEXT_PUBLIC_SIWE_API_BASE` in `.env.local`.
2. Start the app with `npm run dev`.
3. Connect your wallet and click **Sign in with Ethereum**.
4. In browser devtools, confirm these API Gateway calls succeed from the client:
   - `POST {NEXT_PUBLIC_SIWE_API_BASE}/siwe/nonce`
   - `POST {NEXT_PUBLIC_SIWE_API_BASE}/siwe/verify`
   - `GET {NEXT_PUBLIC_SIWE_API_BASE}/siwe/session` with `Authorization: Bearer <token>`
   - `GET {NEXT_PUBLIC_SIWE_API_BASE}/siwe/me` with `Authorization: Bearer <token>`

## Build & production

```bash
npm run build
npm run start
```

## Deployment notes

### Vercel
- Import the repository in Vercel.
- Configure all required environment variables in Project Settings → Environment Variables.
- Deploy (auto-detected Next.js build settings).

### AWS Amplify
- Connect repository in Amplify Hosting.
- Use the existing `amplify.yml` (or default Next.js settings).
- Set environment variables in Amplify Console.
- Trigger build + deploy.

## Notes

- Newsletter subscription currently stores emails in memory via `/api/newsletter` and includes a TODO for provider integration (Mailchimp/ConvertKit).
- SIWE implementation is intentionally MVP-level and includes TODO comments for production hardening (nonce/session persistence, stronger replay defenses, session rotation/revocation).
