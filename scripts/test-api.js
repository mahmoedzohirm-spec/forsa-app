// scripts/test-api.js
// ✅ بوت اختبار بسيط لـ APIs الأساسية (بدون تغيير بيانات)

const baseUrl = 'https://forsa-app-ten.vercel.app';

// دالة لاختبار端点 معين
async function testEndpoint(name, url, options = {}) {
  console.log(`🔄 جاري اختبار: ${name}...`);
  try {
    const res = await fetch(`${baseUrl}${url}`, options);
    const data = await res.json();
    
    if (res.ok && data.success !== false) {
      console.log(`✅ ${name} - النجاح (Status: ${res.status})`);
      return true;
    } else {
      console.log(`❌ ${name} - فشل (Status: ${res.status})`);
      console.log(`   الخطأ: ${data.error || 'خطأ غير معروف'}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name} - تعطل: ${error.message}`);
    return false;
  }
}

// دالة تشغيل الاختبارات
async function runTests() {
  console.log('\n🚀 بدء تشغيل بوت الاختبار الآلي...\n');

  // 1️⃣ اختبار البطاقات (مع Pagination)
  await testEndpoint('البطاقات (GET /api/tickets)', '/api/tickets?page=1&limit=5');

  // 2️⃣ اختبار الجوائز (عام)
  await testEndpoint('الجوائز (GET /api/admin/prizes)', '/api/admin/prizes');

  // 3️⃣ اختبار الإعدادات (عام)
  await testEndpoint('الإعدادات (GET /api/admin/settings)', '/api/admin/settings');

  // 4️⃣ اختبار الـ Middleware (هل يمنع الوصول لـ POST بدون توكن؟)
  console.log('\n🔄 اختبار منع الوصول غير المصرح به (POST بدون توكن)...');
  try {
    const res = await fetch(`${baseUrl}/api/admin/prizes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: 99, title: 'اختبار' }),
    });
    if (res.status === 403 || res.status === 401) {
      console.log(`✅ منع الوصول يعمل (Status: ${res.status})`);
    } else {
      console.log(`❌ منع الوصول لا يعمل (Status: ${res.status}) - خطر أمني!`);
    }
  } catch (error) {
    console.log(`❌ فشل اختبار الأمان: ${error.message}`);
  }

  console.log('\n🏁 انتهى الاختبار.');
}

// تشغيل الاختبار
runTests();
