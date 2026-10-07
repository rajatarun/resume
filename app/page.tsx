import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Instrument_Serif, JetBrains_Mono, Newsreader } from "next/font/google";
import { resume } from "@/lib/resume";
import { githubUrl, linkedInUrl, routeMetadata } from "@/src/seo/seo.config";
import { BarChart, HeroParallax, HeroVideo, Reveal } from "@/components/home/Motion";

export const metadata: Metadata = routeMetadata["/"];

const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-display" });
const body = Newsreader({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const sections = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" }
] as const;

type Project = {
  name: string;
  kind: string;
  description: string;
  tags: string[];
  href?: string;
  external?: boolean;
  bars: number[];
  highlight: number;
};

const projects: Project[] = [
  {
    name: "TaskWeave",
    kind: "Agentic AI framework",
    description:
      "Define atomic tasks — LLM prompts, API calls, data analysis — in JSON, and let LangGraph chain them into multi-step reasoning. Reusable logic that turns agent prototypes around in hours, not weeks.",
    tags: ["LangGraph", "LangChain", "OpenAI", "Python", "JSON config", "Agents"],
    href: "https://github.com/rajatarun/taskweave",
    external: true,
    bars: [38, 55, 46, 92, 60, 52, 74],
    highlight: 3
  },
  {
    name: "Agent Studio",
    kind: "AI Labs",
    description:
      "Design, run and watch multi-agent team pipelines. Each team declares its own request schema, so the run form, status tracking and answer view build themselves — a new team needs no UI change.",
    tags: ["Next.js", "TypeScript", "AWS Lambda", "API Gateway", "Agents", "Schemas"],
    href: "/labs",
    bars: [44, 70, 58, 40, 86, 62, 50],
    highlight: 4
  },
  {
    name: "Résumé RAG Chat",
    kind: "This website",
    description:
      "Ask my résumé anything. Answers stream from a Lambda that retrieves from pgvector embeddings and grounds an OpenAI model in my actual experience — on a statically exported Next.js site behind CloudFront.",
    tags: ["Next.js 14", "pgvector", "OpenAI", "Lambda", "Terraform", "CloudFront"],
    href: "/website",
    bars: [80, 48, 62, 54, 40, 66, 58],
    highlight: 0
  },
  {
    name: "Jules",
    kind: "Internal platform library",
    description:
      "A shift-left testing library built at JP Morgan Chase that moves verification earlier in the pipeline and streamlines Kubernetes deployments across teams.",
    tags: ["Kubernetes", "Java", "CI/CD", "Jenkins", "Testing", "DevOps"],
    bars: [52, 60, 44, 68, 50, 88, 56],
    highlight: 5
  }
];

function SectionLabel({ index, label, tone = "dark" }: { index: string; label: string; tone?: "dark" | "light" }) {
  return (
    <p
      className={`font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.25em] ${
        tone === "dark" ? "text-stone-500" : "text-[#f0714a]"
      }`}
    >
      ({index}) — {label}
    </p>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden bg-[#76301a] text-[#fbf3ea]">
      {/* Matched to the video's backdrop where its left edge fades out, so the
          scene sits in the page instead of on a panel. Sampled from the clip:
          darker at the top, warmer toward the lit floor. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,#622410_0%,#76301a_50%,#8c4224_100%)]"
      />

      <HeroParallax className="relative">
        <div className="mx-auto grid min-h-[100svh] max-w-7xl content-center gap-12 px-6 pb-36 pt-32 sm:px-10 sm:pb-28 lg:pt-28">
          <div className="relative z-10 xl:max-w-[34rem]">
            <Reveal>
              <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em] text-[#f7c9b0]">
                {"// Senior Lead Software Engineer"}
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="mt-6 font-[family-name:var(--font-display)] text-[clamp(4.5rem,13vw,10rem)] leading-[0.85] tracking-tight">
                Tarun
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 max-w-xl font-[family-name:var(--font-display)] text-[clamp(1.9rem,4vw,3rem)] leading-[1.08]">
                Building <em className="text-[#ffb08c]">resilient</em> platforms and the teams that ship them.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <p className="mt-8 max-w-lg text-lg leading-relaxed text-[#fbe3d4]">
                Engineering leader with 10+ years at JP Morgan Chase — from Spring services and React front ends to
                Kubernetes, CI/CD and LLM-powered workflows for global payments.
              </p>
            </Reveal>
            <Reveal delay={0.32}>
              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.25em]">
                <Link href="/about" className="focus-ring border-b border-[#fbf3ea]/50 pb-1 transition hover:border-[#fbf3ea]">
                  Chat about me →
                </Link>
                <Link href="/appointment" className="focus-ring border-b border-[#fbf3ea]/50 pb-1 transition hover:border-[#fbf3ea]">
                  Let&apos;s talk →
                </Link>
                <Link href="/labs" className="focus-ring border-b border-[#fbf3ea]/50 pb-1 transition hover:border-[#fbf3ea]">
                  AI Lab →
                </Link>
              </div>
            </Reveal>
          </div>

          {/* One element, two layouts: a card under the text on small screens,
              and from 1280px the scene behind the hero's right side, below the
              fixed nav, its left and top edges masked into the background so
              the headline stays clear. Narrower than that, the character would
              stand under the text. */}
          <HeroVideo className="hero-video relative aspect-video w-full overflow-hidden rounded-2xl shadow-[0_30px_60px_-30px_rgba(40,10,0,0.8)] xl:absolute xl:bottom-0 xl:right-0 xl:top-20 xl:aspect-auto xl:w-[68%] xl:rounded-none xl:shadow-none" />
        </div>

        {/* Keeps the bottom row legible over the brightly lit floor. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-48 bg-gradient-to-t from-[#4a1a0a]/85 to-transparent xl:block"
        />

        <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 pb-8 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em] text-[#f7c9b0] sm:px-10">
          <p className="flex flex-wrap gap-x-6 gap-y-1">
            <span>Princeton, TX</span>
            <span>· Open to conversations</span>
            <span>· 10+ years</span>
          </p>
          <nav aria-label="Home sections" className="hidden gap-6 md:flex">
            {sections.map((section, index) => (
              <a key={section.id} href={`#${section.id}`} className="focus-ring transition hover:text-white">
                (0{index + 1}) {section.label}
              </a>
            ))}
          </nav>
        </div>
      </HeroParallax>
    </header>
  );
}

function About() {
  const certifications = [...resume.certifications].reverse();
  return (
    <section id="about" aria-labelledby="about-heading" className="scroll-mt-16 bg-[#f6f2ea] text-stone-900">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:py-32">
        <Reveal>
          <SectionLabel index="01" label="About" />
          <h2
            id="about-heading"
            className="mt-6 max-w-3xl font-[family-name:var(--font-display)] text-[clamp(2.2rem,5vw,3.75rem)] leading-[1.05]"
          >
            I care about the details — from clean <em className="text-[#b8441f]">Spring</em> services to the last green
            pipeline.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Reveal>
            <div className="relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-sm">
              <Image src="/profile-photo.PNG" alt="" fill sizes="(min-width: 1024px) 30vw, 90vw" className="object-cover" />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="space-y-5 text-lg leading-relaxed text-stone-700">
              <p>
                For the past decade I&apos;ve built and run software at JP Morgan Chase — first shipping customer-facing
                single-page apps on Java Spring, then modernising legacy systems into cloud-native platforms, and today
                leading a division that spans DevOps, SRE and AI enablement.
              </p>
              <p>
                I lead three technical leads, their developers and a program manager across time zones, and I still
                care most about the unglamorous parts: test coverage, deploy hygiene, governance that keeps payment
                systems honest — and lately, putting LLMs to work in banking workflows where they genuinely earn their
                place.
              </p>
            </div>

            <dl className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2">
              {resume.skills.groups.map((group) => (
                <div key={group.name}>
                  <dt className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.25em] text-stone-500">
                    {group.name} · {group.yearsExp} yrs
                  </dt>
                  <dd className="mt-3 flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-stone-300 px-3 py-1 font-[family-name:var(--font-mono)] text-[11px] text-stone-700"
                      >
                        {item}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-14 grid gap-8 border-t border-stone-300 pt-8 sm:grid-cols-2">
              <div>
                <h3 className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.25em] text-stone-500">
                  Education
                </h3>
                <ul className="mt-4 space-y-4">
                  {resume.education.map((item) => (
                    <li key={item.school}>
                      <p className="font-[family-name:var(--font-display)] text-xl">{item.degree}</p>
                      <p className="font-[family-name:var(--font-mono)] text-[11px] text-stone-500">
                        {item.school} · {item.year}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.25em] text-stone-500">
                  Certifications
                </h3>
                <ul className="mt-4 space-y-4">
                  {certifications.map((cert) => (
                    <li key={cert.name}>
                      <p className="font-[family-name:var(--font-display)] text-xl">{cert.name}</p>
                      <p className="font-[family-name:var(--font-mono)] text-[11px] text-stone-500">{cert.year}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function titleCase(value: string): string {
  return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-heading" className="scroll-mt-16 bg-[#efe9d9] text-stone-900">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:py-32">
        <Reveal>
          <SectionLabel index="02" label="Experience" />
          <h2
            id="experience-heading"
            className="mt-6 font-[family-name:var(--font-display)] text-[clamp(2.4rem,6vw,4.5rem)] leading-none"
          >
            Where I&apos;ve worked
          </h2>
        </Reveal>

        <ol className="mt-16 border-t border-stone-300">
          {resume.experience.map((job) => {
            const location = "location" in job && job.location ? ` · ${job.location}` : "";
            const years =
              job.startYear === job.endYearOrPresent ? job.startYear : `${job.startYear} — ${job.endYearOrPresent}`;
            return (
              <li key={`${job.title}-${job.startYear}`} className="border-b border-stone-300">
                <Reveal className="grid gap-4 py-10 md:grid-cols-[180px_minmax(0,1fr)] md:gap-10">
                  <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-stone-500 md:pt-2">
                    {years.replace("Present", "Now")}
                  </p>
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-3xl leading-tight">{job.title}</h3>
                    <p className="mt-1 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.2em] text-stone-500">
                      {titleCase(job.company)}
                      {location}
                    </p>
                    <p className="mt-4 max-w-3xl text-lg leading-relaxed text-stone-700">
                      {job.highlights
                        .slice(0, 2)
                        .map((highlight) => highlight.text)
                        .join(" ")}
                    </p>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>

        <Reveal>
          <Link
            href="/resume"
            className="focus-ring mt-10 inline-block border-b border-stone-900 pb-1 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.25em]"
          >
            Full résumé →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const content = (
    <>
      <div className="flex items-start justify-between font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.25em] text-stone-500">
        <span>Proj / 0{index + 1}</span>
        <span>{project.kind}</span>
      </div>
      <div className="mt-8">
        <BarChart bars={project.bars} highlight={project.highlight} />
      </div>
      <h3 className="mt-8 font-[family-name:var(--font-display)] text-3xl text-stone-50">
        {project.name}
        {project.href ? (
          <span aria-hidden="true" className="ml-2 inline-block text-xl text-[#f0714a] transition group-hover:translate-x-1">
            ↗
          </span>
        ) : null}
      </h3>
      <p className="mt-3 text-base leading-relaxed text-stone-400">{project.description}</p>
      <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-1 font-[family-name:var(--font-mono)] text-[11px] text-stone-300 sm:grid-cols-3">
        {project.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
    </>
  );

  const cardClass =
    "group block h-full rounded-sm border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 transition hover:border-[#f0714a]/50 sm:p-8";

  if (!project.href) return <div className={cardClass}>{content}</div>;
  if (project.external) {
    return (
      <a href={project.href} target="_blank" rel="noopener noreferrer" className={`focus-ring ${cardClass}`}>
        {content}
      </a>
    );
  }
  return (
    <Link href={project.href as "/labs"} className={`focus-ring ${cardClass}`}>
      {content}
    </Link>
  );
}

function Projects() {
  return (
    <section id="projects" aria-labelledby="projects-heading" className="scroll-mt-16 bg-[#14110f] text-stone-100">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:py-32">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <SectionLabel index="03" label="Selected projects" tone="light" />
              <h2
                id="projects-heading"
                className="mt-6 font-[family-name:var(--font-display)] text-[clamp(2.4rem,6vw,4.5rem)] leading-none"
              >
                Things I&apos;ve built
              </h2>
            </div>
            <Link
              href="/portfolio"
              className="focus-ring border-b border-stone-500 pb-1 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.25em] text-stone-300 transition hover:border-stone-100 hover:text-stone-100"
            >
              Full portfolio →
            </Link>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {projects.map((project, index) => (
            <Reveal key={project.name} delay={(index % 2) * 0.1} className="h-full">
              <ProjectCard project={project} index={index} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const linkClass =
    "focus-ring border-b border-[#fbf3ea]/40 pb-1 transition hover:border-[#fbf3ea]";
  return (
    <section id="contact" aria-labelledby="contact-heading" className="scroll-mt-16 bg-[#a8492a] text-[#fbf3ea]">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:py-32">
        <Reveal>
          <SectionLabel index="04" label="Contact" tone="light" />
          <h2
            id="contact-heading"
            className="mt-6 max-w-4xl font-[family-name:var(--font-display)] text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.95]"
          >
            Let&apos;s talk shop on <em className="text-[#ffc3a6]">systems</em>, AI and engineering craft.
          </h2>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-[#fbe3d4]">
            Distributed systems, platform design, putting LLMs into production — or wherever you&apos;re headed. No
            agenda, just a good engineering conversation.
          </p>
          <div className="mt-12 flex flex-wrap gap-x-10 gap-y-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.25em]">
            <a href="mailto:hello@tarunraja.dev" className={linkClass}>
              hello@tarunraja.dev
            </a>
            <Link href="/appointment" className={linkClass}>
              Book a chat →
            </Link>
            <a href={githubUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
              GitHub ↗
            </a>
            <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
              LinkedIn ↗
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    // The root layout wraps every page in a padded, max-w-6xl <main>. This
    // page is full-bleed, so it steps out of that column: w-screen centred on
    // the column, and negative margins to cancel main's top and bottom padding
    // (pt-24 sits under the fixed nav, which the hero now does on purpose).
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} relative left-1/2 -mb-16 -mt-24 w-screen -translate-x-1/2 font-[family-name:var(--font-body)]`}
    >
      <Hero />
      <About />
      <Experience />
      <Projects />
      <Contact />
    </div>
  );
}
