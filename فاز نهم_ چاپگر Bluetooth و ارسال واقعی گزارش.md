

## فاز نهم: چاپگر Bluetooth و ارسال واقعی گزارش

رسید POS اکنون از `ReceiptDocument` مشترک ساخته می‌شود و سه مسیر چاپ دارد: Bluetooth ESC/POS در native، Expo Print در موبایل، و `window.print` در وب. adapter جدید permissionهای Bluetooth را می‌گیرد، دستگاه‌های نزدیک را scan می‌کند، دستگاه انتخاب‌شده را به service و characteristic وصل می‌کند، payload را chunk می‌کند و وضعیت‌های requesting-permission، discovering، connecting، ready، printing، completed و failed را به رابط کاربری برمی‌گرداند. روی web عمداً تلاش BLE انجام نمی‌شود.

برای providerها، `messages.sendDailySummary` داده‌های فروش، خرید، طلب مشتریان و movementهای انبار را از سرور می‌خواند و گزارش روزانه را به Telegram Bot API یا WhatsApp Cloud API می‌فرستد. هر ارسال با وضعیت `PENDING` شروع می‌شود و سپس با provider message id در `messageLogs` به `SENT` یا با خطای واقعی به `FAILED` تغییر می‌کند. secretها فقط روی سرور هستند؛ در صورت نبود token، پیام `telegram_not_configured` یا `whatsapp_not_configured` برمی‌گردد و موفقیت جعلی اعلام نمی‌شود.

اعتبارسنجی این فاز: ۵۱ تست موفق و یک تست template در حالت skip، TypeScript، lint، backend build، Expo web export و Expo native config موفق شدند. تست فیزیکی Bluetooth نیازمند ساخت development/native build و اتصال یک چاپگر واقعی است؛ UUID پیش‌فرض FFE0/FFE1 قابل تغییر برای مدل‌های دیگر است. ارسال واقعی provider نیز پس از تنظیم secretهای سرور قابل اجراست.
