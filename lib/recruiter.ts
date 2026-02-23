export type RecruiterMode = "Recruiter Mode" | "CTO Mode" | "Engineer Mode";

interface RecruiterModeConfig {
  openingMessage: string;
  questionPrefix: string;
  placeholder: string;
}

const recruiterModeConfig: Record<RecruiterMode, RecruiterModeConfig> = {
  "Recruiter Mode": {
    openingMessage:
      "Recruiter Mode activated. I can help summarize fit, impact, and role alignment. Ask about strengths, outcomes, and highlights relevant to hiring.",
    questionPrefix:
      "You are in Recruiter Mode. Focus on candidate fit, role alignment, leadership, communication, and measurable impact.",
    placeholder: "Ask about role fit, achievements, and hiring-relevant highlights..."
  },
  "CTO Mode": {
    openingMessage:
      "CTO Mode activated. I can help with architecture depth, technology decisions, scaling, and leadership execution trade-offs.",
    questionPrefix:
      "You are in CTO Mode. Focus on architecture decisions, scalability, reliability, system trade-offs, and technical leadership.",
    placeholder: "Ask about architecture, scaling, and strategic technical decisions..."
  },
  "Engineer Mode": {
    openingMessage:
      "Engineer Mode activated. I can help with implementation details, code-level trade-offs, and practical execution specifics.",
    questionPrefix:
      "You are in Engineer Mode. Focus on implementation details, debugging approach, code quality, testing, and practical execution.",
    placeholder: "Ask about implementation details, tooling, and execution..."
  }
};

export const getRecruiterModeConfig = (mode: RecruiterMode): RecruiterModeConfig => recruiterModeConfig[mode];

export const buildRecruiterModeQuestion = (mode: RecruiterMode, question: string): string => {
  const config = getRecruiterModeConfig(mode);
  return `${config.questionPrefix}\n\nQuestion: ${question}`;
};
