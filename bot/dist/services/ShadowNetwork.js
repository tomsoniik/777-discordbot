"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShadowNetwork = void 0;
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
            // 1. Zapewnij istnienie węzłów graczy
            await db_1.prisma.playerNode.upsert({ where: { steamId: a }, update: { lastSeenAt: new Date() }, create: { steamId: a } });
            await db_1.prisma.playerNode.upsert({ where: { steamId: b }, update: { lastSeenAt: new Date() }, create: { steamId: b } });
            // 2. Zapisz incydent w logach (Encounters)
            await db_1.prisma.sessionEncounter.create({
                data: { targetId: a, bystanderId: b, serverIp }
            });
            // 3. Wzmocnij wiązanie (bond)
            await db_1.prisma.playerRelation.upsert({
                where: { steamIdA_steamIdB: { steamIdA: a, steamIdB: b } },
                update: { bondStrength: { increment: 1 }, lastSeenTgt: new Date() },
                create: { steamIdA: a, steamIdB: b, bondStrength: 1 }
            });
            console.log(`[ShadowNetwork] Powiązano graczy: ${a} <-> ${b} (Serwer: ${serverIp})`);
        }
        catch (e) {
            console.error('[ShadowNetwork] Błąd zapisu powiązania:', e);
        }
    }
    /**
     * Buduje podstawową siatkę znajomych dla gracza, jeśli jego profil jest publiczny.
     */
    static async scrapeFriends(steamId) {
        const apiKey = env_1.ENV.STEAM_API_KEY;
        if (!apiKey)
            return;
        try {
            // Zawsze utwórz główny węzeł dla śledzonego gracza, nawet jeśli profil jest prywatny
            await db_1.prisma.playerNode.upsert({ where: { steamId }, update: { lastSeenAt: new Date() }, create: { steamId } });
            const res = await fetch(`https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=${apiKey}&steamid=${steamId}&relationship=friend`);
            const data = await res.json();
            if (data.friendslist && data.friendslist.friends) {
                const friends = data.friendslist.friends;
                let addedCount = 0;
                for (const f of friends) {
                    const friendId = f.steamid;
                    const [a, b] = [steamId, friendId].sort();
                    await db_1.prisma.playerNode.upsert({ where: { steamId: friendId }, update: {}, create: { steamId: friendId } });
                    // Jeśli są znajomymi, dajemy im bazową "siłę" = 5
                    await db_1.prisma.playerRelation.upsert({
                        where: { steamIdA_steamIdB: { steamIdA: a, steamIdB: b } },
                        update: {},
                        create: { steamIdA: a, steamIdB: b, bondStrength: 5 }
                    });
                    addedCount++;
                }
                console.log(`[ShadowNetwork] Zbudowano siatkę znajomych dla ${steamId} (${addedCount} nowych powiązań).`);
            }
        }
        catch (e) {
            // Prawdopodobnie profil prywatny lub ukryta lista znajomych - ignorujemy
        }
    }
}
exports.ShadowNetwork = ShadowNetwork;
