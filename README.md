# Tarun Raja — Personal Website

Professional personal website built with **Next.js (App Router) + TypeScript + TailwindCSS**.

## Routes

- `/` Home (hero-only landing page)
- `/resume`
- `/projects`
- `/recruiter`
- `/contact`
- `/store`
- `/website`
- `/portfolio`
- `/blog`
- `/blog/[slug]`
- `/appointment`
- `/newsletter`

## Features

- Minimal top navigation with all routes in a fixed order
- Reusable UI components: `Navbar`, `Footer`, `PageShell`, `Section`, `Card`, `Badge`, `Button`, `Input`
- Blog index with search and tag filter + dynamic blog detail pages
- Portfolio filters (All / Backend / Frontend / Cloud / GenAI)
- Newsletter subscribe form with mock API (`/api/newsletter`) using in-memory storage
- Appointment page powered by environment variables and calendar utilities (Google + ICS)
- SEO metadata per page + OpenGraph
- `sitemap.xml` and `robots.txt`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create local env file:

```bash
cp .env.example .env.local
```

3. Run development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Environment variables

Add this to `.env.local`:

```env
NEXT_PUBLIC_ZOOM_PERSONAL_LINK=https://zoom.us/j/your-meeting-id
NEXT_PUBLIC_ZOOM_MEETING_ID=your-meeting-id
```

## Build and run production

```bash
npm run build
npm run start
```

## Deployment notes

### Vercel

- Import the repository in Vercel.
- Set `NEXT_PUBLIC_ZOOM_PERSONAL_LINK` and `NEXT_PUBLIC_ZOOM_MEETING_ID` in project environment variables.
- Deploy with default Next.js settings.

### AWS Amplify

- Connect the repository in Amplify Hosting.
- Use `amplify.yml` (already included) or standard Next.js build settings.
- Configure environment variables in Amplify Console.
- Trigger build/deploy.

## Notes

- Newsletter subscriptions are intentionally in-memory for demo purposes.
- Product/blog/project content is placeholder-friendly and easy to replace from `/data`.
