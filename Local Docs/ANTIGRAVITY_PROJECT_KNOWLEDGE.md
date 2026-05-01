# 💎 Frame2Frame | Antigravity Knowledge Base
**Last Updated:** 2026-04-30
**Status:** Phase 1 (Admin Suite + Cloudflare Migration)

## 🏢 1. The IT Swarm Protocol
This project uses a "Separation of Duties" AI model:
- **👑 IT Head (AntiGravity):** The orchestrator (Me). Manages the pipeline, triggers builders, and communicates with the CTO.
- **🧠 Architect (Gemini CLI):** Produces `ARCHITECT_PLAN.md` (Blueprint).
- **🔨 Builder (Jules):** Autonomous agent (jules.google.com) that writes code from blueprints.
- **🤖 Reviewer (Gemini CLI):** Audits code via `review.js`.

## 🛠️ 2. Tech Stack & Infrastructure
- **Core:** Next.js 16 (App Router), React 19, TypeScript.
- **Database:** Supabase (with RLS & Workspace isolation).
- **Hosting:** Cloudflare Pages (v3.0 Migration).
- **CI/CD:** GitHub Actions (`mirror.yml`) as a manual production gate.

## 🎯 3. Current Mission: Cloudflare Stabilization
- **Goal:** Move from Vercel/Workers to a stable Cloudflare Pages deployment.
- **Blocker:** Build failures due to missing `export const runtime = 'edge'` in dynamic routes.
- **Secrets:** `GEMINI_API_KEY` (for Architect/Reviewer) and Supabase keys must be managed in Cloudflare Environment Variables.

## 📜 4. Core Docs (Source of Truth)
- `GEMINI.md`: Architectural rules & model preferences.
- `Local Docs/ARCHITECTURE.md`: Versioning and system design.
- `Local Docs/GEMINI_IT_DEPT_SPEC.md`: Detailed Swarm roles.
