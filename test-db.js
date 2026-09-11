const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const campaigns = await prisma.dripCampaign.findMany();
  console.log(campaigns.map(c => ({name: c.name, tpl: c.messageTemplate})));
}
main().catch(console.error).finally(() => prisma.$disconnect());
