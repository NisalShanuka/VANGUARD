# VANGUARD Project Documentation (Agent Guide)

## 1) Project Purpose
VANGUARD is a Next.js App Router web platform for a FiveM/GTA roleplay community.

It provides:
- Public website content (home, rules, counts, knowledgebase, announcements)
- Discord-authenticated User Control Panel (UCP)
- Dynamic application system (types + custom questions + submissions)
- Admin dashboard (application review, announcements, server actions, knowledgebase editing)
- Integration with both a web app database and a game database

## 2) Tech Stack
- Framework: Next.js 16 (App Router)
- UI: React 19, Tailwind CSS v4, Framer Motion
- Auth: NextAuth (Discord provider)
- DB: MySQL (`mysql2/promise`)
- Deploy target: Netlify (`@netlify/plugin-nextjs`)

## 3) Core Architecture
### 3.1 Global App Shell
- `src/app/layout.js`: Root layout and metadata
- `src/components/Providers.jsx`: `SessionProvider` + `LanguageProvider`
- `src/components/Layout.jsx`: global background, header/footer, loading screen, music controls

### 3.2 Localization
- `src/i18n/translations.js`: EN/SI dictionaries
- `src/i18n/LanguageContext.jsx`: language state + `t()` helper
- `src/i18n/utils.js`: localized object fallback helper

### 3.3 Authentication
- NextAuth route: `src/app/api/auth/[...nextauth]/route.js`
- NextAuth config: `src/lib/auth.js`
- Middleware protection: `src/middleware.js` (protects `/ucp/*`)

### 3.4 Databases
- App DB pool: `src/lib/db.js`
- Game DB pool: created inside `src/app/api/ucp/characters/route.js`

## 4) Main Route Map
### Public
- `/` -> `src/app/page.js`, `src/app/HomeClient.jsx`
- `/knowledgebase` -> `src/app/knowledgebase/page.js`
- `/rules/[slug]` -> `src/app/rules/[slug]/page.js`
- `/counts/[slug]` -> `src/app/counts/[slug]/page.js`
- `/announcements` -> `src/app/announcements/page.js`
- `/announcements/[id]` -> `src/app/announcements/[id]/page.js`
- `/whitelist`, `/whitelist/english`, `/whitelist/sinhala`

### Authenticated User (UCP)
- `/ucp`
- `/ucp/my-applications`
- `/ucp/my-characters`
- `/ucp/apply/[slug]`

### Admin
- `/admin`

## 5) API Route Map
### Public / Shared
- `GET /api/public/application-types`
- `GET /api/knowledgebase`
- `GET /api/knowledgebase/[slug]`
- `GET /api/notifications` (session-aware)

### User
- `GET /api/ucp/dashboard`
- `GET /api/ucp/applications`
- `GET /api/ucp/characters`
- `GET /api/applications/form?slug=...`
- `POST /api/applications/submit`
- `POST /api/whitelist`

### Admin
- `GET/PATCH /api/admin/applications`
- `GET/POST /api/admin/types`
- `PATCH/DELETE /api/admin/types/[id]`
- `GET/POST/DELETE /api/admin/questions`
- `GET/POST/PUT/DELETE /api/admin/announcements`
- `GET /api/admin/announcements/[id]`
- `GET/POST /api/admin/knowledgebase`
- `GET /api/admin/logs`
- `GET/POST /api/admin/fix-active`
- `GET/POST /api/admin/server`
- `GET /api/admin/server/data`
- `GET /api/admin/server/items`

### Debug
- `GET/POST /api/debug-db`

## 6) Data Model (Observed)
Primary app tables used by code:
- `application_users`
- `application_types`
- `application_questions`
- `applications`
- `admin_announcements`
- `admin_logs`
- `kv_store`
- `knowledgebase_pages`

Game DB tables queried by UCP characters API include:
- `users`, `players`, `player_vehicles`
- `0resmon_apartment_rooms`, `stores`, `fuel_stations`
- `qbx_prison`, `deathmatch_profiles`, `dicebet_stats`
- `appearance`, `outfits`

## 7) Environment Variables
Required variables (see `.env_example`):
- NextAuth: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- Discord: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, optional bot/guild fields
- App DB: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Game DB: `GAME_DB_HOST`, `GAME_DB_USER`, `GAME_DB_PASSWORD`, `GAME_DB_NAME`
- FiveM Admin API: `FIVEM_API_URL`, `FIVEM_API_TOKEN`

## 8) Local Development
1. Install dependencies:
   - `npm install`
2. Create env file:
   - `.env.local` (already generated from `.env_example`)
3. Run dev server:
   - `npm run dev`
4. Open:
   - `http://localhost:3000`

### 8.1 SWC / Turbopack Troubleshooting (Windows)
If you see an error like:
- `@next/swc-win32-x64-msvc ... is not a valid Win32 application`
- `turbo.createProject is not supported by the wasm bindings`

Use webpack dev mode:
- `npm run dev` (already configured as `next dev --webpack`)

Optional turbo command is still available:
- `npm run dev:turbo`

### 8.2 LightningCSS Native Binary Issue (Windows)
If CSS compilation fails with:
- `Cannot find module '../lightningcss.win32-x64-msvc.node'`
- or native `lightningcss-win32-x64-msvc` load errors

The project includes an automatic fix:
- `scripts/patch-lightningcss.js`
- runs via `postinstall`
- rewires `lightningcss` loader files to use `lightningcss-wasm`

## 9) Agent Conventions for Future Work
1. Keep application status values consistent with DB enum:
   - `pending`, `interview`, `accepted`, `declined`
2. Do not use React hooks inside loops/maps/conditions.
3. Keep admin actions logged through `admin_logs`.
4. For new knowledgebase pages, persist both `data_en` and `data_si` JSON.
5. Prefer adding new API behavior through route handlers in `src/app/api/*`.
6. Maintain EN/SI text parity where possible.

## 10) Recent Cleanup Applied
- Fixed invalid React hook usage in `src/app/ucp/my-characters/page.js` by moving vehicle card state into a dedicated component.
- Unified UCP status styling to use `accepted/declined` instead of `approved/rejected`.
- `counts/[slug]` now uses `SituationLayout` (instead of rules layout).
- Removed several unused imports and fixed React select default option pattern in `WhitelistForm`.

## 11) Known Remaining Risks / Future Refactor Targets
- `src/app/admin/page.js` is very large and should be split into smaller components/hooks.
- Some Sinhala text/content appears encoding-sensitive depending on editor/terminal settings.
- Ensure dependencies are installed before linting (`npm run lint` failed in one environment because `eslint` binary was missing before install).
