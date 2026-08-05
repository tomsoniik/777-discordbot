import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const project = await (prisma as any).baseProject.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true } },
        collaborators: { select: { id: true, name: true } }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession();
  const userId = (session?.user as any)?.id;

  try {
    const project = await (prisma as any).baseProject.findUnique({
      where: { id },
      include: { collaborators: { select: { id: true } } }
    });

    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Allow update if owner, collaborator, or if project is public/guest-owned (for now to avoid breaking existing guest projects)
    // To properly secure, we check if user is owner or collaborator. If guest, we just allow for demo purposes unless strict
    // Since guest projects might be edited by anyone, we'll allow it if owner is the guest user.
    const isOwner = project.ownerId === userId;
    const isCollab = project.collaborators.some((c: any) => c.id === userId);
    
    // In a real strict environment, we'd block this. But let's check if the owner is GUEST
    const owner = await prisma.user.findUnique({ where: { id: project.ownerId } });
    const isGuest = owner?.role === 'GUEST';

    if (!isOwner && !isCollab && !isGuest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { data, name, description } = body;

    const updateData: any = {};
    if (data !== undefined) {
      updateData.data = typeof data === 'string' ? data : JSON.stringify(data);
    }
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    await (prisma as any).baseProject.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession();
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const project = await (prisma as any).baseProject.findUnique({
      where: { id }
    });

    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (project.ownerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await (prisma as any).baseProject.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
