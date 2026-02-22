# VANGUARD

VANGUARD is a Next.js 16 App Router platform for a FiveM/GTA RP community.

It includes:
- Public site pages (home, rules, counts, knowledgebase, announcements)
- Discord-authenticated UCP
- Dynamic whitelist/application system
- Admin panel for moderation/content/server actions
- MySQL-backed app data + game data integrations

## Tech Stack

- Next.js 16 (App Router), React 19
- NextAuth (Discord provider)
- MySQL via `mysql2/promise`
- Tailwind CSS v4 + Framer Motion
- Netlify-compatible Next runtime

## Local Setup

1. Install dependencies:
```bash
npm install
```
2. Create `.env.local` from `.env_example` and fill real values.
3. Start development server:
```bash
npm run dev
```
4. Open `http://localhost:3000`.

## Scripts

- `npm run dev` - Next dev in webpack mode (stable fallback on Windows)
- `npm run dev:turbo` - Next dev with Turbopack
- `npm run build` - production build
- `npm run start` - run built app
- `npm run lint` - ESLint

## Environment Variables

Required values (see `.env_example`):

- NextAuth
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`
- Discord OAuth
  - `DISCORD_CLIENT_ID`
  - `DISCORD_CLIENT_SECRET`
- Discord auto-join
  - `DISCORD_BOT_TOKEN`
  - `DISCORD_GUILD_ID`
- App DB
  - `DB_HOST`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`
- Game DB
  - `GAME_DB_HOST`
  - `GAME_DB_USER`
  - `GAME_DB_PASSWORD`
  - `GAME_DB_NAME`
- FiveM admin API
  - `FIVEM_API_URL`
  - `FIVEM_API_TOKEN`

## Discord Login And Auto-Join

When users sign in with Discord:
1. User authenticates via NextAuth Discord provider (`src/lib/auth.js`).
2. User record is created/updated in `application_users`.
3. App attempts to add the user to your Discord server using Discord API (`src/lib/discord.js`).

Requirements:
- OAuth scope includes `guilds.join` (already configured in `src/lib/auth.js`).
- Bot token and guild ID are set in env.
- The bot is invited to the target guild.
- Users may need to re-authenticate if they logged in before `guilds.join` was added.

## Core Paths

- Auth config: `src/lib/auth.js`
- Discord guild join helper: `src/lib/discord.js`
- Auth route: `src/app/api/auth/[...nextauth]/route.js`
- DB layer: `src/lib/db.js`
- Route protection: `src/proxy.js`
- Contributor-focused architecture doc: `docs/PROJECT_AGENT_GUIDE.md`

## Windows Troubleshooting

### SWC / Turbopack issues
If native SWC/Turbopack issues appear, use:
```bash
npm run dev
```
This project defaults to webpack mode for that reason.

### LightningCSS native binary issues
If LightningCSS native module fails, a postinstall patch applies a WASM fallback automatically:
- `scripts/patch-lightningcss.js`
- Runs via `postinstall`

## Security Notes

- Do not commit real secrets to the repository.
- Rotate any Discord/API/DB keys immediately if they were exposed.
