import fs from "node:fs";
import pdfParse from "pdf-parse";

async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath) throw new Error("Usage: npm run parse:resume -- ./Tarun-Raja-Resume.pdf");

  const buffer = fs.readFileSync(pdfPath);
  const parsed = await pdfParse(buffer);

  const normalized = {
    profile: { name: "Tarun Raja", title: "Senior Product Engineer", location: "", summary: parsed.text.slice(0, 240), email: "", phone: "", links: [] },
    skills: [],
    experience: [],
    projects: [],
    education: [],
    certifications: []
  };

  fs.writeFileSync("data/resume.json", JSON.stringify(normalized, null, 2));
  console.log("Wrote normalized resume scaffold to data/resume.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
