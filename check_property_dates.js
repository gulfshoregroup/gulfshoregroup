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

async function checkPropertyDates() {
  console.log("Checking property creation/modification dates...");
  
  const total = await prisma.property.count();
  console.log(`Total properties: ${total}`);

  const createdLast24h = await prisma.property.count({
    where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
  });
  console.log(`Created in last 24h: ${createdLast24h}`);

  const createdLast7Days = await prisma.property.count({
    where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
  });
  console.log(`Created in last 7 days: ${createdLast7Days}`);

  const updatedLast24h = await prisma.property.count({
    where: { updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
  });
  console.log(`Updated in last 24h (by sync): ${updatedLast24h}`);

  const modLast24h = await prisma.property.count({
    where: { ModificationTimestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
  });
  console.log(`ModificationTimestamp in last 24h: ${modLast24h}`);

  const onMarketLast24h = await prisma.property.count({
    where: { OnMarketDate: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
  });
  console.log(`OnMarketDate in last 24h: ${onMarketLast24h}`);

  // Check last sync date in CommunicationLog or anywhere else if available
  const latestProperty = await prisma.property.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true, createdAt: true, updatedAt: true, ModificationTimestamp: true, OnMarketDate: true }
  });
  console.log(`Latest property created:`, latestProperty);
}

checkPropertyDates().catch(console.error).finally(() => prisma.$disconnect());
