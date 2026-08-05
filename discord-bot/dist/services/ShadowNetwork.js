"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShadowNetwork = void 0;
const logger_1 = require("../utils/logger");
const db_1 = require("../utils/db");
const env_1 = require("../config/env");
class ShadowNetwork {
    /**
     * Rejestruje wspólne spotkanie dwóch graczy (np. na tym samym serwerze lub w lobby).
     * Wzmacnia ich powiązanie (bondStrength).
     */
    static async recordEncounter(steamId1, steamId2, serverIp) {
        if (steamId1 === steamId2)
            return;
        // Sortujemy alfabetycznie, żeby uniknąć duplikatów (A-B to to samo co B-A)
        const [a, b] = [steamId1, steamId2].sort();
        try {
            await db_1.prisma.playerNode.upsert({
                where: { steamId: a },
                update: { lastSeenAt: new Date() },
                create: { steamId: a },
            });
            await db_1.prisma.playerNode.upsert({
                where: { steamId: b },
                update: { lastSeenAt: new Date() },
                create: { steamId: b },
            });
            await db_1.prisma.sessionEncounter.create({
                data: { targetId: a, bystanderId: b, serverIp },
            });
            await db_1.prisma.playerRelation.upsert({
                where: { steamIdA_steamIdB: { steamIdA: a, steamIdB: b } },
                update: { bondStrength: { increment: 1 }, lastSeenTgt: new Date() },
                create: { steamIdA: a, steamIdB: b, bondStrength: 1 },
            });
            logger_1.logger.info(`[ShadowNetwork] Powiązano graczy: ${a} <-> ${b} (Serwer: ${serverIp})`);
        }
        catch (e) {
            logger_1.logger.error(e, '[ShadowNetwork] Błąd zapisu powiązania:');
        }
    }
    /**
     * Buduje podstawową siatkę znajomych dla gracza. Bezpieczne dla profili prywatnych!
     */
    static async scrapeFriends(steamId) {
        const apiKey = env_1.ENV.STEAM_API_KEY;
        if (!apiKey)
            return;
        try {
            await db_1.prisma.playerNode.upsert({
                where: { steamId },
                update: { lastSeenAt: new Date() },
                create: { steamId },
            });
            const res = await fetch(`https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=${apiKey}&steamid=${steamId}&relationship=friend`);
            // Jeśli profil lub lista znajomych są prywatne (HTTP 401 / 403), przerywamy bezpiecznie bez błędu
            if (!res.ok)
                return;
            const data = await res.json();
            if (data.friendslist && Array.isArray(data.friendslist.friends)) {
                const friends = data.friendslist.friends;
                let addedCount = 0;
                for (const f of friends) {
                    const friendId = f.steamid;
                    if (!friendId)
                        continue;
                    const [a, b] = [steamId, friendId].sort();
                    await db_1.prisma.playerNode.upsert({
                        where: { steamId: friendId },
                        update: {},
                        create: { steamId: friendId },
                    });
                    await db_1.prisma.playerRelation.upsert({
                        where: { steamIdA_steamIdB: { steamIdA: a, steamIdB: b } },
                        update: {},
                        create: { steamIdA: a, steamIdB: b, bondStrength: 5 },
                    });
                    addedCount++;
                }
                if (addedCount > 0) {
                    // Pomijamy ciągłe logowanie, żeby nie spamować konsoli
                    // logger.info(`[ShadowNetwork] Zbudowano siatkę znajomych dla ${steamId} (${addedCount} powiązań).`);
                }
            }
        }
        catch (_e) {
            // Ochrona przed awarią - profil prywatny lub brak dostępu
        }
    }
}
exports.ShadowNetwork = ShadowNetwork;
