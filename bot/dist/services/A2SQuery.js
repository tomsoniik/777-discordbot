"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.A2SQuery = void 0;
const logger_1 = require("../utils/logger");
const gamedig_1 = require("gamedig");
const env_1 = require("../config/env");
class A2SQuery {
    static cache = new Map();
    static CACHE_TTL = 20000; // 20 sekund
    static isPrivateIp(ip) {
        return (ip.startsWith('169.254.') ||
            ip.startsWith('127.') ||
            ip.startsWith('10.') ||
            ip.startsWith('192.168.') ||
            ip.startsWith('172.16.') ||
            ip === '0.0.0.0');
    }
    /**
     * Pobiera stan serwera z bufora lub odpytuje hybrydowo (Steam Web API + GameDig A2S)
     */
    static async getServerStatus(ip, port, serverId) {
        // Parsowanie w przypadku gdy serverId jest w formacie ip:port
        if (serverId && serverId.includes(':')) {
            const parts = serverId.split(':');
            ip = parts[0];
            port = parseInt(parts[1], 10) || 0;
            serverId = undefined;
        }
        // Obsługa gier lokalnych / APIPA / LAN
        if (this.isPrivateIp(ip) && (!serverId || serverId === '0')) {
            return {
                serverName: 'Gra Lokalna / Singleplayer (LAN)',
                map: 'Singleplayer / LAN',
                playersCount: 1,
                maxPlayers: 1,
                players: [],
                ipPort: `${ip}:${port}`,
            };
        }
        const cacheKey = serverId || `${ip}:${port}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }
        // Metoda 1: Steam Master Server Web API (omija blokady Anti-DDoS)
        if (env_1.ENV.STEAM_API_KEY) {
            try {
                let filter = '';
                if (serverId && serverId !== '0') {
                    filter = `\\steamid\\${serverId}`;
                }
                else if (!this.isPrivateIp(ip) && port !== 0) {
                    filter = `\\gameaddr\\${ip}:${port}`;
                }
                if (filter) {
                    const res = await fetch(`https://api.steampowered.com/IGameServersService/GetServerList/v1/?key=${env_1.ENV.STEAM_API_KEY}&filter=${filter}`);
                    const data = await res.json();
                    const server = data.response?.servers?.[0];
                    if (server) {
                        const status = {
                            serverName: server.name || 'Unturned Server',
                            map: server.map || 'Nieznana',
                            playersCount: server.players || 0,
                            maxPlayers: server.max_players || 0,
                            players: [],
                            ipPort: serverId && serverId !== '0' ? serverId : `${ip}:${port}`,
                        };
                        this.cache.set(cacheKey, { data: status, timestamp: Date.now() });
                        return status;
                    }
                }
            }
            catch (e) {
                logger_1.logger.error(e, '[A2SQuery] Błąd Steam Master Server API:');
            }
        }
        // Metoda 2: Bezpośrednie zapytanie A2S UDP GameDig (Fallback)
        if (!this.isPrivateIp(ip) && port !== 0) {
            try {
                const state = await gamedig_1.GameDig.query({
                    type: 'unturned',
                    host: ip,
                    port: port,
                    requestRules: true,
                });
                const status = {
                    serverName: state.name || 'Unturned Server',
                    map: state.map || 'Nieznana',
                    playersCount: state.players.length,
                    maxPlayers: state.maxplayers,
                    players: state.players.map((p) => ({ name: p.name || 'Gracz' })),
                    ipPort: `${ip}:${port}`,
                };
                this.cache.set(cacheKey, { data: status, timestamp: Date.now() });
                return status;
            }
            catch (_e) {
                // Zapora Anti-DDoS lub serwer wyłączony
            }
        }
        return null;
    }
}
exports.A2SQuery = A2SQuery;
