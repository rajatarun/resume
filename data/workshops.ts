export type Workshop = {
  id: string;
  title: string;
  description: string;
  tutorial: string;
  questions: string;
};

export type WorkshopSeries = {
  name: string;
  description: string;
  index: string;
  workshops: Workshop[];
};

export const claudeWorkshops: WorkshopSeries = {
  name: "Claude Certified Associate (CCA)",
  description:
    "Six workshops aligned to the CCA exam domains. Each module ships with a tutorial PDF and a companion question set to test your understanding.",
  index:
    "https://tarun-website-tutorials.s3.amazonaws.com/claude/CCA%20Workshop%20INDEX.pdf",
  workshops: [
    {
      id: "00",
      title: "Getting Started",
      description:
        "Master the Claude API fundamentals before tackling the 5 exam domains. Covers the Messages API structure, required fields, and response anatomy. Learn model selection (opus vs sonnet vs haiku), streaming, prompt caching, token management, error handling with exponential backoff, and cost optimization via the Batch API.",
      tutorial:
        "https://tarun-website-tutorials.s3.amazonaws.com/claude/CCA%20Workshop%2000%20GettingStarted.pdf",
      questions:
        "https://tarun-website-tutorials.s3.amazonaws.com/claude/CCA%20Workshop%2000%20Questions.pdf",
    },
    {
      id: "01",
      title: "Agentic Architecture",
      description:
        "Domain 1 — 27% of the CCA exam. Deep-dive into agentic loop design using stop_reason and tool_use patterns. Covers coordinator/subagent hub-and-spoke architecture, parallel subagent spawning, PreToolUse and PostToolUse hooks for programmatic enforcement, session forking for parallel exploration, structured handoff protocols, and human-in-the-loop escalation triggers.",
      tutorial:
        "https://tarun-website-tutorials.s3.amazonaws.com/claude/CCA%20Workshop%2001%20AgenticArchitecture.pdf",
      questions:
        "https://tarun-website-tutorials.s3.amazonaws.com/claude/CCA%20Workshop%2001%20Questions.pdf",
    },
    {
      id: "02",
      title: "Tool Design & MCP",
      description:
        "Domain 2 — 18% of the CCA exam. Learn to write effective tool descriptions that eliminate selection ambiguity, and design structured error responses using isError and errorCategory for intelligent agent recovery. Covers tool_choice modes (auto, any, forced), MCP server configuration at project and user levels, environment variable expansion for secrets, and the built-in Claude Code tools: Read, Write, Edit, Grep, Glob, and Bash.",
      tutorial:
        "https://tarun-website-tutorials.s3.amazonaws.com/claude/CCA%20Workshop%2002%20ToolDesign%20MCP.pdf",
      questions:
        "https://tarun-website-tutorials.s3.amazonaws.com/claude/CCA%20Workshop%2002%20Questions.pdf",
    },
    {
      id: "03",
      title: "Claude Code",
      description:
        "Domain 3 — 20% of the CCA exam. Master Claude Code's CLAUDE.md hierarchy across project, directory, and user levels. Build slash commands and skills with frontmatter configuration including context: fork for isolated sub-agents and allowed-tools for scope restriction. Covers CI/CD integration with the -p flag and --output-format json, iterative refinement techniques, multi-pass PR review patterns, and the Explore subagent for context-efficient codebase discovery.",
      tutorial:
        "https://tarun-website-tutorials.s3.amazonaws.com/claude/CCA%20Workshop%2003%20ClaudeCode.pdf",
      questions:
        "https://tarun-website-tutorials.s3.amazonaws.com/claude/CCA%20Workshop%2003%20Questions.pdf",
    },
    {
      id: "04",
      title: "Prompt Engineering",
      description:
        "Domain 4 — 20% of the CCA exam. Replace vague instructions with explicit criteria that produce consistent, measurable results. Learn to use few-shot examples for edge cases, enforce structured output via tool_use JSON schemas (the only reliable approach), and build validation loops with retry-with-feedback. Covers self-correction flows, semantic vs syntactic validation, the Batch API for 50% cost reduction on bulk workloads, and prompt chaining for complex multi-step tasks.",
      tutorial:
        "https://tarun-website-tutorials.s3.amazonaws.com/claude/CCA%20Workshop%2004%20PromptEngineering.pdf",
      questions:
        "https://tarun-website-tutorials.s3.amazonaws.com/claude/CCA%20Workshop%2004%20Questions.pdf",
    },
    {
      id: "05",
      title: "Context & Reliability",
      description:
        "Domain 5 — 15% of the CCA exam. Build systems that stay reliable over long horizons. Covers context window budgeting, proactive checkpointing at 80-90% capacity, structured handoff summaries for agent-to-agent and agent-to-human transitions, and session resumption vs fresh-start decisions. Learn multi-instance independent review to eliminate generation bias, human-in-the-loop escalation trigger design, and the lost-in-the-middle attention problem with mitigation strategies.",
      tutorial:
        "https://tarun-website-tutorials.s3.amazonaws.com/claude/CCA%20Workshop%2005%20ContextReliability.pdf",
      questions:
        "https://tarun-website-tutorials.s3.amazonaws.com/claude/CCA%20Workshop%2005%20Questions.pdf",
    },
  ],
};
