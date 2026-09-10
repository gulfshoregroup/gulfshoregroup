const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const whereClause = { published: true };
    whereClause.OR = [
        { category: { not: "facebook" } },
        { category: null }
    ];
    
    const articles = await prisma.blog.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: 4,
    });
    console.log("Success:", articles.length);
  } catch (error) {
    console.error("Prisma Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
