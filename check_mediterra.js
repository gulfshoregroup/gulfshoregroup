const mysql = require('mysql2/promise');
async function run() {
  const db = await mysql.createConnection('mysql://root:bxGeeSLpvEVogKQdgrkBafeGotQEBpZv@tokaido.proxy.rlwy.net:41175/railway');
  const [rows] = await db.execute("SELECT Community, Development, SubdivisionName FROM properties WHERE Community LIKE '%Mediterra%' OR Development LIKE '%Mediterra%' OR SubdivisionName LIKE '%Mediterra%' LIMIT 5");
  console.log('Result:', rows);
  
  process.exit(0);
}
run();
