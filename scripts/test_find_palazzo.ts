import "dotenv/config";
import prisma from "../src/lib/prisma";

async function main() {
  const props = await prisma.property.findMany({
    where: {
      FullAddress: { contains: "10102" }
    },
    take: 5
  });
  console.log("FOUND_COUNT:", props.length);
  for (const p of props) {
    console.log({
      MLSNumber: p.MLSNumber,
      FullAddress: p.FullAddress,
      City: p.City,
      StandardStatus: p.StandardStatus,
      ListPrice: p.ListPrice
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
