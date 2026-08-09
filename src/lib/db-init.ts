import { pool } from "@/db";

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // ===== 1. إنشاء جدول المستخدمين =====
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50),
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN NOT NULL DEFAULT FALSE,
        is_banned BOOLEAN NOT NULL DEFAULT FALSE,
        reset_code VARCHAR(6),
        reset_code_expiry TIMESTAMP,
        reset_token VARCHAR(255),
        reset_token_expiry TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // ===== 2. إنشاء جدول البطاقات =====
    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        number INTEGER NOT NULL UNIQUE,
        status VARCHAR(50) NOT NULL DEFAULT 'available',
        user_id INTEGER REFERENCES users(id),
        user_name VARCHAR(255),
        user_phone VARCHAR(50),
        contact_phone VARCHAR(50),
        payment_method VARCHAR(100),
        receipt_image TEXT,
        notes TEXT,
        rejection_reason TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // ===== 3. إنشاء جدول سجل السحوبات =====
    await client.query(`
      CREATE TABLE IF NOT EXISTS draw_history (
        id SERIAL PRIMARY KEY,
        prize VARCHAR(255) NOT NULL,
        ticket_number INTEGER NOT NULL,
        winner_name VARCHAR(255),
        winner_phone VARCHAR(50),
        drawn_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // ===== 4. إنشاء جدول طرق الدفع =====
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        iban VARCHAR(255),
        bank_name VARCHAR(255),
        account_holder VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);

    // ===== 5. إنشاء جدول الجوائز =====
    await client.query(`
      CREATE TABLE IF NOT EXISTS prizes (
        id SERIAL PRIMARY KEY,
        tier INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);

    // ===== 6. إنشاء جدول إعدادات التطبيق =====
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) NOT NULL UNIQUE,
        value TEXT,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // ===== 7. إنشاء الفهارس (Indexes) لتحسين الأداء =====
    const indexes = [
      { name: "idx_tickets_status", sql: "CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)" },
      { name: "idx_tickets_number", sql: "CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(number)" },
      { name: "idx_tickets_user_id", sql: "CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id)" },
      { name: "idx_users_email", sql: "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)" },
      { name: "idx_draw_history_drawn_at", sql: "CREATE INDEX IF NOT EXISTS idx_draw_history_drawn_at ON draw_history(drawn_at)" },
      { name: "idx_prizes_tier", sql: "CREATE INDEX IF NOT EXISTS idx_prizes_tier ON prizes(tier)" },
    ];

    for (const idx of indexes) {
      try {
        await client.query(idx.sql);
      } catch (error: any) {
        // تجاهل الأخطاء إذا كان الفهرس موجوداً مسبقاً
        if (error.code === "23505") {
          console.log(`✅ Index ${idx.name} already exists, skipping.`);
        } else {
          console.error(`❌ Error creating index ${idx.name}:`, error);
        }
      }
    }

    // ===== 8. تهيئة البطاقات (3000 بطاقة) =====
    const ticketCount = await client.query("SELECT COUNT(*) FROM tickets");
    const count = parseInt(ticketCount.rows[0].count, 10);

    if (count === 0) {
      console.log("🔄 Seeding 3000 tickets...");
      const values: string[] = [];
      for (let i = 1; i <= 3000; i++) {
        values.push(`(${i}, 'available')`);
      }
      const batchSize = 500;
      for (let b = 0; b < values.length; b += batchSize) {
        const batch = values.slice(b, b + batchSize).join(",");
        await client.query(
          `INSERT INTO tickets (number, status) VALUES ${batch} ON CONFLICT (number) DO NOTHING`
        );
      }
    }

    // ===== 9. تهيئة طرق الدفع الافتراضية =====
    const pmCount = await client.query("SELECT COUNT(*) FROM payment_methods");
    if (parseInt(pmCount.rows[0].count, 10) === 0) {
      console.log("🔄 Seeding default payment methods...");
      await client.query(`
        INSERT INTO payment_methods (name, iban, bank_name, account_holder) VALUES
        ('تحويل بنكي', 'SA0000000000000000000000', 'البنك الأهلي السعودي', 'شركة فرصة العمر'),
        ('STC Pay', NULL, 'STC Pay', 'فرصة العمر'),
        ('مدى', NULL, 'بنك الراجحي', 'شركة فرصة العمر')
      `);
    }

    // ===== 10. تهيئة الجوائز الافتراضية =====
    const prizeCount = await client.query("SELECT COUNT(*) FROM prizes");
    if (parseInt(prizeCount.rows[0].count, 10) === 0) {
      console.log("🔄 Seeding default prizes...");
      await client.query(`
        INSERT INTO prizes (tier, title, description) VALUES
        (1, 'الجائزة الكبرى', 'سيارة فاخرة موديل 2025'),
        (2, 'رحلة سياحية', 'رحلة سياحية لشخصين إلى المالديف'),
        (3, 'جهاز إلكتروني', 'آيفون 16 برو ماكس + آيباد برو')
      `);
    }
    // ===== جدول الإشعارات =====
await client.query(`
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
)
`);

    // ===== 11. تهيئة الإعدادات الافتراضية =====
    const settingsDefaults = [
      { key: "site_name", value: "فرصة العمر" },
      { key: "currency", value: "ريال" },
      { key: "ticket_price", value: "100" },
      { key: "max_tickets", value: "3000" },
    ];
    for (const s of settingsDefaults) {
      await client.query(
        `INSERT INTO app_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
        [s.key, s.value]
      );
    }

    // ===== 12. تهيئة المستخدم المسؤول (Admin) =====
    const adminCheck = await client.query(
      "SELECT COUNT(*) FROM users WHERE is_admin = TRUE"
    );
    if (parseInt(adminCheck.rows[0].count, 10) === 0) {
      console.log("🔄 Seeding default admin user...");
     
    }

    console.log("✅ Database initialization completed successfully!");
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    throw error;
  } finally {
    client.release();
  }
} 