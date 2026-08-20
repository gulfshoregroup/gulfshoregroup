import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  try {
    console.log("Connecting to database...");
    console.log("Creating campaignclick table if not exists...");
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`campaignclick\` (
          \`id\` VARCHAR(191) NOT NULL,
          \`source\` VARCHAR(191) NOT NULL,
          \`path\` VARCHAR(191) NULL,
          \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          INDEX \`campaignclick_source_idx\`(\`source\`),
          INDEX \`campaignclick_createdAt_idx\`(\`createdAt\`),
          PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    console.log("SUCCESS! campaignclick table created safely in the live MySQL database.");
  } catch (error) {
    console.error("Error creating table:", error);
  }
}

main();
