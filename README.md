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

## Environment variables

Add the following to `.env.local`:

```env
NEXT_PUBLIC_ZOOM_PERSONAL_LINK=https://zoom.us/j/your-meeting-id
NEXT_PUBLIC_ZOOM_MEETING_ID=your-meeting-id
```

## Build & production

```bash
npm run build
npm run start
```

## Deployment notes

### Vercel
- Import the repository in Vercel.
- Configure `NEXT_PUBLIC_ZOOM_PERSONAL_LINK` and `NEXT_PUBLIC_ZOOM_MEETING_ID` in Project Settings → Environment Variables.
- Deploy (auto-detected Next.js build settings).

### AWS Amplify
- Connect repository in Amplify Hosting.
- Use the existing `amplify.yml` (or default Next.js settings).
- Set environment variables in Amplify Console.
- Trigger build + deploy.

## Notes

- Newsletter subscription currently stores emails in memory via `/api/newsletter` and includes a TODO for provider integration (Mailchimp/ConvertKit).
- Product, project, post, and newsletter issue content is placeholder data designed for easy replacement.
