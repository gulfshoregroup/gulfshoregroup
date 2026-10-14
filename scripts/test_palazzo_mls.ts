import prisma from "../src/lib/prisma";

async function main() {
  // Test 1: findFirst by MLSNumber
  const byMLS = await prisma.property.findFirst({
    where: { MLSNumber: "226035786" },
    select: { MLSNumber: true, FullAddress: true, ListPrice: true },
  });
  console.log("findUnique 226035786:", byMLS);

  // Test 2: findFirst by FullAddress contains Palazzo
  const byAddr = await prisma.property.findFirst({
    where: { FullAddress: { contains: "Palazzo" } },
    select: { MLSNumber: true, FullAddress: true, ListPrice: true },
  });
  console.log("findFirst Palazzo:", byAddr);

  // Test 3: findFirst by address contains 10102
  const by10102 = await prisma.property.findFirst({
    where: { FullAddress: { contains: "10102" } },
    select: { MLSNumber: true, FullAddress: true, ListPrice: true },
  });
  console.log("findFirst 10102:", by10102);
}

main().catch(console.error).finally(() => prisma.$disconnect());
