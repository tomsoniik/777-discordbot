import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log('Nodes:', await prisma.playerNode.count());
}
main();
