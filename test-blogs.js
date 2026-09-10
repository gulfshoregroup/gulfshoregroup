const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const blogs = await prisma.blog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5
  });
  console.log("Latest Blogs:");
  blogs.forEach(b => {
    console.log(`- ${b.title}`);
    console.log(`  createdAt: ${b.createdAt}, publishedAt: ${b.publishedAt}, coverImage: ${b.coverImage}`);
  });
  await prisma.$disconnect();
}

main().catch(console.error);
