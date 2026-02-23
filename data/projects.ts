export type ProjectCategory = "Backend" | "Frontend" | "Cloud" | "GenAI";

export const projects = [
  {
    id: "proj-1",
    title: "Global Payments Modernization",
    category: "Backend",
    summary: "Led a platform rewrite that unified payments services across regions.",
    stack: ["Node.js", "TypeScript", "Kafka", "PostgreSQL"],
    impact: ["Reduced settlement defects by 31%", "Improved release frequency from monthly to weekly"]
  },
  {
    id: "proj-2",
    title: "Executive Insights Dashboard",
    category: "Frontend",
    summary: "Built a real-time leadership dashboard for engineering and business KPIs.",
    stack: ["Next.js", "React", "TailwindCSS", "Recharts"],
    impact: ["Increased stakeholder visibility across 4 global teams", "Cut status-report preparation time by 70%"]
  },
  {
    id: "proj-3",
    title: "Cloud Landing Zone Accelerator",
    category: "Cloud",
    summary: "Standardized secure account provisioning and CI/CD guardrails.",
    stack: ["AWS", "Terraform", "GitHub Actions", "Kubernetes"],
    impact: ["Reduced environment setup time from days to under 1 hour", "Passed compliance reviews with zero critical findings"]
  },
  {
    id: "proj-4",
    title: "GenAI Knowledge Assistant",
    category: "GenAI",
    summary: "Designed a retrieval-powered assistant for internal engineering playbooks.",
    stack: ["OpenAI", "LangChain", "Vector DB", "Next.js"],
    impact: ["Reduced repetitive support queries by 45%", "Enabled faster onboarding for new engineers"]
  }
] as const;
