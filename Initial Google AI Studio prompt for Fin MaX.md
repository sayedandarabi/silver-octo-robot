# Initial Google AI Studio prompt for Fin MaX

Import this repository as the existing Fin MaX codebase. Do not rewrite the project into a generic starter, delete native modules, or replace real backend calls with mocked success states.

First inspect `README.md`, `docs/Google-AI-Studio-transfer.md`, `TRANSFER_MANIFEST.json`, `package.json`, `pnpm-lock.yaml`, `app.config.ts`, `server/_core/index.ts`, `server/finmaxRouter.ts`, `drizzle/schema.ts`, `lib/finmax-engine.ts`, `lib/finmax-modules-engine.ts`, `lib/finmax-phase3-engine.ts`, `shared/finmax-contracts.ts`, and the files under `tests/`.

Restore dependencies from `pnpm-lock.yaml`. Run `pnpm check`, `pnpm lint`, and `pnpm test` before changing behavior. Keep the `finmax` package identity, the RTL Dari/Persian UI, AFN BigInt financial precision, offline-first local seed behavior, tRPC namespace, Drizzle migrations, and the server-only secret boundary.

For web preview, preserve the Expo web routes and make browser-incompatible native features show an explicit fallback. Do not claim Bluetooth printing works in a browser. Keep `react-native-ble-plx` and the ESC/POS adapter for the native Android development build. If a native Android implementation is requested inside AI Studio, create a separate Kotlin/Jetpack Compose port while treating the existing TypeScript contracts and tests as the source of truth.

Before declaring completion, show the changed files, run the full validation commands again, and report any missing external value such as `DATABASE_URL`, OAuth credentials, provider tokens, or native-device access instead of inventing it.
