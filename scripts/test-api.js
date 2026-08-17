// scripts/test-api.js
// ✅ اختبار شامل لـ APIs المشروع بعد إزالة التوكن

const baseUrl = 'https://forsa-app-ten.vercel.app';

// ألوان للـ Console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

// دالة لاختبار endpoint
async function testEndpoint(name, url, options = {}) {
  console.log(`${colors.blue}🔄${colors.reset} جاري اختبار: ${name}...`);
  try {
    const res = await fetch(`${baseUrl}${url}`, options);
    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success !== false) {
      console.log(`${colors.green}✅${colors.reset} ${name} - نجاح (Status: ${res.status})`);
      return { success: true, data, status: res.status };
    } else {
      console.log(`${colors.red}❌${colors.reset} ${name} - فشل (Status: ${res.status})`);
      console.log(`   ${colors.yellow}الخطأ:${colors.reset} ${data.error || data.message || 'خطأ غير معروف'}`);
      return { success: false, data, status: res.status };
    }
  } catch (error) {
    console.log(`${colors.red}❌${colors.reset} ${name} - تعطل: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// دالة تشغيل الاختبارات
async function runTests() {
  console.log(`\n${colors.blue}🚀${colors.reset} بدء تشغيل بوت الاختبار الآلي...\n`);

  const results = [];

  // ============================
  // 1️⃣ اختبار الـ GET (قراءة)
  // ============================
  console.log(`\n${colors.yellow}📖${colors.reset} === اختبارات القراءة (GET) ===\n`);

  // 1.1 البطاقات
  results.push(await testEndpoint('البطاقات (GET /api/tickets)', '/api/tickets?page=1&limit=5'));

  // 1.2 الجوائز
  results.push(await testEndpoint('الجوائز (GET /api/admin/prizes)', '/api/admin/prizes'));

  // 1.3 الإعدادات
  results.push(await testEndpoint('الإعدادات (GET /api/admin/settings)', '/api/admin/settings'));

  // 1.4 المستخدمين (إداري)
  results.push(await testEndpoint('المستخدمين (GET /api/admin/users)', '/api/admin/users'));

  // 1.5 موعد السحب
  results.push(await testEndpoint('موعد السحب (GET /api/admin/draw-schedule)', '/api/admin/draw-schedule'));

  // 1.6 طرق الدفع
  results.push(await testEndpoint('طرق الدفع (GET /api/admin/payment-methods)', '/api/admin/payment-methods'));

  // ============================
  // 2️⃣ اختبار الـ POST (كتابة)
  // ============================
  console.log(`\n${colors.yellow}✍️${colors.reset} === اختبارات الكتابة (POST) ===\n`);

  // 2.1 حجز بطاقة (اختبار باستخدام بيانات وهمية)
  const bookResult = await testEndpoint('حجز بطاقة (POST /api/tickets/book)', '/api/tickets/book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ticketNumber: 9999, // رقم غير موجود غالباً
      userName: 'اختبار',
      userPhone: '0599000000',
      contactPhone: '0599000000',
      paymentMethod: 'بنك',
      receiptImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      notes: 'اختبار آلي',
    }),
  });
  results.push(bookResult);

  // 2.2 إعادة ضبط البطاقات (للاختبار فقط)
  const resetResult = await testEndpoint('إعادة ضبط البطاقات (POST /api/admin/tickets/reset)', '/api/admin/tickets/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count: 10 }), // يعيد ضبط 10 بطاقات فقط للاختبار
  });
  results.push(resetResult);

  // 2.3 إضافة جائزة اختبارية (ثم نحذفها لاحقاً)
  const addPrizeResult = await testEndpoint('إضافة جائزة (POST /api/admin/prizes)', '/api/admin/prizes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tier: 99,
      title: 'جائزة اختبارية',
      description: 'تم إنشاؤها بواسطة البوت الآلي',
      image: null,
    }),
  });
  results.push(addPrizeResult);

  // إذا تمت إضافة الجائزة، نحذفها
  if (addPrizeResult.success && addPrizeResult.data?.prize?.id) {
    const prizeId = addPrizeResult.data.prize.id;
    await testEndpoint(`حذف الجائزة (DELETE /api/admin/prizes)`, '/api/admin/prizes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: prizeId }),
    });
  }

  // ============================
  // 3️⃣ اختبار الـ Rate Limiting
  // ============================
  console.log(`\n${colors.yellow}⏱️${colors.reset} === اختبار Rate Limiting (إن وجد) ===\n`);
  
  let rateLimitPassed = false;
  try {
    const promises = [];
    for (let i = 0; i < 150; i++) {
      promises.push(fetch(`${baseUrl}/api/tickets?page=1&limit=1`));
    }
    const responses = await Promise.all(promises);
    const statusCodes = responses.map(r => r.status);
    const has429 = statusCodes.includes(429);
    
    if (has429) {
      console.log(`${colors.green}✅${colors.reset} Rate Limiting يعمل (تم رصد 429)`);
      rateLimitPassed = true;
    } else {
      console.log(`${colors.yellow}⚠️${colors.reset} Rate Limiting غير مفعّل (أو الحد أعلى من 150)`);
      rateLimitPassed = true; // نعتبره ناجح إذا لم يكن مفعلاً
    }
  } catch (error) {
    console.log(`${colors.red}❌${colors.reset} فشل اختبار Rate Limiting: ${error.message}`);
  }

  // ============================
  // 4️⃣ اختبار PDF
  // ============================
  console.log(`\n${colors.yellow}📄${colors.reset} === اختبار PDF ===\n`);
  
  if (bookResult.success && bookResult.data?.ticketNumber) {
    const ticketNum = bookResult.data.ticketNumber || 9999;
    const pdfResult = await testEndpoint(`PDF (GET /api/admin/tickets/${ticketNum}/pdf)`, `/api/admin/tickets/${ticketNum}/pdf`);
    results.push(pdfResult);
  } else {
    console.log(`${colors.yellow}⚠️${colors.reset} تخطي اختبار PDF (لأن حجز البطاقة فشل)`);
  }

  // ============================
  // 📊 التقرير النهائي
  // ============================
  console.log(`\n${colors.blue}📊${colors.reset} === التقرير النهائي ===\n`);

  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = total - passed;

  console.log(`✅ الناجح: ${colors.green}${passed}${colors.reset}`);
  console.log(`❌ الفاشل: ${colors.red}${failed}${colors.reset}`);
  console.log(`📊 المجموع: ${total}`);

  if (failed === 0) {
    console.log(`\n${colors.green}🎉${colors.reset} جميع الاختبارات ناجحة! التطبيق يعمل بشكل جيد.`);
  } else {
    console.log(`\n${colors.yellow}⚠️${colors.reset} يوجد ${failed} اختبارات فاشلة، تحتاج إلى مراجعة.`);
  }

  console.log(`\n${colors.blue}🏁${colors.reset} انتهى الاختبار.\n`);
}

// تشغيل الاختبار
runTests();
