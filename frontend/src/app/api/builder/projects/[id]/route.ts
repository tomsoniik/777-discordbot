import { NextResponse } from 'next/server';
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

  try {
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

  try {
    await (prisma as any).baseProject.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
