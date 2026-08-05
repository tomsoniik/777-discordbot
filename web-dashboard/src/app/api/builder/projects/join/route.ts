import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getOrCreateGuestUser() {
  let user = await prisma.user.findFirst({ where: { role: 'GUEST' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Gość',
        role: 'GUEST',
      }
    });
  }
  return user;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { joinCode } = body;

    if (!joinCode || typeof joinCode !== 'string') {
      return NextResponse.json({ error: 'Missing join code' }, { status: 400 });
    }

    const cleanCode = joinCode.trim().toUpperCase();

    // 1. Try finding existing project in PostgreSQL
    let project = await (prisma as any).baseProject.findFirst({
      where: {
        joinCode: {
          equals: cleanCode,
          mode: 'insensitive'
        }
      },
      include: {
        owner: { select: { id: true, name: true } },
        collaborators: { select: { id: true, name: true } }
      }
    });

    const session = await getServerSession();
    let userId = (session?.user as any)?.id;

    if (!userId) {
      const guest = await getOrCreateGuestUser();
      userId = guest.id;
    }

    // 2. If project does not exist in DB, create it automatically so code opens cleanly
    if (!project) {
      project = await (prisma as any).baseProject.create({
        data: {
          name: `Projekt ${cleanCode}`,
          description: `Projekt utworzony przez kod ${cleanCode}`,
          ownerId: userId,
          joinCode: cleanCode,
          data: '[]',
        },
        include: {
          owner: { select: { id: true, name: true } },
          collaborators: { select: { id: true, name: true } }
        }
      });
    } else if (userId && project.ownerId !== userId) {
      // Connect user as collaborator
      try {
        const alreadyJoined = project.collaborators?.some((c: any) => c.id === userId);
        if (!alreadyJoined) {
          await (prisma as any).baseProject.update({
            where: { id: project.id },
            data: {
              collaborators: {
                connect: { id: userId }
              }
            }
          });
        }
      } catch (e) {
        console.error("Non-fatal collaborator update error:", e);
      }
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error joining project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
