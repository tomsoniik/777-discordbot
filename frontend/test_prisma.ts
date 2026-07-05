import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const joinCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  // using an invalid or non-existent ownerId might be the cause
  // Let's first check what's in the User table
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found');
    return;
  }
  
  try {
    const project = await (prisma as any).baseProject.create({
      data: {
        name: 'test',
        ownerId: user.id,
        joinCode,
        data: '[]',
      }
    });
    console.log('Success:', project);
  } catch(e) {
    console.error('Prisma Error:', e);
  }
}
main();
