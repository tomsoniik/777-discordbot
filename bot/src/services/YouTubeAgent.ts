import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';

let cachedAgent: any = null;
let agentInitialized = false;

export function getYouTubeAgent(): any {
    if (agentInitialized) {
        return cachedAgent;
    }

    agentInitialized = true;

    // 1. Sprawdź plik cookies.json w głównym katalogu bota
    const cookiesPath = path.join(process.cwd(), 'cookies.json');
    if (fs.existsSync(cookiesPath)) {
        try {
            const rawData = fs.readFileSync(cookiesPath, 'utf8');
            const cookies = JSON.parse(rawData);
            if (Array.isArray(cookies) && cookies.length > 0) {
                console.log('[YouTubeAgent] Wczytano ciasteczka z pliku cookies.json');
                cachedAgent = ytdl.createAgent(cookies);
                return cachedAgent;
            }
        } catch (error) {
            console.error('[YouTubeAgent] Błąd podczas odczytywania cookies.json:', error);
        }
    }

    // 2. Sprawdź zmienną środowiskową YOUTUBE_COOKIE w .env
    if (process.env.YOUTUBE_COOKIE) {
        try {
            const cookieStr = process.env.YOUTUBE_COOKIE.trim();
            if (cookieStr.startsWith('[')) {
                const cookies = JSON.parse(cookieStr);
                if (Array.isArray(cookies) && cookies.length > 0) {
                    console.log('[YouTubeAgent] Wczytano ciasteczka (JSON) z YOUTUBE_COOKIE');
                    cachedAgent = ytdl.createAgent(cookies);
                    return cachedAgent;
                }
            } else {
                const cookies = cookieStr.split(';')
                    .map(c => c.trim())
                    .filter(c => c.length > 0)
                    .map(c => {
                        const eqIdx = c.indexOf('=');
                        if (eqIdx === -1) return null;
                        const name = c.substring(0, eqIdx).trim();
                        const value = c.substring(eqIdx + 1).trim();
                        return {
                            name,
                            value,
                            domain: '.youtube.com',
                            path: '/',
                        };
                    })
                    .filter((c): c is { name: string; value: string; domain: string; path: string } => c !== null);

                if (cookies.length > 0) {
                    console.log(`[YouTubeAgent] Wczytano ${cookies.length} ciasteczek z YOUTUBE_COOKIE w .env`);
                    cachedAgent = ytdl.createAgent(cookies);
                    return cachedAgent;
                }
            }
        } catch (error) {
            console.error('[YouTubeAgent] Błąd podczas parsowania YOUTUBE_COOKIE:', error);
        }
    }

    console.warn('[YouTubeAgent] Brak ciasteczek YouTube. Jeśli wystąpi błąd "Sign in to confirm you\'re not a bot", dodaj plik cookies.json lub zmienną YOUTUBE_COOKIE w .env.');
    return undefined;
}

export function reloadYouTubeAgent(): any {
    agentInitialized = false;
    cachedAgent = null;
    return getYouTubeAgent();
}
