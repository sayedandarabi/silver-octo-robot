# گزارش migration نام پروژه: Fin MaX

## هدف

نام محصول از نام قبلی به **Fin MaX** تغییر داده شد. این migration فقط تغییر متن UI نیست؛ مسیر فایل‌ها، module/importها، namespace قرارداد tRPC، package identity، bundle identifier، storage namespace، secretهای زمان‌بندی‌شده، route manifest، گزارش‌ها، تست‌ها و مستندات نیز یکپارچه‌سازی شده‌اند.

## سطوح تغییر یافته

| سطح | مقدار نهایی |
| --- | --- |
| نام نمایشی | `Fin MaX` |
| package name | `finmax` |
| Expo slug | `finmax` |
| Android/iOS bundle ID | `space.manus.finmax.t173474036053484` |
| tRPC root namespace | `finmax` |
| نام router اصلی | `finmaxRouter` |
| مسیر کامپوننت‌ها | `components/finmax/` |
| مسیر موتورهای مالی | `lib/finmax-*.ts` |
| مسیر router و DB server | `server/finmax*.ts` |
| قرارداد مشترک | `shared/finmax-contracts.ts` |
| نام تست‌ها | `tests/finmax-*.test.ts` |
| storage keys | `finmax.settings.v1`, `finmax.snapshot.v1` |
| scheduled backup header | `x-finmax-schedule-token` |
| server secrets | `FINMAX_SCHEDULE_TOKEN`, `FINMAX_BACKUP_PASSWORD` |
| route manifest root title | `Fin MaX` |

## ساختار نهایی فایل‌ها

کدهای feature و داده اکنون در `components/finmax/`، `lib/finmax-*.ts`، `server/finmax*.ts`، `shared/finmax-contracts.ts` و `tests/finmax-*.test.ts` قرار دارند. سند معماری نیز `docs/FinMaX-architecture.md` است و dashboard در `components/finmax/finmax-dashboard.tsx` نگهداری می‌شود.

## تصمیم سازگاری داده

نام‌های جدید storage با نسخه مستقل ثبت شدند تا build جدید namespace قدیمی را بازتولید نکند و داده‌های جدید کاملاً به Fin MaX تعلق داشته باشند. مقدار پیش‌فرض کسب‌وکار، رسید و onboarding نیز `Fin MaX` است. داده‌های business که کاربر قبلاً خودش در database ذخیره کرده، عمداً overwrite نمی‌شوند؛ این داده کسب‌وکار است، نه نام فنی محصول.

## بررسی نام قدیمی

پس از migration یک scan case-insensitive روی source، app، components، lib، server، shared، tests، docs، plan، public و configuration انجام شد و هیچ referenceای از نام قدیمی، package قدیمی، namespace قدیمی یا secret قدیمی باقی نماند. build output و cacheهای تولیدی نیز قبل از خروجی نهایی پاک و بازسازی می‌شوند.

## domain و URL انتشار

نام دامنه‌ای که از پروژه Manus می‌آید platform-assigned است و در `app.config.ts`، repository یا route manifest نگهداری نمی‌شود. ابزار پیکربندی متصل به این task فقط configuration/runtime/publish را مدیریت می‌کند و عملیات rename برای hostname platform-assigned یا ثبت DNS سفارشی در این session در دسترس نیست. بنابراین:

1. تمام identityهای داخل کد و native app به `Fin MaX` تغییر کرده‌اند.
2. route manifest و metadata نام جدید را اعلام می‌کنند.
3. hostname فعلی پلتفرم تا انجام عملیات custom-domain/hostname در Dashboard تغییر نمی‌کند.

این محدودیت platform است و خطای source یا build نیست.
