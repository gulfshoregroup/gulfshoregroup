const mysql = require('mysql2/promise');

async function runSQL() {
  const connection = await mysql.createConnection({
    host: 'tokaido.proxy.rlwy.net',
    port: 41175,
    user: 'root',
    password: 'bxGeeSLpvEVogKQdgrkBafeGotQEBpZv',
    database: 'railway',
    connectTimeout: 30000,
  });

  console.log('✅ Connected to Railway MySQL!');

  // Step 1: Check if shortlink table exists
  const [tables] = await connection.execute(`SHOW TABLES LIKE 'shortlink'`);
  console.log(`\n📋 shortlink table exists: ${tables.length > 0 ? 'YES ✅' : 'NO ❌'}`);

  // Step 2: Create shortlink table if missing
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`shortlink\` (
      \`id\`        VARCHAR(191)  NOT NULL,
      \`code\`      VARCHAR(191)  NULL,
      \`slug\`      VARCHAR(191)  NULL,
      \`url\`       LONGTEXT      NOT NULL,
      \`clicks\`    INT           NOT NULL DEFAULT 0,
      \`createdAt\` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`shortlink_code_key\` (\`code\`),
      UNIQUE KEY \`shortlink_slug_key\` (\`slug\`),
      INDEX \`shortlink_code_idx\` (\`code\`),
      INDEX \`shortlink_slug_idx\` (\`slug\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
  console.log('✅ shortlink table created/verified!');

  // Step 3: Show all shortlinks in DB (to debug existing ones)
  const [links] = await connection.execute(`SELECT id, code, slug, LEFT(url, 80) as url_preview, createdAt FROM shortlink ORDER BY createdAt DESC LIMIT 10`);
  console.log(`\n📋 Existing short links in DB (last 10):`);
  console.table(links);

  // Step 4: Check total active properties count
  const [props] = await connection.execute(`SELECT COUNT(*) as total FROM properties WHERE StandardStatus = 'Active'`);
  console.log(`\n🏠 Total Active Properties in DB: ${props[0].total}`);

  // Step 5: Check for recently added properties (last 24h and 7 days)
  const [recent24h] = await connection.execute(`
    SELECT COUNT(*) as count FROM properties 
    WHERE StandardStatus = 'Active' 
    AND (OnMarketDate > NOW() - INTERVAL 24 HOUR OR OnMarketTimestamp > NOW() - INTERVAL 24 HOUR OR PriceChangeTimestamp > NOW() - INTERVAL 24 HOUR)
  `);
  const [recent7d] = await connection.execute(`
    SELECT COUNT(*) as count FROM properties 
    WHERE StandardStatus = 'Active' 
    AND (OnMarketDate > NOW() - INTERVAL 7 DAY OR OnMarketTimestamp > NOW() - INTERVAL 7 DAY OR PriceChangeTimestamp > NOW() - INTERVAL 7 DAY)
  `);
  console.log(`📅 Properties updated in last 24h: ${recent24h[0].count}`);
  console.log(`📅 Properties updated in last 7 days: ${recent7d[0].count}`);

  // Step 6: Check Dimitri's saved searches
  const [lead] = await connection.execute(`SELECT id, email, phone, firstName FROM \`lead\` WHERE email = 'dimitri.schwarz@gmail.com'`);
  if (lead.length > 0) {
    console.log(`\n👤 Dimitri found:`, lead[0]);
    const [searches] = await connection.execute(`SELECT id, name, filters, lastNotifiedAt, notify FROM \`savedsearch\` WHERE userId = ?`, [lead[0].id]);
    console.log(`\n🔍 Dimitri's Saved Searches (${searches.length} total):`);
    searches.forEach((s, i) => {
      console.log(`\nSearch ${i+1}: "${s.name}"`);
      console.log(`  notify: ${s.notify}, lastNotifiedAt: ${s.lastNotifiedAt}`);
      const filters = typeof s.filters === 'string' ? JSON.parse(s.filters) : s.filters;
      console.log(`  filters:`, JSON.stringify(filters, null, 2));
    });
  } else {
    console.log('\n❌ Dimitri not found in DB!');
  }

  await connection.end();
  console.log('\n✅ Done!');
}

runSQL().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
