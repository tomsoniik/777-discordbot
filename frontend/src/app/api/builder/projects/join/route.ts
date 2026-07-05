import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { joinCode } = body;

    const project = await prisma.baseProject.findUnique({
      where: { joinCode },
      include: { collaborators: { select: { id: true } } }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.ownerId === session.user.id) {
      return NextResponse.json(project);
    }

    const alreadyJoined = project.collaborators.some(c => c.id === session.user.id);
    
    if (!alreadyJoined) {
      await prisma.baseProject.update({
        where: { id: project.id },
        data: {
          collaborators: {
            connect: { id: session.user.id }
          }
        }
      });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error joining project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
