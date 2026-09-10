const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const blogs = await prisma.blog.findMany({ where: { published: true } });
  console.log(JSON.stringify(blogs.map(b => ({title: b.title, category: b.category, coverImage: b.coverImage})), null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
