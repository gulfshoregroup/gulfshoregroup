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

async function checkDimitri() {
  console.log("Connected to DB...");
  const leads = await prisma.lead.findMany({
    where: {
      OR: [
        { email: { contains: 'dimitri' } },
        { email: { contains: 'schwarz' } }
      ]
    },
    include: {
      savedSearch: true,
      alerts: true
    }
  });

  console.log('--- LEAD INFO ---');
  console.log(JSON.stringify(leads, null, 2));

  const allSavedSearches = await prisma.savedSearch.findMany({
    include: { user: true }
  });
  console.log(`--- ALL SAVED SEARCHES (${allSavedSearches.length}) ---`);
  console.log(JSON.stringify(allSavedSearches, null, 2));

  const propertiesCount = await prisma.property.count();
  console.log(`Total properties in DB: ${propertiesCount}`);

  const recentProps = await prisma.property.count({
    where: {
      createdAt: { gt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
    }
  });
  console.log(`Properties created in last 14 days: ${recentProps}`);
}

checkDimitri().catch(console.error).finally(() => prisma.$disconnect());
