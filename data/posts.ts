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
    slug: "career-mentoring-2026-02-08",
    title: "From Senior Engineer to AI Architect: Why Mentoring Multiplies Impact",
    excerpt: "How architects expand impact by combining systems thinking with deliberate mentoring habits.",
    date: "2026-02-08",
    readingTime: "7 min read",
    tags: ["Career Growth", "Mentoring", "AI Architecture"],
    content: `Many senior engineers imagine the path to AI architect as a simple sequence: learn new frameworks, build a few demos, and start making bigger decisions. In reality, the transition is less about collecting tools and more about expanding scope, communication, and accountability.

The first shift is from implementation depth to decision clarity. As a senior engineer, you are rewarded for solving hard technical problems directly. As an architect, you are responsible for making better decisions than any single implementation could express. You define tradeoffs, document why they matter, and align stakeholders with different incentives.

The second shift is from feature ownership to socio-technical stewardship. AI systems cross boundaries quickly: model behavior, data governance, privacy, infrastructure costs, and user trust. You cannot design these systems in isolation. Architects coordinate product, security, legal, and operations concerns so delivery remains trustworthy.

This is where mentoring becomes a force multiplier rather than a side activity. In practical terms, mentoring means creating repeatable growth loops: weekly design reviews, rotating ownership of incident analysis, and architecture notes that invite critique. Teams learn how to question assumptions and communicate options.

A common mistake during this transition is over-indexing on novelty. People chase every new model release while neglecting fundamentals like observability, rollback paths, and evaluation discipline. Strong mentors keep teams focused on business outcomes, asking what success looks like and which failure modes are acceptable.

Another mistake is silent ambition. Engineers who want architectural roles often wait for formal permission. A better approach is to practice architecture before the title appears: lead cross-team design sessions, write post-incident plans, and mentor peers through difficult tradeoffs.

The transition from senior engineer to AI architect is not a leap; it is a layered expansion of responsibility. Mentoring is the connective tissue that turns personal expertise into organizational capability. If you want lasting impact, build systems and build people in parallel.`,
  },
  {
    slug: "ai-systems-architect-2026-02-01",
    title: "Designing Observable AI-Agent Systems for Enterprise Trust",
    excerpt: "A practical architecture blueprint for trustworthy AI agents in production enterprise workflows.",
    date: "2026-02-01",
    readingTime: "7 min read",
    tags: ["AI Systems", "Observability", "Enterprise Architecture"],
    content: `Enterprise leaders are no longer asking whether AI agents can help; they are asking whether those agents can be trusted when revenue, compliance, and brand reputation are on the line.

The first principle is explicit separation of concerns across control planes and data planes. Keep orchestration, retrieval, policy checks, and execution handoff as distinct layers. This gives teams clearer ownership boundaries and lowers operational blast radius.

The second principle is observability by default. Every agent step should emit structured events: prompt version, retrieved sources, tool inputs, tool outputs, confidence signals, and guardrail decisions. Trace IDs should follow requests across model providers, vector stores, and downstream services.

The third principle is trust-aware evaluation. Offline benchmarks are useful, but enterprises need scenario-based testing tied to risk. Measure groundedness, latency, refusal quality, and cost per successful outcome. Add drift monitors that compare behavior by persona and workload.

A fourth principle is human override design. Agents should expose decision context clearly: what was asked, what was retrieved, what was attempted, and why an answer was produced. Better handoff interfaces lower mean time to recovery and increase confidence in production operations.

Finally, architecture and operating model must evolve together. Teams need explicit ownership for prompts, policies, tool reliability, and evaluation quality. Weekly reviews that include product, engineering, and governance partners turn observability signals into product improvements.

Observable AI-agent systems are not only more reliable; they are more governable, improvable, and fundable. In enterprise contexts, trust is the product, and architecture is how you earn it repeatedly.`,
  },
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
