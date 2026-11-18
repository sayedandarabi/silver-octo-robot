# معماری اجرایی Fin MaX

این پروژه از چهار لایه جدا استفاده می‌کند: رابط کاربری Expo/React Native، وضعیت و ذخیره‌سازی محلی، قراردادهای backend و موتور محاسبات مالی. رابط کاربری فقط ورودی می‌گیرد و نتیجه محاسبه را نمایش می‌دهد؛ منطق پول، فاکتور، موجودی، انتقال و دفتر دوبل در `lib/finmax-engine.ts` مستقل از زبان و ظاهر نگهداری می‌شود.

داده‌های محلی برای حالت آفلاین در `lib/finmax-storage.ts` با کلیدهای نسخه‌دار ذخیره می‌شوند. هر عملیات پایدار باید در آینده به snapshot نسخه‌دار و سپس به migration دیتابیس سرور متصل شود. قراردادهای ورودی backend در `shared/finmax-contracts.ts` با zod اعتبارسنجی می‌شوند و مقدار پول را به صورت رشته عدد صحیح می‌پذیرند تا Float/Double وارد هسته مالی نشود.

## ترتیب تکمیل لایه‌ها

۱. هسته محاسبات و آزمون واحد: فاکتور، تخفیف، مالیات قابل تنظیم، دریافت جزئی، مانده، انتقال، موجودی، معاش و سند متوازن.

۲. مخزن آفلاین و audit: snapshot، تنظیمات، شناسه یکتا، تاریخ سند/ثبت، backup و migration نسخه‌دار.

۳. عملیات اصلی: فروش چندقلمی، خرید، مشتری، تأمین‌کننده، صندوق/بانک، انبار و گزارش‌های پایه.

۴. سطح پرو: کدینگ حساب‌ها، دفتر روزنامه/کل، تراز آزمایشی، شعب، معاش، دارایی، تولید، پروژه و بودجه.

۵. backend اختیاری: نشست امن، چندکاربره/نقش‌ها، صف همگام‌سازی، تشخیص تعارض، API و خروجی‌های کنترل‌شده.

نرخ مالیات و قواعد حقوقی در کد ثابت نیستند؛ از تنظیمات کسب‌وکار و تأیید حسابدار/مشاور مالیاتی استفاده می‌شود.

## افزوده‌های فاز تجارتی

لایه داده اکنون علاوه بر business/customer/product/warehouse/journal، جدول‌های `productCategories`، `units`، `productBarcodes`، `suppliers`، `branches`، `currencies`، `exchangeRates`، `taxRates`، `invoiceSettings`، `purchases`، `purchaseLines`، `purchaseExpenses`، `businessMembers` و `auditLogs` را دارد. قراردادهای مشترک این عملیات در `shared/finmax-contracts.ts` نگهداری می‌شوند و همه شناسه‌های business-scoped قبل از mutation بررسی می‌شوند.

ثبت خرید پایه داخل transaction انجام می‌شود و هزینه‌های خرید به عنوان `landedCost` جدا نگهداری می‌شوند تا در فاز costing به بهای هر lot تخصیص پیدا کنند. روش پیش‌فرض آینده weighted-average است و FIFO/LIFO فقط پس از اضافه‌شدن lot allocation و تست‌های تطبیقی فعال می‌شود. تنظیمات فاکتور مستقل از UI ذخیره می‌شود تا خروجی PDF، Excel و thermal از یک DTO واحد تولید شود.


## مرزهای فاز costing و POS

جدول‌های `inventoryLots` و `inventoryMovements` منبع حقیقت موجودی هستند؛ `inventoryLots` مقدار باقی‌مانده، batch، expiry، ارز و unit cost را نگه می‌دارد و engine مستقل در `lib/finmax-modules-engine.ts` آن‌ها را با AVERAGE/FIFO/LIFO مصرف می‌کند. در ثبت POSTED خرید، lot و کاردکس ورودی با هزینه landed تخصیص‌یافته ساخته می‌شوند.

جدول‌های `sales`، `saleLines` و `salePayments` سند POS را نگه می‌دارند. procedure فروش قبل از commit، lotهای کافی را می‌خواند، بهای کالای فروش‌رفته را محاسبه می‌کند و سپس در یک transaction خروجی کاردکس، پرداخت، طلب مشتری، کاهش lot و پنج خط دفتر روزنامه را ثبت می‌کند: نقد، طلب، درآمد، COGS و موجودی. اگر lot کافی نباشد transaction اصلاً commit نمی‌شود.

`installmentPlans`/`installments` سررسید را از خود فاکتور جدا می‌کنند؛ `checks` گردش چک و وضعیت وصول را نگه می‌دارد؛ `partners`/`partnerTransactions` سرمایه، برداشت و سهم مفاد را ثبت می‌کنند. صفحه `/finance` فقط از procedureهای protected استفاده می‌کند و در نبود نشست، بدون جعل داده سرور، حالت خالی و پیام راهنما نشان می‌دهد.

اسکن دوربین و چاپ رسید adapterهای لایه رابط هستند؛ printer واقعی، تلگرام/واتس‌اپ و بک‌آپ زمان‌بندی‌شده باید بعداً با credential و مجوز دستگاه به همین DTOها وصل شوند، نه با درج منطق provider داخل engine حسابداری.


## مرزهای فاز سوم

`recipes` و `recipeLines` فرمول محصول را نگه می‌دارند و `productionOrders`، `productionConsumptions` و `productionOutputs` تولید را به صورت batch ثبت می‌کنند. procedure تولید در یک transaction، مواد اولیه را با روش تعیین‌شده از lotها مصرف می‌کند، مقدار باقی‌مانده lotها را کم می‌کند، lot محصول نهایی را می‌سازد و سند دوبل تولید را ثبت می‌کند. هزینه تولید از همان موتور bigint محاسبه می‌شود.

گزارش‌ها در `lib/finmax-phase3-engine.ts` از DTO واحد به PDF و XLSX تبدیل می‌شوند. صفحه `/phase3` این خروجی‌ها را از tRPC می‌گیرد و در وب download و در موبایل share می‌کند. adapter چاپ حرارتی فعلاً contract مشترک رسید و fallback چاپ را حفظ می‌کند؛ اتصال Bluetooth/ESC-POS به permission و device discovery نیتیو نیاز دارد و نباید در web شبیه‌سازی شود.

ارسال Telegram و WhatsApp فقط از سرور و با environment secret انجام می‌شود (`TELEGRAM_BOT_TOKEN`، `WHATSAPP_ACCESS_TOKEN` و `WHATSAPP_PHONE_NUMBER_ID`) و هر تلاش در `messageLogs` ثبت می‌شود. رمزها هرگز وارد bundle موبایل نمی‌شوند. بک‌آپ با AES-256-GCM و PBKDF2-SHA256 ساخته می‌شود؛ callback توکن‌دار `/api/scheduled/backup` برای اجرای خودکار آماده است و پس از publish باید با ScheduleTask و secretهای `FINMAX_SCHEDULE_TOKEN` و `FINMAX_BACKUP_PASSWORD` فعال شود. چک‌کردن نسخه از `updateManifests` انجام می‌شود و نصب binary ناشناخته عمداً خودکار نیست.


## مرز فاز چاپ و تحویل provider

رسید POS اکنون از `lib/receipt.ts` و یک `ReceiptDocument` مشترک می‌آید. وب از `window.print` و موبایل از Expo Print استفاده می‌کند. در native، `lib/thermal-printer.ts` با `react-native-ble-plx` اجازه Bluetooth را می‌گیرد، دستگاه‌ها را scan می‌کند، به service/characteristic انتخابی وصل می‌شود، payload قطعه‌قطعه ESC/POS می‌فرستد و وضعیت‌های discovery/connection/printing/failure را گزارش می‌کند. UUID پیش‌فرض برای پرینترهای رایج FFE0/FFE1 است و برای مدل‌هایی که UUID متفاوت دارند باید از تنظیمات دستگاه استفاده شود.

`messages.sendDailySummary` فروش، خرید، طلب ثبت‌شده و تغییرات انبار را از دیتابیس می‌خواند، متن گزارش روزانه را از سرور می‌سازد و آن را به adapterهای جداگانه Telegram Bot API و WhatsApp Cloud API می‌دهد. نتیجه هر تلاش در `messageLogs` با provider message id یا خطای provider ذخیره می‌شود. Tokenها فقط در environment سرور هستند و اگر تنظیم نشده باشند، procedure شکست واقعی `*_not_configured` می‌دهد و موفقیت جعلی ثبت نمی‌کند.
