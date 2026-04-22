# Recent Updates (Changelog)

This document tracks the most recent updates that have been pushed to the repository. For a full historical record, see [HISTORY.md](file:///c:/Users/IamMr/OneDrive/Documents/SKD/SKD-frame2frame/frame2frame/Projects/SKD%20Photo%20Studio%20-%20Frame2Frame/docs/HISTORY.md).

---

## [v2.3.0] - 2026-04-22 (Current Push)
### 🛡️ Hardening & Security
- **Auth Lockdown**: Stripped all local development authentication bypass code from the production logic.
- **Middleware Cleanup**: Unified Supabase auth enforcement across both frontend and backend.

### 📈 Financial & Data Accuracy
- **Excel Export Fix**: Resolved the column alignment issue in Artist Expense exports by properly handling date columns.
- **Rounding Logic**: Standardized all balance calculations to 2 decimal places to prevent penny discrepancies.
- **Usual Role Auto-fill**: Implemented intelligent auto-fill for artist and output expenses based on team member preferences.

### 🧹 Maintenance & Organization
- **Doc Restructure**: Reorganized documentation into a 5-file system (History, Architecture, Pending, Roadmap, Changelog).
- **Bulk Hardening**: Implemented case-insensitive lookups and automatic workspace membership for bulk uploads.

---
*Last Updated: 2026-04-22*
