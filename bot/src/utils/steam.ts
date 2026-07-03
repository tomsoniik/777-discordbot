import { ENV } from '../config/env';

export async function resolveSteamId(rawInput: string): Promise<string | null> {
    const apiKey = ENV.STEAM_API_KEY;
    if (!apiKey) return null;

    let input = rawInput.trim();
    
    const match64 = input.match(/(7656119[0-9]{10})/);
    if (match64) return match64[0];

    let vanity = input;
    const matchId = input.match(/\/id\/([^\/\?]+)/);
    if (matchId) {
        vanity = matchId[1];
    } else {
        const parts = input.split('/').filter(p => p.length > 0);
        vanity = parts[parts.length - 1]; 
    }

    try {
        const res = await fetch(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${apiKey}&vanityurl=${vanity}`);
        const data: any = await res.json();
        if (data.response && data.response.success === 1) {
            return data.response.steamid;
        }
    } catch (e) {
        console.error('Błąd ResolveVanityURL:', e);
    }
    
    return null;
}
