const mysql = require('mysql2/promise');

async function syncProperties() {
  const oldDbUrl = 'mysql://root:GwTYWMrmTEqXVoUvsLPHpdDnYMzVeDCa@sakura.proxy.rlwy.net:22040/railway';
  const newDbUrl = 'mysql://root:bxGeeSLpvEVogKQdgrkBafeGotQEBpZv@tokaido.proxy.rlwy.net:41175/railway';

  console.log('Connecting to databases...');
  const oldDb = await mysql.createConnection(oldDbUrl);
  const newDb = await mysql.createConnection(newDbUrl);

  try {
    console.log('Fetching properties from Old DB...');
    const [oldRows] = await oldDb.execute('SELECT * FROM properties ORDER BY ModificationTimestamp DESC LIMIT 5000');
    
    console.log('Fetching properties from New DB...');
    const [newRows] = await newDb.execute('SELECT ListingKey FROM properties ORDER BY ModificationTimestamp DESC LIMIT 5000');
    
    const newDbKeys = new Set(newRows.map(row => row.ListingKey));
    
    // Find missing properties
    const missingProperties = oldRows.filter(row => !newDbKeys.has(row.ListingKey));
    console.log(`Found ${missingProperties.length} missing properties to sync.`);

    if (missingProperties.length === 0) {
      console.log('No properties to sync. Exiting.');
      return;
    }

    // Insert properties into New DB
    console.log('Inserting missing properties into New DB...');
    for (let i = 0; i < missingProperties.length; i++) {
      const prop = missingProperties[i];
      
      const keys = Object.keys(prop);
      const values = Object.values(prop);
      const placeholders = keys.map(() => '?').join(', ');
      
      const query = `INSERT IGNORE INTO properties (${keys.join(', ')}) VALUES (${placeholders})`;
      await newDb.execute(query, values);
      
      if ((i + 1) % 100 === 0) {
        console.log(`Synced ${i + 1}/${missingProperties.length} properties...`);
      }
    }

    console.log('Properties synced successfully! Now syncing related media...');

    // Fetch and sync media for these properties
    const missingPropertyIds = missingProperties.map(p => p.id);
    
    // Process media in batches of 100 to avoid huge queries
    const batchSize = 100;
    let totalMediaSynced = 0;
    
    for (let i = 0; i < missingPropertyIds.length; i += batchSize) {
      const batchIds = missingPropertyIds.slice(i, i + batchSize);
      const placeholders = batchIds.map(() => '?').join(',');
      
      const [mediaRows] = await oldDb.execute(
        `SELECT * FROM media WHERE propertyId IN (${placeholders})`,
        batchIds
      );
      
      for (const media of mediaRows) {
        const keys = Object.keys(media);
        const values = Object.values(media);
        const placeholdersStr = keys.map(() => '?').join(', ');
        
        const query = `INSERT IGNORE INTO media (${keys.join(', ')}) VALUES (${placeholdersStr})`;
        await newDb.execute(query, values);
        totalMediaSynced++;
      }
      console.log(`Processed media for property batch ${Math.floor(i / batchSize) + 1}...`);
    }

    console.log(`Sync complete! Synced ${missingProperties.length} properties and ${totalMediaSynced} media records.`);

  } catch (err) {
    console.error('Error syncing databases:', err);
  } finally {
    await oldDb.end();
    await newDb.end();
  }
}

syncProperties();
