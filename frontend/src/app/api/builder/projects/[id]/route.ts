import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const project = await prisma.baseProject.findUnique({
      where: { id: params.id },
      include: {
        owner: { select: { id: true, name: true } },
        collaborators: { select: { id: true, name: true } }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check access
    const hasAccess = project.ownerId === session.user.id || project.collaborators.some(c => c.id === session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const project = await prisma.baseProject.findUnique({
      where: { id: params.id },
      include: { collaborators: { select: { id: true } } }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check access
    const hasAccess = project.ownerId === session.user.id || project.collaborators.some(c => c.id === session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { data } = body;

    const updated = await prisma.baseProject.update({
      where: { id: params.id },
      data: { data: JSON.stringify(data) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
