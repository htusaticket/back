import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { extractJobCode } from '../src/application/admin/services/extract-job-code';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  try {
    const jobs = await prisma.jobOffer.findMany({
      where: { code: null },
      select: { id: true, description: true, title: true },
    });

    console.log(`Found ${jobs.length} job offers without a code.`);

    let updated = 0;
    for (const job of jobs) {
      const code = extractJobCode(job.description);
      if (!code) continue;
      await prisma.jobOffer.update({
        where: { id: job.id },
        data: { code },
      });
      console.log(`  [#${job.id}] "${job.title}" -> code ${code}`);
      updated++;
    }

    console.log(`Done. Updated ${updated}/${jobs.length}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
