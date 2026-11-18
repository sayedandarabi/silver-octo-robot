# راهنمای تحویل و پیاده‌سازی Fin MaX

## معماری

Fin MaX چهار لایه دارد:

1. **Expo/React Native UI** در `app/` و `components/finmax/`؛ صفحه‌ها RTL هستند و در حالت offline از snapshot محلی استفاده می‌کنند.
2. **Storage و financial engine** در `lib/`؛ مقادیر پول با `bigint` نگهداری می‌شوند و محاسبات floating-point وارد هسته نمی‌شود.
3. **Shared contracts** در `shared/finmax-contracts.ts`؛ تمام mutationها با Zod اعتبارسنجی می‌شوند.
4. **Backend** در `server/` و schema در `drizzle/`؛ mutationهای حساس در transaction اتمیک اجرا، access business بررسی و audit ثبت می‌شود.

## Feature ownership

- Dashboard: `app/(tabs)/index.tsx`, `components/finmax/finmax-dashboard.tsx`
- Accounting: `app/accounting.tsx`, `lib/finmax-modules-engine.ts`
- Inventory: `app/inventory.tsx`, `server/finmax-db.ts`
- Customers: `app/customers.tsx`
- POS: `app/pos.tsx`, `lib/receipt.ts`, `lib/thermal-printer.ts`
- Advanced finance: `app/finance.tsx`
- Production, exports, messaging and backup: `app/phase3.tsx`, `lib/finmax-phase3-engine.ts`, `server/finmax-phase3-db.ts`
- Main API: `server/finmaxRouter.ts`

## Backend namespace

Frontend calls must use `trpc.finmax.*`. The root router is exported from `server/routers.ts` as:

```ts
export const appRouter = router({
  finmax: finmaxRouter,
  // system and auth routes remain separate
});
```

## Environment and secrets

Server-only values use these names:

- `FINMAX_SCHEDULE_TOKEN`: authenticates scheduled backup callbacks.
- `FINMAX_BACKUP_PASSWORD`: protects the server-generated encrypted backup.
- Existing provider credentials remain server-only and are never placed in the mobile bundle.

## Native Bluetooth test

The BLE adapter is intentionally not simulated on web. Use an Expo development build on a physical Android device with Bluetooth enabled, then test:

1. Open POS and grant Bluetooth permissions.
2. Start printer discovery.
3. Select a compatible ESC/POS BLE printer.
4. Confirm `discovering → connecting → ready` status.
5. Complete a sale and confirm `printing → completed`.
6. Disconnect the printer and confirm the user receives a real fallback/error state.

Expo Go is insufficient for `react-native-ble-plx`; a development/native build is required.

## Offline and online behavior

- Dashboard and local snapshot continue to work without a session.
- Protected tRPC reads/mutations only become active after authenticated business resolution.
- If the backend is unavailable, the UI keeps the local operation and shows an explicit synchronization notice rather than claiming a server write succeeded.
- Money and quantities cross the API as strings where precision matters.

## Release checklist

```bash
pnpm install
pnpm check
pnpm lint
pnpm test
pnpm build
npx expo config --type public
npx expo export --platform web
```

Then verify `/manus-routes.json`, review the checkpoint diff, push the intended commit to `origin/main`, and publish from the Manus project dashboard or publish operation.
