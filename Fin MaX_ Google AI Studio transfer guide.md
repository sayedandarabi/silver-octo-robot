# Fin MaX: Google AI Studio transfer guide

## What is included

This package preserves the Expo/React Native application, server-side tRPC and Express runtime, Drizzle/MySQL schema and migrations, offline financial engines, RTL UI assets, tests, exact dependency lockfile, safe environment template, demo fixtures and implementation documentation. The import root is the directory containing `package.json`, `pnpm-lock.yaml`, `app/`, `server/`, `lib/`, `shared/`, `drizzle/`, `assets/`, `tests/` and `docs/`.

The package does not contain real credentials, database contents, Git history, `node_modules`, Expo caches or generated `dist` output. This is intentional: credentials must be entered in the destination's server-side secrets manager, while dependencies are deterministically restored from `pnpm-lock.yaml`.

## Recommended import path

Google's official Build Mode documentation states that an existing repository can be imported from the **Add files (+) menu → Import from GitHub**. The official GitHub sync guide also documents two-way sync and importing a repository as a new app. For the most reliable transfer, publish this source tree to a private GitHub repository, then import that repository in AI Studio Build Mode.

If a GitHub repository is not available, upload `FinMaX-Google-AI-Studio-transfer.zip` through the file/project import flow available in the destination account. After extraction, the project root must remain the directory containing `package.json`; do not upload only `app/` or only `components/`.

## First-run procedure

1. Open the imported repository in Google AI Studio Build Mode.
2. Confirm the project root has `package.json`, `pnpm-lock.yaml`, `app.config.ts` and `server/_core/index.ts`.
3. Copy `.env.example` to `.env` only in a private development environment, or enter the equivalent values in the server-side Secrets panel. Never put `MANUS_JWT_SECRET`, `DATABASE_URL`, provider tokens or backup passwords in client code.
4. Install with the exact package manager declared by `package.json`: `corepack enable && pnpm install --frozen-lockfile`. If pnpm is unavailable, `npm install` is a fallback but cannot guarantee byte-for-byte lockfile resolution.
5. Run `pnpm check`, `pnpm lint`, and `pnpm test`.
6. For the server, provide `DATABASE_URL`, run `pnpm db:push`, then run `pnpm dev:server`. For a web preview, set `EXPO_PUBLIC_API_BASE_URL` to the reachable server URL and run `pnpm dev:metro`.
7. Use `transfer/sample-data/seed-fixtures.json` as deterministic demo data for manual acceptance tests. The existing UI also contains typed local seed exports in `lib/finmax-data.ts` and `lib/finmax-modules.ts`.

## Important platform boundary

Google AI Studio Build Mode documents web apps with a Node.js server runtime and separately documents native Android apps as Kotlin/Jetpack Compose projects. Fin MaX is an Expo/React Native project with `react-native-ble-plx`; therefore the web-compatible screens and Node server can be inspected or adapted in AI Studio, but an Android development build and physical Bluetooth thermal-printer test still require Expo/native tooling outside the browser preview. Do not remove the BLE adapter or replace it with a simulated success response.

Google AI Studio can automatically install npm packages in its web runtime, but native Expo modules are not equivalent to browser packages. If the goal is a native Android port inside AI Studio, use this package as the functional specification and source reference and ask the agent to port the screens and contracts to Kotlin/Compose rather than pretending the React Native native modules are browser-compatible.

## Secrets and external services

A fully connected production run cannot be completed without destination values for the database, OAuth, JWT signing, and optional Telegram/WhatsApp providers. The package includes the complete variable names and safe placeholders in `.env.example`; it intentionally does not include values. The application remains usable in local/demo mode with the typed seed data when a server session is unavailable.

## Verification

Run `node transfer/verification/verify-transfer.mjs` from the transfer root. The script checks required roots, package identity, lockfile presence, migration files, documentation, sample fixtures and the absence of common secret files. It does not contact external services or claim that credentials, a database or a native printer are configured.

`TRANSFER_MANIFEST.json` records every packaged file, byte count and SHA-256 hash. `docs/FinMaX-dependency-inventory.json` records the installed production and development versions alongside the requested package names and registry tarball URLs; `pnpm-lock.yaml` remains the authoritative reproducible resolution file.

## References

[1]: https://ai.google.dev/gemini-api/docs/aistudio-build-mode "Google AI Studio Build apps documentation"
[2]: https://aistudio.google.com/learn/sync-your-ai-studio-apps-with-github "Google AI Studio GitHub sync documentation"
