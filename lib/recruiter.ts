export type RecruiterMode = "recruiter";

interface RecruiterModeConfig {
  openingMessage: string;
  questionPrefix: string;
  placeholder: string;
  label: string;
}

const recruiterModeConfig: Record<RecruiterMode, RecruiterModeConfig> = {
  recruiter: {
    openingMessage:
      "Recruiter mode activated. I can help summarize fit, impact, and role alignment. Ask about strengths, outcomes, and highlights relevant to hiring.",
    questionPrefix:
      "You are in recruiter mode. Focus on candidate fit, role alignment, leadership, communication, and measurable impact.",
    placeholder: "Ask about role fit, achievements, and hiring-relevant highlights...",
    label: "Recruiter"
  }
};

export const getRecruiterModeConfig = (mode: RecruiterMode): RecruiterModeConfig => recruiterModeConfig[mode];

export const buildRecruiterModeQuestion = (mode: RecruiterMode, question: string): string => {
  const config = getRecruiterModeConfig(mode);
  return `${config.questionPrefix}\n\nQuestion: ${question}`;
};
