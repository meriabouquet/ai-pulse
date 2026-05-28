import { PrismaClient } from "@prisma/client";
import { DEFAULT_SOURCES } from "../lib/sources";

const prisma = new PrismaClient();

async function main() {
  for (const source of DEFAULT_SOURCES) {
    await prisma.source.upsert({
      where: { name: source.name },
      create: source,
      update: {
        rssUrl: source.rssUrl,
        active: source.active
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
