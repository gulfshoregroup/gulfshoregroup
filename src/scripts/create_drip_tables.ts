import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  try {
    console.log("Connecting to database...");
    console.log("Creating dripcampaign table if not exists...");
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`dripcampaign\` (
          \`id\` VARCHAR(191) NOT NULL,
          \`name\` VARCHAR(191) NOT NULL,
          \`channel\` VARCHAR(191) NOT NULL,
          \`daysAfterSignup\` INTEGER NOT NULL,
          \`messageTemplate\` TEXT NOT NULL,
          \`status\` VARCHAR(191) NOT NULL DEFAULT 'active',
          \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    console.log("Creating dripcampaignlog table if not exists...");
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`dripcampaignlog\` (
          \`id\` VARCHAR(191) NOT NULL,
          \`campaignId\` VARCHAR(191) NOT NULL,
          \`userId\` VARCHAR(191) NOT NULL,
          \`sentAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`status\` VARCHAR(191) NOT NULL DEFAULT 'sent',
          UNIQUE INDEX \`dripcampaignlog_campaignId_userId_key\`(\`campaignId\`, \`userId\`),
          PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    console.log("SUCCESS! Tables created safely in the live MySQL database without modifying any existing tables.");
  } catch (error) {
    console.error("Error creating tables:", error);
  }
}

main();
