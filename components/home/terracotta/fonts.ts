import { Instrument_Serif, JetBrains_Mono, Newsreader } from "next/font/google";

// The editorial type shared by terracotta and prism: serif display, serif
// body, mono labels. next/font must be called once at module scope, so both
// designs import these rather than declaring their own.
const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-display" });
const body = Newsreader({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

/** Class names that define --font-display, --font-body and --font-mono. */
export const editorialFontVariables = `${display.variable} ${body.variable} ${mono.variable}`;
