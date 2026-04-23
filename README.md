# حسين بيرام

نظام إدارة حجوزات جلسات تصوير أونلاين مبني باستخدام:

- Next.js 16
- Supabase
- Vercel

## الميزات

- صفحة دخول للإدارة عبر PIN فقط
- حفظ الـ PIN كـ hash داخل البيئة
- جلسات آمنة عبر `HttpOnly cookies`
- حماية لوحة التحكم `dashboard`
- CRUD كامل للحجوزات
- بحث وفلترة
- حفظ البيانات داخل Supabase بدل `localStorage`
- معاينة وطباعة ومشاركة الفاتورة
- واجهة عربية محافظة على الهوية البصرية الأصلية

## تشغيل المشروع محلياً

1. انسخ ملف البيئة:

```bash
cp env.example .env.local
```

2. أنشئ hash للـ PIN:

```bash
npm run hash:pin -- 1234
```

3. ضع قيمة الـ hash داخل `ADMIN_PIN_HASH` في `.env.local`.

4. نفّذ ملف [schema.sql](/Users/yoland/Desktop/حسين بيرام /schema.sql) داخل مشروع Supabase.

5. شغّل المشروع:

```bash
npm install
npm run dev
```

## متغيرات البيئة

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PIN_HASH`
- `AUTH_SECRET`

## النشر على Vercel

1. أنشئ مشروعاً جديداً على Vercel أو اربط هذا المشروع الحالي.
2. أضف نفس متغيرات البيئة في إعدادات المشروع على Vercel.
3. نفّذ `schema.sql` في Supabase.
4. انشر المشروع.

## نسخة Android APK

- تم تجهيز المشروع كـ Android wrapper باستخدام Capacitor.
- التطبيق يعتمد على النسخة المنشورة أونلاين من النظام:
  `https://hussein-bairam.vercel.app`
- ملف الـ APK الجاهز للتثبيت يوجد هنا:
  [releases/hussein-bairam-debug.apk](/Users/yoland/Desktop/حسين بيرام /releases/hussein-bairam-debug.apk)

### إعادة بناء الـ APK محلياً

بعد تثبيت JDK وAndroid SDK، نفّذ:

```bash
./scripts/build-android-apk.sh
```

وسيتم إنشاء النسخة القابلة للتثبيت داخل:

```bash
android/app/build/outputs/apk/debug/app-debug.apk
```

## هيكل المشروع

- `src/app` صفحات Next.js وواجهات الـ API
- `src/components` مكونات الواجهة
- `src/lib` طبقة الأعمال: auth, supabase, bookings
- `schema.sql` إنشاء جدول الحجوزات
- `env.example` قالب البيئة
- `scripts/hash-pin.mjs` توليد hash للـ PIN
- `capacitor.config.ts` إعدادات ربط نسخة Android بالموقع المنشور
- `scripts/build-android-apk.sh` سكربت بناء الـ APK
- `android` مشروع Android الأصلي
