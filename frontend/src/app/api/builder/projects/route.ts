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

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as any)?.id;

    let projects = [];
    if (userId) {
      projects = await (prisma as any).baseProject.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { collaborators: { some: { id: userId } } },
            { isPublic: true }
          ]
        },
        include: {
          owner: { select: { name: true, image: true } },
          collaborators: { select: { id: true, name: true, image: true } }
        },
        orderBy: { updatedAt: 'desc' }
      });
    }

    // If user has no projects or is not logged in, return all projects in DB as fallback
    if (!projects || projects.length === 0) {
      projects = await (prisma as any).baseProject.findMany({
        include: {
          owner: { select: { name: true, image: true } },
          collaborators: { select: { id: true, name: true, image: true } }
        },
        orderBy: { updatedAt: 'desc' }
      });
    }

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json([], { status: 200 }); // Graceful fallback
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    let userId = (session?.user as any)?.id;

    if (!userId) {
      const guest = await getOrCreateGuestUser();
      userId = guest.id;
    }

    const body = await request.json();
    const { name = 'Nowy Projekt', description = '' } = body;

    const joinCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const project = await (prisma as any).baseProject.create({
      data: {
        name,
        description,
        ownerId: userId,
        joinCode,
        data: '[]',
      },
      include: {
        owner: { select: { name: true, image: true } }
      }
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
