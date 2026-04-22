# Project Operations & Maintenance

Detailed guides on how to manage, deploy, and maintain the **Frame2Frame** suite.

---

## 🛠️ Local Development

### Setup
1.  **Backend**: `cd backend && npm install && npm run dev`
2.  **Frontend**: `cd frontend && npm install && npm run dev`
3.  **Database**: Ensure Supabase environment variables are set in `backend/.env`.

### Environment Safety
-   **Security**: The "Dev Switch" for authentication bypass has been removed from the source code for production hardening. Authentication is now strictly enforced via Supabase.
-   **Local Config**: Never commit `.env` or `.env.local` files.

---

## 🚀 Deployment Workflow

### Mirror Sync (GitHub Actions)
The project is hosted in your personal repo and mirrored to the client organization (`SKD-Frame2Frame`).
-   **Trigger**: Every `push` to the `main` branch.
-   **Workflow**: `.github/workflows/sync-to-skd.yml`

### Vercel Monorepo
The project is a unified Next.js + Express monorepo.
-   **Production URL**: [Vercel Dashboard](https://vercel.com/skdhananjaygits-projects)
-   **Deployment Strategy**: Pushing to `main` triggers an automatic build on Vercel.

---

## 📂 Bulk Data Management

### Excel Migration
-   **Exporting**: Use the "Download Report" button on the dashboard.
-   **Formatting**: Exports include `Client Balance` and `Team Balance` calculated by the centralized financial engine.
-   **Importing**: Ensure Excel columns match the headers exactly. The system handles case-insensitive lookups and whitespace trimming automatically.

---
*Last Updated: 2026-04-22*
