# Fin MaX

Fin MaX is an offline-first Expo/React Native accounting, inventory, POS, manufacturing and financial operations app for the Afghan market. The product supports Dari/Persian RTL workflows, AFN-first money precision, multi-currency records, server-backed synchronization through tRPC, encrypted backups, provider messaging and Bluetooth thermal printing through a native development build.

## Product identity

- Display name: **Fin MaX**
- Package name and slug: `finmax`
- Android/iOS bundle namespace: `space.manus.finmax.t173474036053484`
- tRPC application namespace: `finmax`
- Local storage namespace: `finmax.settings.v1` and `finmax.snapshot.v1`
- Server scheduling header: `x-finmax-schedule-token`
- Server backup secrets: `FINMAX_SCHEDULE_TOKEN` and `FINMAX_BACKUP_PASSWORD`

## Main modules

- Dashboard with light/dark Kabul Signal glassmorphism UI and RTL support
- Customer ledger and receivables
- Live inventory, cardex and stock validation
- Double-entry accounting, trial balance and profit/loss
- POS with search, camera barcode scanning, discounts, tax and shared receipt DTO
- Installments, checks and partner capital/profit transactions
- Multi-currency catalog and exchange rates
- Manufacturing recipes, batch production and costing
- PDF/XLSX report generation
- Encrypted AES-256-GCM backups
- Server-only Telegram/WhatsApp adapters with delivery logs
- Bluetooth BLE ESC/POS thermal printing with browser/system print fallback

## Development

```bash
pnpm install
pnpm check
pnpm lint
pnpm test
pnpm build
```

For the Expo web preview:

```bash
npx expo start --web --port 8081
```

For native Bluetooth testing, use an Expo development build rather than Expo Go because `react-native-ble-plx` requires native modules.

## Source layout

- `app/`: Expo Router screens
- `components/finmax/`: shared Fin MaX UI and dashboard primitives
- `lib/`: financial engine, offline storage, receipt DTO and feature engines
- `shared/`: frontend/backend Zod contracts
- `server/`: tRPC router, database transactions, provider adapters and scheduled backup endpoint
- `drizzle/`: database schema and migrations
- `tests/`: unit and integration coverage
- `docs/`: architecture, requirements status, rename report, implementation guide and validation report

## Delivery note

The Fin MaX application identity is fully renamed in source, configuration, metadata, tests and documentation. The platform-assigned published hostname is controlled by the Manus Webdev project and is not a repository field; the current hostname remains the existing platform URL until a custom-domain or platform-hostname operation is performed in the project dashboard. The app slug, native package identity and all product-facing metadata are already `finmax`/`Fin MaX`.
