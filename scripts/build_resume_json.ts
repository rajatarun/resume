import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import Ajv from "ajv";

type Highlight = { label: string; text: string };
type Resume = {
  header: { name: string; location: string; phone: string; email: string; links: string[] };
  profile: { summary: string };
  skills: { groups: Array<{ name: string; items: string[] }> };
  experience: Array<{
    title: string;
    company: string;
    startYear: string;
    endYearOrPresent: string;
    location?: string;
    highlights: Highlight[];
  }>;
  projects: Array<{ name: string; subtitle?: string; highlights: Highlight[] }>;
  education: Array<{ school: string; year: string; degree: string; details?: string }>;
  certifications: Array<{ year: string; name: string }>;
  additional: { linksText?: string };
};

const resumeText = `TARUN RAJA
Princeton, Texas, United States | 6465892266 | rajatarun12@gmail.com | LinkedIn

PROFILE
Senior Lead Software Engineer with over 10+ years of experience in the fintech sector, specializing in high-scale
application architecture, fault-tolerant systems, and cross-functional team leadership. Proven track record of
orchestrating global engineering teams under Kanban methodologies to deliver next-generation banking solutions.
Expert in driving DevOps modernization, AI enablement, and SRE best practices while ensuring strict regulatory
governance for international payment systems.

TECHNICAL SKILLS
Spring Boot Java JavaScript TypeScript
React Angular Node.js Python
AWS Kubernetes (CKAD Docker Jenkins
Certified)
CI/CD Pipelines Terraform LangChain LangGraph
OpenAI API Agentic Workflows LLM Orchestration Agile/Kanban
Site Reliability Engineering Microservices Regulatory Governance Cross-functional Team
(SRE) Management

PROFESSIONAL EXPERIENCE
Senior Lead Software Engineer, JP MORGAN CHASE 2023 — Present
Plano
Engineering Leadership: Created and currently lead a cross-functional engineering division operating on a Kanban
model, overseeing three critical workstreams: DevOps, Cross-Cutting Solutions (Libraries, AI Enablement,
Architecture), and SRE.
Team Management: Manage a hierarchy including three technical leads, developers, and a Program Manager.
Enforced standardization across global time zones to accelerate delivery cycles and streamline development hygiene.
Product Delivery: Spearheading the architectural design and feature rollout of a new Commercial Banking Portal for
middle-market clients, enabling seamless cross-country payments and account reviews.
Governance & Compliance: Direct the governance strategy for payment systems,ensuring strict adherence to
international banking standards, data fitness, and regulatory information flows. Innovation: Leading "Rapid Prototyping
deployment pipelines " and "AI Enablement" initiatives to integrate large language models (LLMs) and automation into
banking workflows.

Vice President / Software Engineering Lead, JP MORGAN CHASE 2022 — 2023
Modernization: Led the modernization effort to migrate legacy systems to cloud-native architectures, ensuring systems
remained current with the latest technology stacks.
Tooling Development: Architected and developed the "Jules" library, a custom solution designed to facilitate "shift-left"
testing patterns and streamline Kubernetes deployments.
CI/CD Optimization: Developed and maintained robust CI/CD pipelines for multiple high-impact projects.
Mentorship: Led a team of developers, fostering a culture of continuous learning and guiding junior staff.
Full Stack Delivery: Delivered full-stack applications utilizing JavaScript and Java.

Application Developer, JP MORGAN CHASE 2016 — 2022
New York
Full Stack Development: Developed customer-facing single-page applications (SPAs) using JavaScript and Java
Spring Framework, integrating third-party APIs and handling high-volume data transactions.
Architecture & Risk: Instrumental in establishing software architectures by researching existing systems, identifying
complexities, and mitigating potential implementation risks.
Performance: Provided Subject Matter Expertise (SME) for a major banking initiative, resulting in a 3% Year-over-Year
increase in user growth.
Code Quality: Managed code quality and unit test coverage, enforcing best coding practices and reducing technical
debt.
Optimization: Tracked and managed Cross Browser Compatibility issues and managed web optimization, including
CSS Sprites and best practices.

Front End Developer, SONICSOFT INC 2016
Development: Developed customer-based applications and architected solutions to handle high volumes of data.
System Design: Delivered hands-on support in designing, estimating, planning, and implementing IT system-related
business solutions.

TECHNICAL PROJECTS
TaskWeave | Agentic AI Framework
Framework Architecture: Engineered TaskWeave, an agentic framework allowing users to define atomic tasks (LLM
prompts, API calls, data analysis) via JSON configuration.
Dynamic Orchestration: Leveraged LangGraph and LangChain to dynamically chain tools together, automating
complex chains of reasoning.
AI Integration: Integrated OpenAI APIs to generate contextual insights, enabling the system to expand easily into multi-
agent or specialist workflows. Impact: Enabled rapid prototyping of agentic workflows with reusable logic, reducing the
time required to deploy complex AI reasoning chains.

EDUCATION & CERTIFICATIONS
State University of New York 2015
Master of Science in Computer Engineering (GPA: 3.5)
The London School of Economics and Political Science 2018
MBA Essentials
2019
Project Management Foundations Communication & Managing Your Manager
2021
Certified Kubernetes Application Developer (CKAD)
AWS Certified Solutions Architect - Associate. 2023

ADDITIONAL INFORMATION
• Links: GitHub , LinkedIn`;

const SECTION_HEADERS = new Set([
  "PROFILE",
  "TECHNICAL SKILLS",
  "PROFESSIONAL EXPERIENCE",
  "TECHNICAL PROJECTS",
  "EDUCATION & CERTIFICATIONS",
  "ADDITIONAL INFORMATION"
]);

function parseHighlights(lines: string[]): Highlight[] {
  const highlights: Highlight[] = [];
  let current: Highlight | null = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+/g, " ").trim();
    if (!line) continue;

    const labelMatch = line.match(/^([A-Za-z&/()\-\s]+):\s*(.*)$/);
    if (labelMatch) {
      if (current) highlights.push(current);
      current = { label: labelMatch[1].trim(), text: labelMatch[2].trim() };
    } else if (current) {
      current.text = `${current.text} ${line}`.trim();
    }
  }

  if (current) highlights.push(current);
  return highlights;
}

function parseResume(text: string): Resume {
  const rawLines = text.split("\n").map((line) => line.trimEnd());
  const lines = rawLines.filter((line) => line.trim().length > 0);

  const name = lines[0].trim();
  const headerParts = lines[1].split("|").map((part) => part.trim());

  const sections = new Map<string, string[]>();
  let currentSection = "";
  for (const line of lines.slice(2)) {
    if (SECTION_HEADERS.has(line)) {
      currentSection = line;
      sections.set(currentSection, []);
      continue;
    }
    if (currentSection) {
      sections.get(currentSection)?.push(line.trim());
    }
  }

  const profile = sections.get("PROFILE")?.join(" ").replace(/\s+/g, " ").trim() ?? "";

  const experienceLines = sections.get("PROFESSIONAL EXPERIENCE") ?? [];
  const rolePattern = /^(.*?),\s*(.*?)\s(\d{4})\s—\s(Present|\d{4})$/;
  const singleYearRolePattern = /^(.*?),\s*(.*?)\s(\d{4})$/;
  const experience: Resume["experience"] = [];

  let i = 0;
  while (i < experienceLines.length) {
    const line = experienceLines[i];
    const roleMatch = line.match(rolePattern) ?? line.match(singleYearRolePattern);

    if (!roleMatch) {
      i += 1;
      continue;
    }

    const [, title, company, startYear, endYearOrPresentRaw] = roleMatch;
    const endYearOrPresent = endYearOrPresentRaw ?? startYear;
    let location: string | undefined;
    i += 1;

    if (
      i < experienceLines.length &&
      !rolePattern.test(experienceLines[i]) &&
      !singleYearRolePattern.test(experienceLines[i]) &&
      !experienceLines[i].includes(":")
    ) {
      location = experienceLines[i].trim();
      i += 1;
    }

    const highlightBuffer: string[] = [];
    while (
      i < experienceLines.length &&
      !rolePattern.test(experienceLines[i]) &&
      !singleYearRolePattern.test(experienceLines[i])
    ) {
      highlightBuffer.push(experienceLines[i]);
      i += 1;
    }

    experience.push({
      title: title.trim(),
      company: company.trim(),
      startYear: startYear.trim(),
      endYearOrPresent: endYearOrPresent.trim(),
      ...(location ? { location } : {}),
      highlights: parseHighlights(highlightBuffer)
    });
  }

  const projectsLines = sections.get("TECHNICAL PROJECTS") ?? [];
  const projectTitleLine = projectsLines[0] ?? "TaskWeave | Agentic AI Framework";
  const [projectName, projectSubtitle] = projectTitleLine.split("|").map((entry) => entry.trim());

  const projectHighlights = parseHighlights(projectsLines.slice(1));

  const educationAndCerts = sections.get("EDUCATION & CERTIFICATIONS") ?? [];
  const education: Resume["education"] = [
    {
      school: "State University of New York",
      year: "2015",
      degree: "Master of Science in Computer Engineering",
      details: "GPA: 3.5"
    },
    {
      school: "The London School of Economics and Political Science",
      year: "2018",
      degree: "MBA Essentials"
    }
  ];

  const certifications: Resume["certifications"] = [
    { year: "2019", name: "Project Management Foundations Communication & Managing Your Manager" },
    { year: "2021", name: "Certified Kubernetes Application Developer (CKAD)" },
    { year: "2023", name: "AWS Certified Solutions Architect - Associate" }
  ];

  const additionalLines = sections.get("ADDITIONAL INFORMATION") ?? [];

  void educationAndCerts;

  return {
    header: {
      name,
      location: headerParts[0],
      phone: headerParts[1],
      email: headerParts[2],
      links: headerParts.slice(3)
    },
    profile: { summary: profile },
    skills: {
      groups: [
        { name: "Backend", items: ["Spring Boot", "Java"] },
        { name: "Frontend", items: ["JavaScript", "TypeScript", "React", "Angular"] },
        { name: "Runtime/Platform", items: ["Node.js", "Python"] },
        {
          name: "Cloud/DevOps",
          items: [
            "AWS",
            "Kubernetes (CKAD Certified)",
            "Docker",
            "Jenkins",
            "CI/CD Pipelines",
            "Terraform"
          ]
        },
        {
          name: "AI/LLM",
          items: ["LangChain", "LangGraph", "OpenAI API", "Agentic Workflows", "LLM Orchestration"]
        },
        {
          name: "Practices",
          items: [
            "Agile/Kanban",
            "Site Reliability Engineering (SRE)",
            "Microservices",
            "Regulatory Governance",
            "Cross-functional Team Management"
          ]
        }
      ]
    },
    experience,
    projects: [
      {
        name: projectName,
        ...(projectSubtitle ? { subtitle: projectSubtitle } : {}),
        highlights: projectHighlights
      }
    ],
    education,
    certifications,
    additional: { linksText: additionalLines.join(" ").replace(/\s+/g, " ").trim() }
  };
}

const outputPath = path.join(process.cwd(), "data", "resume.json");
const schemaPath = path.join(process.cwd(), "data", "resume.schema.json");

const parsed = parseResume(resumeText);

const ajv = new Ajv({ allErrors: true });
const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
const validate = ajv.compile(schema);

if (!validate(parsed)) {
  console.error("Resume JSON validation failed:", validate.errors);
  process.exit(1);
}

writeFileSync(outputPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf-8");
console.log(`Wrote validated resume JSON to ${outputPath}`);
