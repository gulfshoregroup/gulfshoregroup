const mysql = require('mysql2/promise');
async function run() {
  const db = await mysql.createConnection('mysql://root:bxGeeSLpvEVogKQdgrkBafeGotQEBpZv@tokaido.proxy.rlwy.net:41175/railway');
  const [rows] = await db.execute("SELECT ListingKey FROM properties WHERE ListingKey = 'd05ea6f4393790df1b64b597000d2b04'");
  console.log('Result for d05ea6f4393790df1b64b597000d2b04:', rows);
  
  const [countRows] = await db.execute("SELECT count(*) as cnt FROM properties");
  console.log('Total in New DB:', countRows[0].cnt);
  
  process.exit(0);
}
run();
