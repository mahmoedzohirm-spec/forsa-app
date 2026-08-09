const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:123qwe456asd789zxc@db.iizazuocfgkggqpvzqfa.supabase.co:5432/postgres?sslmode=require'
});
pool.query('SELECT NOW()').then(r => {
  console.log('✅ Connected:', r.rows);
  process.exit(0);
}).catch(e => {
  console.error('❌ Error:', e);
  process.exit(1);
});