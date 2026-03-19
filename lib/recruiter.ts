export type RecruiterMode = "recruiter";

interface RecruiterModeConfig {
  openingMessage: string;
  placeholder: string;
  label: string;
}

const recruiterModeConfig: Record<RecruiterMode, RecruiterModeConfig> = {
  recruiter: {
    openingMessage:
      "Welcome to the About Tarun Raja chat. I can help you explore Tarun's experience, leadership style, projects, and measurable outcomes. Ask anything and I'll provide a concise summary.",
    placeholder: "Ask about Tarun Raja's background, strengths, projects, and outcomes...",
    label: "About"
  }
};

export const getRecruiterModeConfig = (mode: RecruiterMode): RecruiterModeConfig => recruiterModeConfig[mode];

