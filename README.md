# Tarun Raja Resume Website

Static-exported Next.js resume website powered by `data/resume.json`.

## Regenerate resume JSON

```bash
npm run resume:build
```

This runs `scripts/build_resume_json.ts`, parses the embedded resume text, validates output against `data/resume.schema.json`, and writes `data/resume.json`.

## Local build

```bash
npm run build
```

Build runs `resume:build` first and outputs static files to `out/` for Amplify hosting.

## Deploy on AWS Amplify

1. Connect this repository/branch in Amplify.
2. Ensure build spec uses `amplify.yml` in repo root.
3. Amplify executes:
   - `npm ci`
   - `npm run build`
4. Artifact directory is `out/`.

Deep routes (`/resume`, `/projects`, `/recruiter`, `/contact`) are statically exported.
