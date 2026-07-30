import { logger } from './utils/logger';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function fixData() {
    const tracked = await prisma.trackedPlayer.findMany();
    for (const t of tracked) {
        await prisma.playerNode.upsert({ where: { steamId: t.steamId }, update: {}, create: { steamId: t.steamId } });
        logger.info('Added missing PlayerNode for ' + t.steamId);
    }
}
fixData();
