import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const projects = await prisma.baseProject.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { collaborators: { some: { id: session.user.id } } }
        ]
      },
      include: {
        owner: { select: { name: true, image: true } },
        collaborators: { select: { id: true, name: true, image: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name = 'Nowy Projekt' } = body;

    // Create a random join code
    const joinCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const project = await prisma.baseProject.create({
      data: {
        name,
        ownerId: session.user.id,
        joinCode,
        data: '[]',
      }
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
