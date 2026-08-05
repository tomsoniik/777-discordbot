"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./utils/logger");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function fixData() {
    const tracked = await prisma.trackedPlayer.findMany();
    for (const t of tracked) {
        await prisma.playerNode.upsert({ where: { steamId: t.steamId }, update: {}, create: { steamId: t.steamId } });
        logger_1.logger.info('Added missing PlayerNode for ' + t.steamId);
    }
}
fixData();
