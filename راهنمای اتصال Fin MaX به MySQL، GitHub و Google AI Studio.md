# راهنمای اتصال Fin MaX به MySQL، GitHub و Google AI Studio

این راهنما بر اساس فایل‌های واقعی پروژه بررسی شده است: `docs/FinMaX-architecture.md`، `docs/FinMaX-implementation-guide.md`، `drizzle/schema.ts`، `drizzle.config.ts`، migrationهای `drizzle/0000` تا `drizzle/0005`، `server/db.ts` و `package.json`.

## ۱. درک معماری قبل از انتقال

Fin MaX چهار لایه دارد. رابط کاربری Expo/React Native در `app/` و `components/finmax/` قرار دارد. ذخیره‌سازی محلی و حالت آفلاین در `lib/finmax-storage.ts` و seedهای typed در `lib/finmax-data.ts` و `lib/finmax-modules.ts` نگهداری می‌شوند. موتور مالی مستقل در `lib/finmax-engine.ts` و engineهای ماژولار و فاز سوم قرار دارد و برای مبالغ حساس از `bigint` استفاده می‌کند. قراردادهای مشترک و validation در `shared/finmax-contracts.ts` هستند. سرور tRPC/Express در `server/` و database schema و migrationها در `drizzle/` قرار دارند.

Backend با namespace `trpc.finmax.*` کار می‌کند. هر mutation مهم باید `businessId` را بررسی کند، در transaction اتمیک اجرا شود و داده‌های پولی را به‌صورت رشته عدد صحیح بین API و database منتقل کند. MySQL منبع حقیقت online است؛ در نبود نشست یا backend، UI از حالت محلی و seed/snapshot استفاده می‌کند و نباید موفقیت جعلی برای server write نشان دهد.

## ۲. ساخت مخزن GitHub انتقالی

بهترین مسیر انتقال، یک مخزن خصوصی و مخصوص Google AI Studio است. مخزن production را مستقیماً در اختیار AI Studio نگذارید تا تغییرات خودکار آن روی تاریخچه اصلی اثر نگذارد.

بسته انتقال را دانلود و extract کنید. در ریشه‌ای بمانید که `package.json` و `pnpm-lock.yaml` در آن هستند:

```bash
unzip FinMaX-Google-AI-Studio-transfer.zip -d finmax
cd finmax
```

اگر GitHub CLI دارید:

```bash
gh repo create <YOUR_GITHUB_OWNER>/finmax-ai-studio --private --source=. --remote=origin

git add .
git commit -m "Import Fin MaX for Google AI Studio"
git branch -M main
git push -u origin main
```

اگر GitHub CLI ندارید، در GitHub یک repository خصوصی خالی بسازید و سپس اجرا کنید:

```bash
git init
git add .
git commit -m "Import Fin MaX for Google AI Studio"
git branch -M main
git remote add origin https://github.com/<OWNER>/finmax-ai-studio.git
git push -u origin main
```

قبل از `git add` مطمئن شوید که `.env` واقعی در پوشه نیست. فقط `.env.example` باید در مخزن باشد. این بسته Git history قبلی، `node_modules`، cache و secret واقعی را عمداً ندارد.

### عیب‌یابی GitHub و Google AI Studio

اگر گزینه `Import from GitHub` دیده نمی‌شود، مطمئن شوید در Build Mode هستید، با همان حسابی که به repository دسترسی دارد وارد شده‌اید و repository خصوصی از سمت GitHub برای حساب مقصد قابل مشاهده است. در صورت نیاز اتصال GitHub را از Settings دوباره authorize کنید؛ repository را public نکنید فقط برای حل این خطا.

اگر import روی نسخه قدیمی می‌ماند، ابتدا در GitHub بررسی کنید که commit مورد نظر روی branch پیش‌فرض `main` push شده باشد. در AI Studio از Settings → GitHub وضعیت `Remote Changes Ready` را بررسی و `Pull Changes` را اجرا کنید. یک repository انتقالی جدا نگه دارید تا force push احتمالی AI Studio روی production اثر نگذارد.

اگر وضعیت `Both Changed` یا conflict دیده می‌شود، قبل از هر merge یک branch پشتیبان بسازید، diff را بررسی کنید، تغییرات AI Studio را فقط در فایل‌های مورد انتظار نگه دارید و سپس merge را روی GitHub انجام دهید. force push را فقط روی repository خصوصی انتقالی و بعد از داشتن backup انجام دهید.

اگر نصب dependency یا preview شکست خورد، root پروژه را بررسی کنید؛ `package.json` و `pnpm-lock.yaml` باید در همان سطح باشند. سپس `corepack enable && pnpm install --frozen-lockfile` را اجرا کنید. حذف `pnpm-lock.yaml` یا اجرای upgrade عمومی dependencyها راه‌حل اولیه نیست، چون reproducibility را از بین می‌برد.

اگر web preview به API وصل نمی‌شود، `EXPO_PUBLIC_API_BASE_URL` را از `localhost` به origin قابل دسترس همان runtime تغییر دهید، backend را روی port 3000 بالا بیاورید و CORS/redirect URL را بررسی کنید. `DATABASE_URL` و secretهای server را به `EXPO_PUBLIC_*` تبدیل نکنید.

## ۳. Import در Google AI Studio

در Google AI Studio وارد Build Mode شوید. طبق مستند رسمی، از دکمه `+` در پایین کادر prompt گزینه `Import from GitHub` را انتخاب کنید. repository خصوصی `finmax-ai-studio` را انتخاب کنید یا URL آن را وارد کنید، سپس `Import repository` را بزنید. AI Studio پروژه را تحلیل می‌کند و آن را به‌عنوان app وارد می‌کند. [1]

پس از import، در Code view بررسی کنید که این مسیرها در ریشه وجود داشته باشند: `package.json`، `pnpm-lock.yaml`، `app.config.ts`، `server/_core/index.ts`، `drizzle/schema.ts` و `drizzle/0000_elite_eternals.sql` تا `drizzle/0005_narrow_bullseye.sql`.

سپس از Settings و بخش GitHub گزینه Sync را فعال کنید. AI Studio از sync دوطرفه با GitHub پشتیبانی می‌کند. پیش از اولین push از AI Studio یک branch یا snapshot جدا نگه دارید. اگر AI Studio تغییرات سازگارسازی تولید کرد و درخواست force push داد، آن را فقط روی repository انتقالی خصوصی و پس از بررسی diff انجام دهید؛ روی repository production بدون بازبینی force push نکنید. [2]

فایل `transfer/AI-STUDIO-IMPORT-PROMPT.md` در بسته، prompt آماده‌ای دارد که باید به‌عنوان اولین پیام Build Mode استفاده شود. این prompt از حذف native module، جعل موفقیت backend و بازنویسی پروژه به starter جلوگیری می‌کند.

## ۴. ساخت MySQL برای Fin MaX

یک MySQL سازگار با MySQL 8 یا سرویس مدیریت‌شده مشابه بسازید. یک database و user اختصاصی برای Fin MaX ایجاد کنید و دسترسی migration را به همان database محدود کنید. نام database می‌تواند `finmax` باشد.

نمونه SQL برای محیطی که دسترسی administrative دارد:

```sql
CREATE DATABASE finmax CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'finmax_app'@'%' IDENTIFIED BY 'CHANGE_THIS_STRONG_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
  ON finmax.* TO 'finmax_app'@'%';
FLUSH PRIVILEGES;
```

برای سرویس‌های ابری ممکن است user و database از قبل ساخته شوند. در آن حالت فقط connection string واقعی provider را بگیرید. اگر password یا پارامترهای SSL شامل کاراکتر ویژه است، آن را در URL encode کنید.

در بخش Secrets سمت server مقدار زیر را ثبت کنید؛ آن را در کد client یا `EXPO_PUBLIC_*` قرار ندهید:

```env
DATABASE_URL=mysql://finmax_app:ENCODED_PASSWORD@HOST:3306/finmax?ssl={"rejectUnauthorized":true}
```

قالب دقیق provider ممکن است متفاوت باشد. `DATABASE_URL` تنها ورودی database در `drizzle.config.ts` و `server/db.ts` است. اتصال database lazy ساخته می‌شود و بدون آن تست‌های engine محلی می‌توانند اجرا شوند، اما persistence واقعی server فعال نخواهد شد.

## ۵. اعمال migrationهای موجود

فایل `drizzle.config.ts` schema را از `./drizzle/schema.ts` می‌خواند، dialect آن `mysql` است و migration output در `./drizzle` قرار دارد. migration chain فعلی از `0000` تا `0005` و metadataهای `drizzle/meta/` تشکیل شده است.

ابتدا dependencyها را با lockfile نصب کنید:

```bash
corepack enable
pnpm install --frozen-lockfile
```

سپس در یک shell خصوصی متغیرها را load کنید. این روش باعث می‌شود ابزار Drizzle حتماً `DATABASE_URL` را ببیند:

```bash
set -a
source .env
set +a
```

برای اعمال migrationهای commit‌شده روی database خالی، اول از migrate موجود استفاده کنید:

```bash
pnpm exec drizzle-kit migrate
```

این دستور migrationهای SQL موجود را به ترتیب اعمال می‌کند و جدول migration history را به‌روزرسانی می‌کند. برای مشاهده وضعیت schema و اختلاف احتمالی:

```bash
pnpm exec drizzle-kit check
```

اسکریپت موجود پروژه این است:

```bash
pnpm db:push
```

اما چون این script ابتدا `drizzle-kit generate` و سپس `migrate` را اجرا می‌کند، برای database انتقالی که باید دقیقاً از migrationهای commit‌شده استفاده کند، `pnpm exec drizzle-kit migrate` انتخاب محافظه‌کارانه‌تری است. اگر schema را عمداً تغییر دادید، آن‌گاه `pnpm db:push` را اجرا کنید، migration جدید تولیدشده را review کنید، تست بگیرید و آن migration را به GitHub commit کنید.

## ۵.۱ اجرای seed data و تست نهایی database

بعد از migration، seed دمو را با transaction و به‌صورت idempotent اجرا کنید. این seed داده‌های `demo-business`، branch، warehouse، سه product، دو customer، گردش موجودی، chart of accounts، ledger و دو سند journal را می‌سازد یا به‌روزرسانی می‌کند:

```bash
set -a
source .env
set +a
pnpm db:seed
pnpm db:smoke -- --require-seed
```

اگر `OWNER_OPEN_ID` تنظیم نشده باشد، seed از `seed-owner` استفاده می‌کند. برای اینکه کاربر OAuth فعلی owner همین business باشد، قبل از seed مقدار واقعی `OWNER_OPEN_ID` را در محیط server تنظیم کنید. شناسه business را با `FINMAX_SEED_BUSINESS_ID` قابل تغییر نگه داشته‌ایم.

تست smoke بدون الزام وجود seed فقط اتصال و جدول‌ها را بررسی می‌کند:

```bash
pnpm db:smoke
```

این تست باید `SELECT 1`، وجود جدول‌های `users`، `businesses`، `customers`، `products`، `warehouses`، `inventoryMovements`، `chartAccounts`، `journalEntries`، `journalLines`، `customerLedger`، `auditLogs`، `messageLogs` و `backupRuns` و تعداد داده‌های seed را گزارش کند. هیچ password یا `DATABASE_URL` را در خروجی چاپ نمی‌کند.

برای اجرای خودکار کل فرآیند از کپی امن `.env.example` شروع کنید:

```bash
pnpm deploy:finmax -- --init-env
# .env را تکمیل کنید، سپس:
pnpm deploy:finmax -- --seed
```

اسکریپت `scripts/deploy-finmax.sh` از overwrite کردن `.env` جلوگیری می‌کند، `pnpm install --frozen-lockfile` را اجرا می‌کند، migrationهای موجود را اعمال می‌کند، smoke test، check، lint، test و build را اجرا می‌کند و فقط در صورت افزودن `--start` سرور production را start می‌کند. برای CI بدون seed می‌توان از `--skip-db` یا `--skip-tests` استفاده کرد، اما برای release تجارتی این گزینه‌ها توصیه نمی‌شوند.

پس از migration، ساختار اصلی شامل `users`، `businesses`، chart of accounts، customer ledger، محصولات و warehouse، inventory lots و movements، purchases، sales و payments، installmentها، checks، partners، recipes و production orders، currencies و exchange rates، audit logs، backup runs و message logs است. جزئیات کامل در `drizzle/schema.ts` و SQLهای migration قرار دارد.

## ۶. ثبت secrets مورد نیاز

فایل `.env.example` همه نام‌ها را دارد. در Google AI Studio آن‌ها را در Secrets/server environment ثبت کنید، نه در source code و نه در متغیرهای public موبایل.

برای persistence و login معمولاً این‌ها لازم هستند:

```env
DATABASE_URL=...
MANUS_PROJECT_ID=...
MANUS_OAUTH_API_URL=...
MANUS_JWT_SECRET=...
OWNER_OPEN_ID=...
```

برای اجرای web preview خارج از Manus، API عمومی Expo باید به آدرس قابل دسترس backend اشاره کند:

```env
EXPO_PUBLIC_API_BASE_URL=https://<reachable-server-origin>
EXPO_PUBLIC_APP_ID=...
EXPO_PUBLIC_OAUTH_PORTAL_URL=https://manus.im
EXPO_PUBLIC_OAUTH_SERVER_URL=https://api.manus.ai
```

برای قابلیت‌های اختیاری server-side:

```env
TELEGRAM_BOT_TOKEN=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
FINMAX_SCHEDULE_TOKEN=...
FINMAX_BACKUP_PASSWORD=...
```

`FINMAX_BACKUP_PASSWORD`، JWT secret، database URL و provider tokenها نباید prefix `EXPO_PUBLIC_` داشته باشند. `TELEGRAM` و `WhatsApp` فقط از server adapterها استفاده می‌کنند و خطای `*_not_configured` را باید به‌عنوان configuration error واقعی نگه داشت.

## ۷. اجرای backend و preview

بعد از ثبت secrets و اعمال migration:

```bash
pnpm check
pnpm lint
pnpm test
pnpm build
NODE_ENV=production pnpm start
```

برای توسعه هم‌زمان server و Expo web:

```bash
pnpm dev
```

یا جداگانه:

```bash
pnpm dev:server
pnpm dev:metro
```

`dev:server` روی port `3000` و `dev:metro` روی port `8081` تنظیم شده است. در preview، `EXPO_PUBLIC_API_BASE_URL` باید به originای اشاره کند که از محیط preview قابل دسترس باشد؛ `localhost` فقط زمانی درست است که client و server در همان runtime اجرا شوند.

بعد از اجرا، routeهای اصلی را بررسی کنید: `/`، `/login`، `/onboarding`، `/customers`، `/inventory`، `/accounting`، `/pos`، `/finance`، `/phase3` و `/setup`.

## ۸. تست صحت اتصال database و API

از خود MySQL ابتدا connectivity را بررسی کنید:

```bash
mysql --protocol=TCP -h HOST -u finmax_app -p -e 'SELECT 1;'
```

سپس تست‌های پروژه را اجرا کنید:

```bash
pnpm check
pnpm test
pnpm build
npx expo config --type public
npx expo export --clear --platform web
```

تست‌های فعلی ۵۱ assertion موفق دارند و روی engine پول، inventory، ledger مشتری، trial balance، profit/loss، FIFO/LIFO، تولید، backup، provider contracts، CORS و router اجرا می‌شوند. تست `auth.logout` در محیط فعلی به‌صورت template skip شده است و برای end-to-end به session fixture نیاز دارد.

برای acceptance دستی، از `transfer/sample-data/seed-fixtures.json` استفاده کنید. انتظارهای اصلی عبارت‌اند از: تراز journal برقرار باشد، مانده مشتری اول `24500 AFN` باشد، موجودی برنج `8` باشد و کمبود آن به‌عنوان هشدار دیده شود.

## ۹. محدودیت native و Bluetooth

Google AI Studio می‌تواند web app و server Node را preview کند، اما Fin MaX از `react-native-ble-plx` استفاده می‌کند. BLE printer، camera permission و development build اندروید در browser preview معادل واقعی ندارند. برای تست thermal printer باید بعد از انتقال source، با Expo development build روی Android واقعی اجرا کنید و discovery، connection، printing و fallback را بررسی کنید. این limitation دیتابیس یا migration نیست.

## ۱۰. جمع‌بندی بررسی مستندات پروژه

معماری پروژه تفکیک مناسبی بین UI، offline storage، financial engine، shared contracts، API و database دارد. `drizzle/schema.ts` منبع declarative schema است؛ SQLهای `drizzle/0000` تا `0005` و metadata، تاریخچه migration را تشکیل می‌دهند؛ `server/db.ts` اتصال lazy به MySQL را ایجاد می‌کند؛ و `package.json` فرمان‌های install، test، build و migration را مشخص می‌کند. برای انتقال قابل تکرار، repository خصوصی GitHub، lockfile، migrationهای commit‌شده، `.env.example` و Secrets سمت server باید هم‌زمان حفظ شوند.

## References

[1]: https://ai.google.dev/gemini-api/docs/aistudio-build-mode "Google AI Studio Build apps documentation"
[2]: https://aistudio.google.com/learn/sync-your-ai-studio-apps-with-github "Google AI Studio GitHub sync documentation"
