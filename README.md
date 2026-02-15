# AI Interview Platform

A web application that generates interview questions dynamically by analyzing candidate resume text, desired skills, and role.

## Modes

- **AI mode (default when configured):** Uses OpenAI Responses API for personalized question generation, scoring rubric creation, and follow-up prompts.
- **Fallback mode:** If AI is unavailable/misconfigured, automatically falls back to deterministic regex + template generation.

## Features

- Resume-aware question generation with role context.
- Skill detection from keywords (JavaScript, React, Python, SQL, DevOps, Testing, System Design, Data Science).
- Difficulty adapts to detected seniority signals.
- Interview scoring rubric with category guidance.
- Follow-up generation and expected answer signals in AI mode.

## Setup

Optional (to enable AI mode):

```bash
export OPENAI_API_KEY="your_key_here"
export OPENAI_MODEL="gpt-4o-mini" # optional
```

## Run locally

```bash
npm start
```

Open `http://localhost:3000`.

## Test

```bash
npm test
```
