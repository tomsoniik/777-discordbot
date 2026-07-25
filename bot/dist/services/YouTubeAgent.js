"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getYouTubeAgent = getYouTubeAgent;
exports.reloadYouTubeAgent = reloadYouTubeAgent;
const ytdl_core_1 = __importDefault(require("@distube/ytdl-core"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
let cachedAgent = null;
let agentInitialized = false;
function getYouTubeAgent() {
    if (agentInitialized) {
        return cachedAgent;
    }
    agentInitialized = true;
    // 1. Sprawdź plik cookies.json w głównym katalogu bota
    const cookiesPath = path_1.default.join(process.cwd(), 'cookies.json');
    if (fs_1.default.existsSync(cookiesPath)) {
        try {
            const rawData = fs_1.default.readFileSync(cookiesPath, 'utf8');
            const cookies = JSON.parse(rawData);
            if (Array.isArray(cookies) && cookies.length > 0) {
                console.log('[YouTubeAgent] Wczytano ciasteczka z pliku cookies.json');
                cachedAgent = ytdl_core_1.default.createAgent(cookies);
                return cachedAgent;
            }
        }
        catch (error) {
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
                    cachedAgent = ytdl_core_1.default.createAgent(cookies);
                    return cachedAgent;
                }
            }
            else {
                const cookies = cookieStr.split(';')
                    .map(c => c.trim())
                    .filter(c => c.length > 0)
                    .map(c => {
                    const eqIdx = c.indexOf('=');
                    if (eqIdx === -1)
                        return null;
                    const name = c.substring(0, eqIdx).trim();
                    const value = c.substring(eqIdx + 1).trim();
                    return {
                        name,
                        value,
                        domain: '.youtube.com',
                        path: '/',
                    };
                })
                    .filter((c) => c !== null);
                if (cookies.length > 0) {
                    console.log(`[YouTubeAgent] Wczytano ${cookies.length} ciasteczek z YOUTUBE_COOKIE w .env`);
                    cachedAgent = ytdl_core_1.default.createAgent(cookies);
                    return cachedAgent;
                }
            }
        }
        catch (error) {
            console.error('[YouTubeAgent] Błąd podczas parsowania YOUTUBE_COOKIE:', error);
        }
    }
    console.warn('[YouTubeAgent] Brak ciasteczek YouTube. Jeśli wystąpi błąd "Sign in to confirm you\'re not a bot", dodaj plik cookies.json lub zmienną YOUTUBE_COOKIE w .env.');
    return undefined;
}
function reloadYouTubeAgent() {
    agentInitialized = false;
    cachedAgent = null;
    return getYouTubeAgent();
}
