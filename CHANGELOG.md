# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning principles where possible.

## [Unreleased]

### Added
- Added `docs/PROJECT_AGENT_GUIDE.md` with architecture, route/API map, environment setup, and troubleshooting guidance for future contributors/agents.
- Added `src/proxy.js` (Next.js 16-compatible auth route protection convention replacing deprecated middleware convention).
- Added `scripts/patch-lightningcss.js` to patch `lightningcss` to use `lightningcss-wasm` in environments where native LightningCSS binaries fail to load.
- Added npm `postinstall` hook to run the LightningCSS patch automatically after dependency install.
- Added `dev:turbo` npm script (`next dev`) while keeping stable local development on webpack mode.
- Added `src/lib/discord.js` helper to auto-add authenticated Discord users to a configured guild via Discord API.

### Changed
- Updated `dev` npm script to `next dev --webpack` to avoid Turbopack runtime failure on WASM SWC fallback environments.
- Updated counts pages to use `SituationLayout` instead of `RulesLayout` for proper semantics and UI flow.
- Standardized UCP application status checks to enum values used by backend (`pending`, `interview`, `accepted`, `declined`) instead of mixed labels.
- Updated `src/components/WhitelistForm.jsx` select handling to React-safe default selection (`defaultValue=""` instead of `selected` on `<option>`).
- Removed direct `@next/swc-win32-x64-msvc` dependency entry from `package.json` (Next manages this internally).
- Updated Discord OAuth scope in `src/lib/auth.js` to include `guilds.join` and trigger server auto-join during login.
- Updated `.env_example` with safer placeholder values and clearer Discord auto-join variable descriptions (`DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`).

### Fixed
- Fixed invalid React Hook usage in `src/app/ucp/my-characters/page.js` by moving per-vehicle image state into dedicated `VehicleCard` component (no hooks inside map loops).
- Fixed local dev compile crash caused by missing native LightningCSS module (`../lightningcss.win32-x64-msvc.node`) via deterministic WASM fallback patch.
- Removed unused imports in multiple components/pages to reduce lint/runtime noise.
- Resolved Next.js deprecation warning by replacing `src/middleware.js` with `src/proxy.js`.

### Notes
- Native SWC warning may still appear on affected Windows environments; app runs with WASM fallback in webpack dev mode.
- Local port conflicts are environment/runtime process issues; not a code-level regression.
