# 🏢 CRM Exhibitions - Backend API

نظام إدارة زيارات المندوبين لشركة تنظيم المعارض

---

## ⚙️ المتطلبات

- Node.js 18+
- MongoDB 6+ (محلي أو Atlas)
- npm أو yarn

---

## 🚀 التشغيل

### 1. تثبيت الحزم
```bash
npm install
```

### 2. إعداد متغيرات البيئة
```bash
# ملف .env موجود مسبقاً، عدّل القيم حسب بيئتك
MONGODB_URI=mongodb://localhost:27017/crm_exhibitions
JWT_SECRET=crm_exhibitions_super_secret_key_2024
JWT_EXPIRES_IN=7d
PORT=3000
```

### 3. إنشاء البيانات الأولية (مستخدمين افتراضيين)
```bash
npx ts-node src/seed.ts
```

### 4. تشغيل السيرفر
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

---

## 🔐 بيانات الدخول الافتراضية

| الدور | البريد | كلمة المرور |
|-------|--------|-------------|
| 👑 مدير | admin@exhibitions.com | Admin@123 |
| 👤 مندوب | ahmed@exhibitions.com | Agent@123 |
| 👤 مندوب | sara@exhibitions.com | Agent@123 |
| 👤 مندوب | mohammed@exhibitions.com | Agent@123 |

---

## 📚 Swagger API Docs

بعد التشغيل:
```
http://localhost:3000/docs
```

---

## 🗂️ هيكل الـ API

### Auth `/api/v1/auth`
| Method | Endpoint | الوصف |
|--------|----------|-------|
| POST | `/auth/register` | تسجيل مندوب جديد |
| POST | `/auth/login` | تسجيل الدخول |
| GET | `/auth/me` | بيانات المستخدم الحالي |

---

### Visits `/api/v1/visits`
| Method | Endpoint | الوصف | الصلاحية |
|--------|----------|-------|---------|
| POST | `/visits` | إضافة زيارة | agent + admin |
| GET | `/visits/my` | زياراتي | agent |
| GET | `/visits/my/stats` | إحصائياتي | agent |
| GET | `/visits/my/export` | تصدير زياراتي Excel | agent |
| GET | `/visits/all` | جميع الزيارات | admin |
| GET | `/visits/all/export` | تصدير جميع الزيارات | admin |
| GET | `/visits/:id` | تفاصيل زيارة | agent + admin |

**Query Parameters للفلترة:**
- `period` = `today` | `week` | `all`
- `status` = `interested` | `follow_up` | `not_interested`
- `city` = اسم المدينة

---

### Reports `/api/v1/reports`
| Method | Endpoint | الوصف | الصلاحية |
|--------|----------|-------|---------|
| POST | `/reports/generate` | إنشاء تقرير يومي (Smart) | agent |
| POST | `/reports/:id/send` | إرسال التقرير للمدير | agent |
| GET | `/reports/my` | تقاريري | agent |
| GET | `/reports/admin/all` | جميع التقارير المرسلة | admin |
| GET | `/reports/:id` | تفاصيل تقرير | agent + admin |

---

### Dashboard `/api/v1/dashboard`
| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/dashboard` | لوحة التحكم الكاملة |
| GET | `/dashboard/stats` | الإحصائيات العامة |
| GET | `/dashboard/agents` | أداء المندوبين |
| GET | `/dashboard/recent-visits` | آخر الزيارات |
| GET | `/dashboard/cities` | تحليل المدن |
| GET | `/dashboard/business-types` | تحليل أنواع الأعمال |
| GET | `/dashboard/trend` | تطور الزيارات اليومي |

---

### Users `/api/v1/users`
| Method | Endpoint | الوصف | الصلاحية |
|--------|----------|-------|---------|
| GET | `/users` | قائمة المندوبين | admin |
| GET | `/users/:id` | بيانات مندوب | admin |
| PATCH | `/users/:id` | تعديل بيانات مندوب | admin |
| DELETE | `/users/:id` | تعطيل حساب | admin |
| PATCH | `/users/me/password` | تغيير كلمة المرور | agent + admin |

---

## 📊 نماذج البيانات

### إضافة زيارة (POST /visits)
```json
{
  "companyName": "شركة النور للتجارة",
  "contactPerson": "محمد عبدالله",
  "phone": "0501234567",
  "city": "الرياض",
  "businessType": "مواد بناء",
  "summary": "أبدى المدير اهتماماً بالمشاركة في معرض البناء القادم",
  "status": "interested",
  "visitDate": "2024-01-15",
  "visitTime": "10:30"
}
```

### حالات الزيارة (status)
- `interested` ← مهتم ✅
- `follow_up` ← متابعة لاحقاً 🔄
- `not_interested` ← غير مهتم ❌

### إنشاء تقرير يومي (POST /reports/generate)
```json
{
  "reportDate": "2024-01-15",
  "notes": "يوم جيد، تمت زيارة المنطقة الصناعية بالكامل"
}
```

---

## 🗄️ قاعدة البيانات

### Collections
- **users** - المندوبين والمديرين
- **visits** - الزيارات
- **reports** - التقارير اليومية

### Indexes (للأداء)
```
visits: { agent, visitDate } | { status } | { city } | { visitDate }
reports: { agent, reportDate }
```

---

## 🏗️ هيكل المشروع

```
src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── auth.dto.ts
│   └── jwt.strategy.ts
├── users/
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.module.ts
│   └── user.schema.ts
├── visits/
│   ├── visits.controller.ts
│   ├── visits.service.ts
│   ├── visits.module.ts
│   ├── visit.schema.ts
│   └── visit.dto.ts
├── reports/
│   ├── reports.controller.ts
│   ├── reports.service.ts
│   ├── reports.module.ts
│   ├── report.schema.ts
│   └── report.dto.ts
├── dashboard/
│   ├── dashboard.controller.ts
│   ├── dashboard.service.ts
│   └── dashboard.module.ts
├── export/
│   ├── export.service.ts
│   └── export.module.ts
├── common/
│   ├── guards/roles.guard.ts
│   ├── decorators/current-user.decorator.ts
│   └── filters/global-exception.filter.ts
├── app.module.ts
├── main.ts
└── seed.ts
```

---

## 🔧 للـ Flutter App

الـ Base URL:
```
http://YOUR_SERVER:3000/api/v1
```

Headers لكل request محتاج token:
```
Authorization: Bearer <token>
Content-Type: application/json
```
