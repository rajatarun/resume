export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  tags: string[];
  content: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "designing-cloud-native-teams",
    title: "Designing Cloud-Native Teams for Sustainable Velocity",
    excerpt: "What I learned while scaling delivery across distributed teams in highly regulated environments.",
    date: "2026-01-18",
    readingTime: "6 min read",
    tags: ["Leadership", "Cloud"],
    content: `## Why team design matters
The architecture of your systems mirrors the architecture of your teams.

## Core principles
- Keep ownership boundaries explicit.
- Make quality signals visible in every sprint.
- Invest in platform capabilities early.`
  },
  {
    slug: "from-proof-of-concept-to-genai-product",
    title: "From Proof of Concept to GenAI Product",
    excerpt: "A practical checklist for turning AI experiments into secure and useful product features.",
    date: "2025-11-06",
    readingTime: "8 min read",
    tags: ["GenAI", "Product"],
    content: `## Beyond demos
Production GenAI requires reliability, privacy, and observability.

## What to measure
- Grounding quality and hallucination rates.
- User adoption by workflow.
- Cost per successful outcome.`
  },
  {
    slug: "mentoring-engineers-into-tech-leads",
    title: "Mentoring Engineers into Tech Leads",
    excerpt: "Simple coaching patterns I use to help high-potential engineers lead confidently.",
    date: "2025-09-12",
    readingTime: "5 min read",
    tags: ["Mentoring", "Leadership"],
    content: `## Mentoring is a force multiplier
Strong mentors increase confidence, autonomy, and quality of decision-making.

## Weekly rhythm
- One challenge to solve.
- One communication skill to practice.
- One reflection on impact.`
  }
];
