const { PrismaClient } = require('./src/app/generated/prisma');
const prisma = new PrismaClient();
async function main() {
    const count = await prisma.property.count({
        where: { createdAt: { gt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) } }
    });
    console.log('Properties created in last 10 days:', count);
    
    const latest = await prisma.property.findFirst({
        orderBy: { createdAt: 'desc' }
    });
    console.log('Latest property created at:', latest ? latest.createdAt : 'None');
    console.log('Latest property Modification Timestamp:', latest ? latest.BridgeModificationTimestamp : 'None');
}
main().catch(console.error).finally(() => prisma.$disconnect());
