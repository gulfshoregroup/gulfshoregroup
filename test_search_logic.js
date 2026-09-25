const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    process.env[key] = val;
  }
});

const { PrismaClient } = require('./src/app/generated/prisma');
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const dbUrlStr = process.env.DATABASE_URL;
const url = new URL(dbUrlStr);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: url.port ? parseInt(url.port, 10) : 3306,
  user: url.username,
  password: url.password,
  database: url.pathname ? url.pathname.slice(1) : "railway",
  connectTimeout: 90000,
  connectionLimit: 40,
  acquireTimeout: 90000,
  socketTimeout: 120000,
});

const prisma = new PrismaClient({ adapter });

async function testSearchLogic() {
  const dimitri = await prisma.lead.findFirst({
    where: { email: 'dimitri.schwarz@gmail.com' },
    include: { savedSearch: true }
  });

  console.log(`Dimitri has ${dimitri.savedSearch.length} saved searches.`);

  for (const search of dimitri.savedSearch) {
    console.log(`\n=== Testing Search: "${search.name}" (ID: ${search.id}) ===`);
    console.log(`Filters:`, search.filters);
    console.log(`lastNotifiedAt:`, search.lastNotifiedAt);

    const lookbackDate = search.lastNotifiedAt
      ? search.lastNotifiedAt
      : new Date(Date.now() - 24 * 60 * 60 * 1000);
    console.log(`lookbackDate:`, lookbackDate.toISOString());

    const filtersObj = search.filters || {};
    const baseWhere = {};

    if (filtersObj.city) {
      baseWhere.City = { contains: filtersObj.city.replace(/-/g, ' ') };
    }

    // Current query in processSavedSearches.ts:
    const currentWhere = {
      ...baseWhere,
      StandardStatus: "Active",
      createdAt: { gt: lookbackDate },
      OR: [
        { DaysOnMarket: { lte: 14 } },
        { OnMarketDate: { gt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } }
      ]
    };

    const currentMatches = await prisma.property.findMany({
      where: currentWhere,
      select: { id: true, FullAddress: true, City: true, createdAt: true, updatedAt: true, OnMarketDate: true, DaysOnMarket: true }
    });
    console.log(`Current query matching properties count: ${currentMatches.length}`);

    // Query WITHOUT createdAt constraint (checking recent OnMarketDate or ModificationTimestamp or updatedAt):
    const relaxedWhere = {
      ...baseWhere,
      StandardStatus: "Active",
      OR: [
        { OnMarketDate: { gt: lookbackDate } },
        { ModificationTimestamp: { gt: lookbackDate } },
        { updatedAt: { gt: lookbackDate } },
        { createdAt: { gt: lookbackDate } }
      ]
    };
    const relaxedMatches = await prisma.property.findMany({
      where: relaxedWhere,
      select: { id: true, FullAddress: true, City: true, createdAt: true, updatedAt: true, OnMarketDate: true, DaysOnMarket: true, ModificationTimestamp: true },
      take: 10
    });
    console.log(`Relaxed query matching properties count: ${relaxedMatches.length}`);
    if (relaxedMatches.length > 0) {
      console.log(`Sample relaxed properties:`, relaxedMatches.slice(0, 3));
    }
  }
}

testSearchLogic().catch(console.error).finally(() => prisma.$disconnect());
