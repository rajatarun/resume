export type Resume = {
  profile: {
    name: string;
    title: string;
    location: string;
    summary: string;
    email: string;
    phone: string;
    links: Array<{ label: string; url: string }>;
  };
  skills: Array<{ group: string; items: string[] }>;
  experience: Array<{ company: string; role: string; years: string; bullets: string[] }>;
  projects: Array<{ name: string; description: string; tech: string[] }>;
  education: Array<{ institution: string; degree: string; years: string }>;
  certifications: string[];
};
