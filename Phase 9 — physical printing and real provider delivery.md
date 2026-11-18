

## Phase 9 — physical printing and real provider delivery

- [x] **Bluetooth ESC/POS adapter** — Reuse the existing POS receipt DTO, request Android Bluetooth permissions, discover nearby printers, connect to a selected device, encode receipt bytes with ESC/POS commands, send the job in chunks, expose `idle / requesting-permission / discovering / connecting / printing / completed / failed` states, and keep Expo/browser print as fallback on web or when native BLE is unavailable. Physical device validation remains required for printer-specific UUIDs and Persian glyph support.
- [x] **Telegram daily report** — Build the daily financial summary from server truth, call Telegram `sendMessage`, keep the bot token server-side, and persist provider response/error status in `messageLogs`. `sendDocument` attachment delivery remains an optional provider extension.
- [x] **WhatsApp daily report** — Build the same server-truth summary, call the WhatsApp Cloud API with server-side access token and phone-number ID, persist provider response/error status, and never place credentials in the mobile bundle.
- [x] **Delivery control UI and retries** — Add provider channel selection, preview/message text, daily-summary send, manual send, log count, and retry-safe failure messages to `/phase3`; provider-not-configured is a handled failure, not a fake success.
