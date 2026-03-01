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
      "Welcome to the About Tarun Raja chat. I can help you explore Tarun's experience, leadership style, projects, and measurable outcomes. Ask anything and I'll provide a concise summary.",
    questionPrefix:
      "You are in about mode for Tarun Raja. Focus on career highlights, technical depth, leadership, communication, and measurable impact.",
    placeholder: "Ask about Tarun Raja's background, strengths, projects, and outcomes...",
    label: "About"
  }
};

export const getRecruiterModeConfig = (mode: RecruiterMode): RecruiterModeConfig => recruiterModeConfig[mode];

export const buildRecruiterModeQuestion = (mode: RecruiterMode, question: string): string => {
  const config = getRecruiterModeConfig(mode);
  return `${config.questionPrefix}\n\nQuestion: ${question}`;
};
