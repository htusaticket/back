import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const progressCount = await prisma.userDailyChallengeProgress.count();
    const challengeCount = await prisma.dailyChallenge.count();
    console.log(`Before: ${challengeCount} challenges, ${progressCount} submissions.`);

    const { count: deletedProgress } = await prisma.userDailyChallengeProgress.deleteMany();
    const { count: deletedChallenges } = await prisma.dailyChallenge.deleteMany();

    console.log(`Deleted ${deletedProgress} submissions and ${deletedChallenges} challenges.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
