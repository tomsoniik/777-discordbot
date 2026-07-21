import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const projects = await (prisma as any).baseProject.findMany();
  console.log('All projects:', projects);
  const found = projects.find((p: any) => p.joinCode?.toUpperCase() === 'AEHT81QY');
  console.log('Found AEHT81QY:', found);
}
main();
