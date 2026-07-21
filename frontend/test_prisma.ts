import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  const projects = await (prisma as any).baseProject.findMany();
  console.log('Users count:', users.length, users);
  console.log('Projects count:', projects.length, projects);
}
main();
