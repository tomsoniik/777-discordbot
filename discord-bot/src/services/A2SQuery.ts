import { logger } from '../utils/logger';
import { GameDig } from 'gamedig';
import { ENV } from '../config/env';

export interface ServerStatus {
    serverName: string;
    map: string;
    playersCount: number;
    maxPlayers: number;
    players: Array<{ name: string; raw?: any }>;
    ipPort: string;
}

export class A2SQuery {
    private static cache = new Map<string, { data: ServerStatus; timestamp: number }>();
    private static CACHE_TTL = 15000; // 15 sekund

    public static isLoopbackIp(ip: string): boolean {
        return ip === '127.0.0.1' || ip === '0.0.0.0' || ip === 'localhost';
    }

    /**
     * Pobiera stan serwera z bufora lub odpytuje hybrydowo (Steam Web API + GameDig A2S)
     */
    public static async getServerStatus(ip: string, port: number, serverId?: string): Promise<ServerStatus | null> {
        // Parsowanie w przypadku gdy serverId jest w formacie ip:port
        if (serverId && serverId.includes(':')) {
            const parts = serverId.split(':');
            ip = parts[0];
            port = parseInt(parts[1], 10) || 0;
            serverId = undefined;
        }

        // Obsługa gier wyłącznie lokalnych / Loopback bez ID serwera
        if (this.isLoopbackIp(ip) && (!serverId || serverId === '0')) {
            return {
                serverName: 'Gra Lokalna / Singleplayer',
                map: 'Singleplayer',
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
        if (ENV.STEAM_API_KEY) {
            try {
                let filter = '';
                if (serverId && serverId !== '0') {
                    filter = `\\steamid\\${serverId}`;
                } else if (ip && !this.isLoopbackIp(ip) && !ip.startsWith('169.254.') && port !== 0) {
                    filter = `\\gameaddr\\${ip}:${port}`;
                }

                if (filter) {
                    const res = await fetch(
                        `https://api.steampowered.com/IGameServersService/GetServerList/v1/?key=${ENV.STEAM_API_KEY}&filter=${filter}`,
                    );
                    if (!res.ok) {
                        throw new Error(`Steam API responded with status ${res.status}`);
                    }
                    const data: any = await res.json();
                    const server = data.response?.servers?.[0];

                    if (server) {
                        const status: ServerStatus = {
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
            } catch (e) {
                logger.error(e as Error, '[A2SQuery] Błąd Steam Master Server API:');
            }
        }

        // Metoda 2: Bezpośrednie zapytanie A2S UDP GameDig (Fallback dla publicznych IP)
        if (!this.isLoopbackIp(ip) && !ip.startsWith('169.254.') && port !== 0) {
            try {
                const state = await GameDig.query({
                    type: 'unturned',
                    host: ip,
                    port: port,
                    requestRules: true,
                });

                const status: ServerStatus = {
                    serverName: state.name || 'Unturned Server',
                    map: state.map || 'Nieznana',
                    playersCount: state.players.length,
                    maxPlayers: state.maxplayers,
                    players: state.players.map((p) => ({ name: p.name || 'Gracz' })),
                    ipPort: `${ip}:${port}`,
                };

                this.cache.set(cacheKey, { data: status, timestamp: Date.now() });
                return status;
            } catch (_e) {
                // Zapora Anti-DDoS lub serwer wyłączony
            }
        }

        return null;
    }
}
