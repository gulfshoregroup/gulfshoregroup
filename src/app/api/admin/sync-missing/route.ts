import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  const oldDbUrl = 'mysql://root:GwTYWMrmTEqXVoUvsLPHpdDnYMzVeDCa@sakura.proxy.rlwy.net:22040/railway';
  const newDbUrl = 'mysql://root:bxGeeSLpvEVogKQdgrkBafeGotQEBpZv@tokaido.proxy.rlwy.net:41175/railway';

  try {
    const oldDb = await mysql.createConnection(oldDbUrl);
    const newDb = await mysql.createConnection(newDbUrl);

    // Fetch the latest properties from both databases
    const [oldRows] = await oldDb.execute('SELECT * FROM properties ORDER BY ModificationTimestamp DESC LIMIT 5000') as any;
    const [newRows] = await newDb.execute('SELECT ListingKey FROM properties ORDER BY ModificationTimestamp DESC LIMIT 5000') as any;
    
    const newDbKeys = new Set(newRows.map((row: any) => row.ListingKey));
    const missingProperties = oldRows.filter((row: any) => !newDbKeys.has(row.ListingKey));

    if (missingProperties.length === 0) {
      await oldDb.end();
      await newDb.end();
      return NextResponse.json({ message: "No missing properties found to sync." });
    }

    let syncedPropertiesCount = 0;
    
    // 1. Insert properties
    for (const prop of missingProperties) {
      const keys = Object.keys(prop);
      const values = Object.values(prop);
      const placeholders = keys.map(() => '?').join(', ');
      
      const query = `INSERT IGNORE INTO properties (${keys.join(', ')}) VALUES (${placeholders})`;
      await newDb.execute(query, values);
      syncedPropertiesCount++;
    }

    // 2. Fetch and sync media
    let syncedMediaCount = 0;
    const missingPropertyIds = missingProperties.map((p: any) => p.id);
    const batchSize = 100;
    
    for (let i = 0; i < missingPropertyIds.length; i += batchSize) {
      const batchIds = missingPropertyIds.slice(i, i + batchSize);
      const placeholders = batchIds.map(() => '?').join(',');
      
      const [mediaRows] = await oldDb.execute(
        `SELECT * FROM media WHERE propertyId IN (${placeholders})`,
        batchIds
      ) as any;
      
      for (const media of mediaRows) {
        const keys = Object.keys(media);
        const values = Object.values(media);
        const placeholdersStr = keys.map(() => '?').join(', ');
        
        const query = `INSERT IGNORE INTO media (${keys.join(', ')}) VALUES (${placeholdersStr})`;
        await newDb.execute(query, values);
        syncedMediaCount++;
      }
    }

    await oldDb.end();
    await newDb.end();

    return NextResponse.json({ 
      success: true, 
      message: "Sync completed successfully!", 
      details: {
        propertiesSynced: syncedPropertiesCount,
        mediaSynced: syncedMediaCount
      }
    });

  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
