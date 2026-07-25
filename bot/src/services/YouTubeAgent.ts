import * as ytext from 'youtube-ext';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

let agentInitialized = false;

export function initYouTubeAgent() {
    if (agentInitialized) return;
    agentInitialized = true;

    const cookiesPath = path.join(process.cwd(), 'cookies.json');
    
    if (fs.existsSync(cookiesPath)) {
        try {
            const rawData = fs.readFileSync(cookiesPath, 'utf8');
            const cookies = JSON.parse(rawData);
            if (Array.isArray(cookies) && cookies.length > 0) {
                for (const c of cookies) {
                    if (c.name && c.value) {
                        ytext.cookieJar.cookieMap[c.name] = c.value;
                    }
                }
                console.log('[YouTubeAgent] Wczytano ciasteczka z pliku cookies.json');
                return;
            }
        } catch (error) {
            console.error('[YouTubeAgent] Błąd podczas odczytywania cookies.json:', error);
        }
    }

    if (process.env.YOUTUBE_COOKIE) {
        try {
            const cookieStr = process.env.YOUTUBE_COOKIE.trim();
            if (cookieStr.startsWith('[')) {
                const cookies = JSON.parse(cookieStr);
                for (const c of cookies) {
                    if (c.name && c.value) {
                        ytext.cookieJar.cookieMap[c.name] = c.value;
                    }
                }
                console.log('[YouTubeAgent] Wczytano ciasteczka (JSON) z YOUTUBE_COOKIE');
            } else if (cookieStr.includes('# Netscape') || cookieStr.includes('# HTTP Cookie File')) {
                const lines = cookieStr.split('\n');
                for (const line of lines) {
                    if (line.trim().startsWith('#') || line.trim() === '') continue;
                    const parts = line.split('\t');
                    if (parts.length >= 7) {
                        ytext.cookieJar.cookieMap[parts[5]] = parts[6].trim();
                    }
                }
                console.log(`[YouTubeAgent] Wczytano ciasteczka (Netscape) z YOUTUBE_COOKIE`);
            } else {
                ytext.CookieJar.parseCookieString(cookieStr, ytext.cookieJar.cookieMap);
                console.log(`[YouTubeAgent] Wczytano ciasteczka (String) z YOUTUBE_COOKIE`);
            }
        } catch (error) {
            console.error('[YouTubeAgent] Błąd YOUTUBE_COOKIE:', error);
        }
    }
}

export interface YouTubeVideoInfo {
    title: string;
    url: string;
    streamUrl?: string;
}

export async function getYouTubeInfo(query: string): Promise<YouTubeVideoInfo> {
    initYouTubeAgent();
    const isUrl = query.includes('youtube.com') || query.includes('youtu.be');
    
    if (isUrl) {
        const info = await ytext.videoInfo(query);
        return {
            title: info.title,
            url: info.url,
        };
    } else {
        const search = await ytext.search(query);
        if (search.videos && search.videos.length > 0) {
            const video = search.videos[0];
            return {
                title: video.title,
                url: video.url,
            };
        }
        throw new Error('Nie znaleziono utworu dla tego zapytania.');
    }
}

export async function getYouTubeStream(url: string): Promise<Readable> {
    initYouTubeAgent();
    const stream = await ytext.getReadableStream({ url });
    return stream;
}

export function reloadYouTubeAgent() {
    agentInitialized = false;
    ytext.cookieJar.cookieMap = {};
    initYouTubeAgent();
}
