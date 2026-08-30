# التقرير

## البلاغ 2291 — إقامة ست ليالٍ تُحتسب سبعًا

**إعادة إنتاج المشكلة**

1. شغّل الخدمة (`npm start` أو `docker compose up`).
2. أرسل:

```http
POST /quotes
{ "roomTypeId": "DLX", "checkIn": "2026-08-28", "checkOut": "2026-09-03" }
```

3. قبل الإصلاح: `nights.length === 7` و`total` أعلى من المتوقع (السجل `incident-2291.log`: `segments=2 nights=7 roomTotal=162000`).
4. folio الحجز RES-10842 يحتوي 7 رسوم غرف + ضريبة + رسم = 9 أسطر.

**أصغر input:** `POST /quotes` بـ `DLX`, `checkIn=2026-09-01`, `checkOut=2026-09-02` — ليلة واحدة متوقعة، النظام يُرجع ليلتين (1 سبتمبر في HIGH **و** FESTIVAL).

**السبب الجذري**

`resolveNightlyRates()` في `pricingService.js` كان يقسّم الإقامة إلى segments حسب الموسم باستخدام:

```js
segmentEnd = minDate(lastNight, season.end_date);
for (let date = segmentStart; date <= segmentEnd; ...)
```

SPEC §3 و`schema.sql` يحدّدان `end_date` **حصريًا** (`[start_date, end_date)`). الكود كان يعامل `season.end_date` كآخر ليلة **مشمولة** في الحلقة. عند عبور حد موسم (HIGH ينتهي `2026-09-01`، FESTIVAL يبدأ `2026-09-01`)، تُسعَّر **1 سبتمبر في موسمين** → ليلة زائدة.

`enumerateNights()` في `dates.js` كان يطبّق `[checkIn, checkOut)` بشكل صحيح، لكن مسار التسعير لم يكن يستخدمه — **تناقض داخلي** بين forecast (يستخدم `enumerateNights`) والتسعير.

**لماذا لا يكفي الإصلاح الواضح**

الإصلاح السطحي «اطرح يومًا من `segmentEnd`» أو «غيّر `<=` إلى `<` في الحلقة فقط»:

- يعالج عرضًا واحدًا دون توحيد نموذج الفترة مع SPEC وباقي النظام.
- يبقى معرضًا لأخطاء عند تقاطع `lastNight` مع `end_date` في اتجاهات مختلفة (بداية موسم، نهاية موسم، إقامة داخل موسم واحد).
- لا يمنع تكرار ليلة عند `checkIn === season.end_date` (ليلة 1 سبتمber تُسعَّر في HIGH رغم أنها FESTIVAL).
- لا يغطي SPEC §3 لرفض الليالي بلا تعرفة — كان النظام يتخطى الليالي بلا موسم (`if (!season) return []`) ويُرجع 200 بquote جزئي (اكتُشف لاحقًا في 89 صفًا إضافيًا من verify).

**ما تأثّر أيضًا بالسبب نفسه**

| المسار | التأثير |
|---|---|
| `POST /quotes`, `GET /rates/preview` | عدد ليالي وأسعار خاطئة |
| `availabilityService.search()` | `quotedTotalCents` خاطئ (العدد صحيح) |
| `reservationService.create()` / `changeDates()` | folio بأسطر زائدة |
| `cancellationService.cancel()` | غرامة FLEX «الليلة الأولى» من `quote().nights[0]` — قد تكون من موسم/تاريخ خاطئ عند حدود الموسم |

**التحصين**

- إضافة `dateInRange(date, start, end)` في `dates.js` — `[start, end)` موحّد.
- إعادة بناء `resolveNightlyRates()` على `enumerateNights(checkIn, checkOut)` + `dateInRange()` لكل ليلة — مصدر واحد للحقيقة.
- تصحيح `rateRepo.findSeasons()` إلى `start_date < to AND end_date > from`.
- إضافة `assertPricable()` — يرفض الإقامة إذا أي ليلة بلا تعرفة (`422 UNPRICED_NIGHTS`) بدل quote صامت جزئي (SPEC §3).

**ما تُرك دون تغيير (ولماذا)**

- `enumerateNights()` — كانت صحيحة؛ المرجع الذي بُني عليه الإصلاح.
- `seed-data.js` / تقويم التعرفة — الفجوات (مثل `2026-12-20..2026-12-27`) مقصودة؛ SPEC §3 يفرض **الرفض** لا اختراع سعر.
- `/housekeeping/forecast` — كان يستخدم `enumerateNights()` أصلًا؛ لا حاجة لتعديل.

---

## البلاغ 2304 — الغرفة غير متاحة في يوم التبديل

**إعادة إنتاج المشكلة**

**العرض أ — turnover (0 متاح في يوم المغادرة):**

1. مع seed الافتراضي (RES-10999: STD، `2026-11-08..2026-11-10`).
2. `GET /availability?roomTypeId=STD&checkIn=2026-11-10&checkOut=2026-11-12`
3. قبل الإصلاح: `available=0` (`booked=6` من 6 غرف — السجل `incident-2304.log`).
4. `checkIn=2026-11-11` → `available=4` (يؤكد أن المشكلة في يوم التبديل فقط).
5. `POST /reservations` لنفس التواريخ → `409 NO_ROOMS_AVAILABLE`.

**العرض ب — فشل تمديد RES-11150:**

1. `PATCH /reservations/RES-11150` `{ "checkIn": "2026-12-02", "checkOut": "2026-12-07" }`
2. قبل الإصلاح: `409 NO_ROOMS_AVAILABLE` (السجل يؤكد).
3. SUI = غرفتان؛ RES-11151 + **RES-11150 نفسه** = `booked=2`.

**أصغر input:**

- عرض أ: `GET /availability?roomTypeId=STD&checkIn=2026-11-10&checkOut=2026-11-12`
- عرض ب: `PATCH /reservations/RES-11150` → `checkOut=2026-12-07`

**السبب الجذري**

**سببان مستقلان** لكنهما ينبعان من عدم تطبيق `[checkIn, checkOut)` في عدّ الإشغال:

**1) تداخل وهمي في يوم التبديل** — `availabilityRepo.countOverlapping()` و`overlaps()` في `reservationService`:

```js
// قبل الإصلاح
r.check_in <= checkOut && r.check_out >= checkIn
```

SPEC §2: الإقامة `[checkIn, checkOut)` — يوم المغادرة **لا يشغّل** غرفة. RES-10999 `[Nov 8, Nov 10)` ليالي {8,9}؛ الطلب `[Nov 10, Nov 12)` ليالي {10,11} — **لا تقاطع**. الشرط `check_out >= checkIn` يُدخل RES-10999 خطأً.

**2) الحجز يُعدّ ضد نفسه عند التمديد** — `changeDates()` يستدعي `assertRoomsLeft()` دون استثناء `id` الحجز قيد التعديل. RES-11150 `[Dec 2, Dec 5)` يتقاطع مع `[Dec 2, Dec 7)` حتى بالنموذج الصحيح — **استثناء الذات** شرط لـ PATCH.

**لماذا لا يكفي الإصلاح الواضح**

| الإصلاح السطحي | لماذا لا يكفي |
|---|---|
| تغيير `>=` إلى `>` في overlap فقط | يصلح turnover لكن **لا** يصلح تمديد RES-11150 (self-block) |
| استثناء `id` في `changeDates` فقط | يصلح التمديد لكن **لا** يصلح walk-in/h availability في يوم التبديل |
| `-1` على `check_out` في SQL | workaround وليس نموذج `[start, end)`؛ يتعارض مع SPEC ومع `enumerateNights` |

**ما تأثّر أيضًا بالسبب نفسه**

| المسار | التأثير |
|---|---|
| `GET /availability` | `available` و`quotedTotal` (العدد فقط؛ السعر من 2291) |
| `POST /reservations` | رفض حجوزات walk-in في turnover |
| `PATCH /reservations/:id` | رفض تمديد/تعديل تواريخ |
| `CREATE` في verify | `available` قبل الحجز + نتيجة الإنشاء |
| حجوزات ملغاة | SQL القديم لم يفلتر `status='confirmed'` — cancelled قد تُحسب (C0583/C0584 في verify) |

**التحصين**

- `countOverlapping()`: `check_in < checkOut AND check_out > checkIn` — `[start, end)` وفق SPEC §2.
- فلتر `status = 'confirmed'` في SQL.
- معامل `excludeReservationId` — `changeDates` يمرّر `id` الحجز.
- إضافة `rangesOverlap()` في `dates.js` — دالة مشتركة للمقارنة.
- حذف `overlaps()` المحلي المكرر؛ مصدر واحد في repository.

**ما تُرك دون تغيير (ولماذا)**

- منطق السعة «booked >= total_rooms → مرفوض» — صحيح؛ الخطأ كان في **تعريف** booked.
- `enumerateNights()` — لم تُمس؛ المرجع الصحيح.
- seed الحجوزات — RES-10999/11001/… صحيحة؛ المشكلة في عدّ التداخل لا في البيانات.

---

## الملف المرجعي

**الصفوف الفاشلة قبل الإصلاح:** **276** من 596 (`320/596` ناجحة)

| النوع | العدد | أمثلة مرتبطة بالبلاغين |
|---|---|---|
| QUOTE | 222 | Q0247–Q0249 (Aug28→Sep4)، Q0051 (Jun1→Jun2)، Q0080 (Aug27→Sep10) |
| PREVIEW | 19 | P0542, P0558–P0560 (Aug29→Sep4) |
| AVAIL | 27 | **A0456**, **A0459**, **A0462**, **A0507–A0509** (Aug28→Sep3) |
| EXTEND | 2 | **E0593**, **E0594** (RES-11150) |
| CREATE | 6 | **C0581**, **C0582** (STD Nov10 turnover) |

صفوف إضافية (89) كانت تتوقع `status=4xx` لإقامات بليالي بلا تعرفة (فجوة `2026-12-20..27`، dates بعد آخر موسم) — النظام كان يُرجع 200 بquote جزئي. أُصلحت بـ `assertPricable()` / `assertStayDates()` (SPEC §2–§3).

**الصفوف الفاشلة بعد الإصلاح:** **0** (`596/596`)
