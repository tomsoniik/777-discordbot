import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const nodes = await prisma.playerNode.findMany({
      take: 200,
      orderBy: { lastSeenAt: 'desc' }
    });

    const relations = await prisma.playerRelation.findMany({
      where: {
        bondStrength: { gte: 1 }
      },
      take: 500,
      orderBy: { bondStrength: 'desc' }
    });

    // Format for react-force-graph
    const graphData = {
      nodes: nodes.map(n => ({
        id: n.steamId,
        name: n.lastNickname || n.steamId,
        val: 1
      })),
      links: relations.map(r => ({
        source: r.steamIdA,
        target: r.steamIdB,
        value: r.bondStrength
      }))
    };

    return NextResponse.json(graphData);
  } catch (error) {
    console.error('Error fetching intelligence data:', error);
    return NextResponse.json({ nodes: [], links: [] }, { status: 500 });
  }
}
