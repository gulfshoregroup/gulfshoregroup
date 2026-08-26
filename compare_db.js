const mysql = require('mysql2/promise');

async function main() {
  const oldDbUrl = 'mysql://root:GwTYWMrmTEqXVoUvsLPHpdDnYMzVeDCa@sakura.proxy.rlwy.net:22040/railway';
  const newDbUrl = 'mysql://root:bxGeeSLpvEVogKQdgrkBafeGotQEBpZv@tokaido.proxy.rlwy.net:41175/railway';

  console.log('Connecting to Old DB...');
  const oldDb = await mysql.createConnection(oldDbUrl);
  
  console.log('Connecting to New DB...');
  const newDb = await mysql.createConnection(newDbUrl);

  try {
    // We only care about properties, let's fetch the ListingKey of the latest properties in Old DB
    // Assuming table name is Property and id is ListingKey
    const [oldRows] = await oldDb.execute('SELECT ListingKey, City, ListPrice FROM properties ORDER BY ModificationTimestamp DESC LIMIT 5000');
    console.log(`Fetched ${oldRows.length} properties from Old DB`);

    const [newRows] = await newDb.execute('SELECT ListingKey FROM properties ORDER BY ModificationTimestamp DESC LIMIT 5000');
    console.log(`Fetched ${newRows.length} properties from New DB`);

    const newDbKeys = new Set(newRows.map(row => row.ListingKey));

    const missingInNew = oldRows.filter(row => !newDbKeys.has(row.ListingKey));
    
    console.log(`\nFound ${missingInNew.length} properties that are in OLD DB but missing in NEW DB.`);
    
    if (missingInNew.length > 0) {
      console.log('Missing Properties (Sample of 10):');
      missingInNew.slice(0, 10).forEach(p => {
        console.log(`- ListingKey: ${p.ListingKey}, City: ${p.City}, Price: $${p.ListPrice}`);
      });
      console.log('\nMissing ListingKeys (comma separated for easy copy):');
      console.log(missingInNew.map(p => `'${p.ListingKey}'`).join(', '));
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await oldDb.end();
    await newDb.end();
  }
}

main();
