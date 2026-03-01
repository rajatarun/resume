import type { Metadata } from "next";

const requiredEnv = ["GITHUB_USER", "LINKEDIN_USER"] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const baseUrl = "https://tarunraja.info";
export const githubUrl = `https://github.com/${process.env.GITHUB_USER}`;
export const linkedInUrl = `https://www.linkedin.com/in/${process.env.LINKEDIN_USER}`;

export const seoRoutes = ["/", "/resume", "/portfolio", "/recruiter", "/labs", "/blog", "/contact"] as const;

const sharedImages = [{ url: "/profile-photo.PNG", width: 1200, height: 630, alt: "Tarun Raja" }];

export const routeMetadata: Record<(typeof seoRoutes)[number], Metadata> = {
  "/": {
    title: "Tarun Raja — AI Systems Architect & Social-Media Technologist",
    description:
      "Tarun Raja builds trust-aware AI systems, resilient cloud platforms, and mentoring programs for engineering teams.",
    alternates: { canonical: "/" },
    openGraph: {
      title: "Tarun Raja — AI Systems Architect & Social-Media Technologist",
      description:
        "Explore Tarun Raja's work in AI systems architecture, SRE-enabled platforms, and social-media technology leadership.",
      url: "/",
      images: sharedImages
    },
    twitter: {
      card: "summary_large_image",
      title: "Tarun Raja — AI Systems Architect & Social-Media Technologist",
      description:
        "Explore Tarun Raja's work in AI systems architecture, SRE-enabled platforms, and social-media technology leadership.",
      images: ["/profile-photo.PNG"]
    }
  },
  "/resume": {
    title: "Tarun Raja — Resume",
    description: "Professional resume of Tarun Raja covering AI architecture, cloud engineering, and technical leadership.",
    alternates: { canonical: "/resume" },
    openGraph: {
      title: "Tarun Raja — Resume",
      description: "Experience, skills, certifications, and outcomes delivered by Tarun Raja.",
      url: "/resume",
      images: sharedImages
    },
    twitter: {
      card: "summary_large_image",
      title: "Tarun Raja — Resume",
      description: "Experience, skills, certifications, and outcomes delivered by Tarun Raja.",
      images: ["/profile-photo.PNG"]
    }
  },
  "/portfolio": {
    title: "Tarun Raja — Portfolio",
    description: "Portfolio highlights from Tarun Raja across cloud, AI, and platform engineering projects.",
    alternates: { canonical: "/portfolio" },
    openGraph: {
      title: "Tarun Raja — Portfolio",
      description: "Case-study style portfolio highlights with engineering outcomes and architecture context.",
      url: "/portfolio",
      images: sharedImages
    },
    twitter: {
      card: "summary_large_image",
      title: "Tarun Raja — Portfolio",
      description: "Case-study style portfolio highlights with engineering outcomes and architecture context.",
      images: ["/profile-photo.PNG"]
    }
  },
  "/recruiter": {
    title: "Recruiter Information — Tarun Raja",
    description: "Recruiter-ready summary of Tarun Raja's profile, verified experience, and direct contact context.",
    alternates: { canonical: "/recruiter" },
    openGraph: {
      title: "Recruiter Information — Tarun Raja",
      description: "A recruiter-focused view of Tarun Raja's experience and verification context.",
      url: "/recruiter",
      images: sharedImages
    },
    twitter: {
      card: "summary_large_image",
      title: "Recruiter Information — Tarun Raja",
      description: "A recruiter-focused view of Tarun Raja's experience and verification context.",
      images: ["/profile-photo.PNG"]
    }
  },
  "/labs": {
    title: "Tarun Raja — AI Labs",
    description: "AI lab experiments and applied prototypes by Tarun Raja for practical product and platform development.",
    alternates: { canonical: "/labs" },
    openGraph: {
      title: "Tarun Raja — AI Labs",
      description: "Explore practical AI labs, experiments, and implementation walkthroughs.",
      url: "/labs",
      images: sharedImages
    },
    twitter: {
      card: "summary_large_image",
      title: "Tarun Raja — AI Labs",
      description: "Explore practical AI labs, experiments, and implementation walkthroughs.",
      images: ["/profile-photo.PNG"]
    }
  },
  "/blog": {
    title: "Tarun Raja — Blog",
    description: "Architecture, DevOps, and AI systems insights from Tarun Raja for engineering and platform teams.",
    alternates: { canonical: "/blog" },
    openGraph: {
      title: "Tarun Raja — Blog",
      description: "Insights on architecture, cloud reliability, and practical AI implementation.",
      url: "/blog",
      images: sharedImages
    },
    twitter: {
      card: "summary_large_image",
      title: "Tarun Raja — Blog",
      description: "Insights on architecture, cloud reliability, and practical AI implementation.",
      images: ["/profile-photo.PNG"]
    }
  },
  "/contact": {
    title: "Tarun Raja — Contact",
    description: "Contact Tarun Raja for architecture consulting, mentorship, speaking, and collaboration opportunities.",
    alternates: { canonical: "/contact" },
    openGraph: {
      title: "Tarun Raja — Contact",
      description: "Get in touch with Tarun Raja for mentoring and engineering collaboration.",
      url: "/contact",
      images: sharedImages
    },
    twitter: {
      card: "summary_large_image",
      title: "Tarun Raja — Contact",
      description: "Get in touch with Tarun Raja for mentoring and engineering collaboration.",
      images: ["/profile-photo.PNG"]
    }
  }
};
