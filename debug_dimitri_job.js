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
const { buildQueryFromFilters } = require('./src/lib/search-filters');

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

async function debugDimitriJob() {
  const lead = await prisma.lead.findFirst({
    where: { email: 'dimitri.schwarz@gmail.com' },
    include: { savedSearch: true }
  });

  if (!lead) {
    console.log("Lead not found!");
    return;
  }

  console.log(`Lead found: ${lead.email}, Phone: ${lead.phone}`);
  const searches = lead.savedSearch;

  const allMatchingProperties = new Map();
  const searchesToUpdate = [];

  for (const search of searches) {
    console.log(`\n--- Processing search: "${search.name}" ---`);
    const lookbackDate = search.lastNotifiedAt
      ? search.lastNotifiedAt
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const filtersObj = search.filters || {};
    const searchParams = buildQueryFromFilters(filtersObj);

    const baseWhere = {};

    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null;
    if (minPrice !== null || maxPrice !== null) {
      baseWhere.ListPrice = {};
      if (minPrice !== null) baseWhere.ListPrice.gte = minPrice;
      if (maxPrice !== null) baseWhere.ListPrice.lte = maxPrice;
    }

    if (filtersObj.city) baseWhere.City = { contains: filtersObj.city.replace(/-/g, ' ') };
    if (filtersObj.postalCode) baseWhere.PostalCode = filtersObj.postalCode;
    if (filtersObj.mls || filtersObj.MLSNumber) baseWhere.MLSNumber = filtersObj.mls || filtersObj.MLSNumber;
    if (filtersObj.subdivision) baseWhere.Development = { contains: filtersObj.subdivision };
    if (filtersObj.developmentName) baseWhere.Community = { contains: filtersObj.developmentName.replace(/-/g, ' ') };

    const bedsParam = searchParams.get("beds");
    if (bedsParam) baseWhere.BedroomsTotal = { gte: parseInt(bedsParam) };
    const bathsParam = searchParams.get("baths");
    if (bathsParam) baseWhere.BathroomsFull = { gte: parseInt(bathsParam) };

    const types = searchParams.get("propertyTypes") ? searchParams.get("propertyTypes").split(",") : [];
    if (types.length > 0) {
      const orConditions = [];
      if (types.includes("Homes") || types.includes("homes") || types.includes("Single Family")) {
        orConditions.push({ PropertySubType: "Single Family Residence" });
      }
      if (types.includes("Condos") || types.includes("condos")) {
        orConditions.push({ PropertySubType: { in: ["Low Rise (1-3)", "Mid Rise (4-7)", "High Rise (8+)", "Townhouse"] } });
      }
      if (types.includes("Lots") || types.includes("Residential-Lots") || types.includes("lots")) {
        orConditions.push({ PropertyType: "Land" });
      }
      if (orConditions.length > 0) {
        baseWhere.OR = orConditions;
      }
      baseWhere.PropertyType = { not: "Residential Lease" };
    } else {
      baseWhere.PropertyType = { notIn: ["Residential Lease", "Land"] };
    }

    const finalWhere = {
      ...baseWhere,
      StandardStatus: "Active",
      createdAt: { gt: lookbackDate },
      OR: [
        { DaysOnMarket: { lte: 14 } },
        { OnMarketDate: { gt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } }
      ]
    };

    console.log("finalWhere:", JSON.stringify(finalWhere, null, 2));

    const matchingProperties = await prisma.property.findMany({
      where: finalWhere,
    });

    console.log(`Matched properties count: ${matchingProperties.length}`);
    if (matchingProperties.length > 0) {
      searchesToUpdate.push(search.id);
      for (const prop of matchingProperties) {
        allMatchingProperties.set(prop.id, prop);
      }
    }
  }

  console.log(`Total unique matches across all searches: ${allMatchingProperties.size}`);
}

debugDimitriJob().catch(console.error).finally(() => prisma.$disconnect());
