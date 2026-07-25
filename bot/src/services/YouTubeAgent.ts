import ytdl from '@distube/ytdl-core';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';

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

    // 2. Sprawdź zmienną środowiskową YOUTUBE_COOKIE w .env / Railway Variables
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
                    console.log(`[YouTubeAgent] Wczytano ${cookies.length} ciasteczek z YOUTUBE_COOKIE w .env / Railway`);
                    cachedAgent = ytdl.createAgent(cookies);
                    return cachedAgent;
                }
            }
        } catch (error) {
            console.error('[YouTubeAgent] Błąd podczas parsowania YOUTUBE_COOKIE:', error);
        }
    }

    return undefined;
}

export interface YtDlpVideoInfo {
    title: string;
    url: string;
}

export function getYtDlpInfo(query: string): Promise<YtDlpVideoInfo> {
    return new Promise((resolve, reject) => {
        const isWin = process.platform === 'win32';
        const binName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
        const localBin = path.join(process.cwd(), 'node_modules', '@distube', 'yt-dlp', 'bin', binName);
        
        let binToUse = 'yt-dlp';
        if (fs.existsSync(localBin)) {
            binToUse = localBin;
        } else {
            const altBin = path.join(process.cwd(), 'node_modules', '@distube', 'yt-dlp', 'bin', isWin ? 'yt-dlp' : 'yt-dlp.exe');
            if (fs.existsSync(altBin)) {
                binToUse = altBin;
            }
        }

        const isUrl = query.includes('youtube.com') || query.includes('youtu.be');
        const targetStr = isUrl ? query : `ytsearch1:${query}`;

        const args = ['-j', '--no-warnings', targetStr];

        if (process.env.YOUTUBE_COOKIE) {
            args.push('--add-header', `Cookie:${process.env.YOUTUBE_COOKIE}`);
        }

        execFile(binToUse, args, (error, stdout, stderr) => {
            if (error) {
                console.error('[YtDlpInfo] Błąd pobierania informacji:', error, stderr);
                return reject(error);
            }
            try {
                const json = JSON.parse(stdout.trim().split('\n')[0]);
                resolve({
                    title: json.title || 'Nieznany utwór',
                    url: json.webpage_url || json.url || query,
                });
            } catch (parseErr) {
                reject(new Error('Nie udało się przetworzyć danych utworu z yt-dlp'));
            }
        });
    });
}

export function getYtDlpStreamUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const isWin = process.platform === 'win32';
        const binName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
        const localBin = path.join(process.cwd(), 'node_modules', '@distube', 'yt-dlp', 'bin', binName);
        
        let binToUse = 'yt-dlp';
        if (fs.existsSync(localBin)) {
            binToUse = localBin;
        } else {
            const altBin = path.join(process.cwd(), 'node_modules', '@distube', 'yt-dlp', 'bin', isWin ? 'yt-dlp' : 'yt-dlp.exe');
            if (fs.existsSync(altBin)) {
                binToUse = altBin;
            }
        }

        const args = ['-g', '-f', 'bestaudio/best', url];

        if (process.env.YOUTUBE_COOKIE) {
            args.push('--add-header', `Cookie:${process.env.YOUTUBE_COOKIE}`);
        }

        execFile(binToUse, args, (error, stdout, stderr) => {
            if (error) {
                console.error('[YtDlp] Błąd pobierania linku ze strumienia:', error, stderr);
                return reject(error);
            }
            const streamUrl = stdout.trim().split('\n')[0];
            if (streamUrl && streamUrl.startsWith('http')) {
                resolve(streamUrl);
            } else {
                reject(new Error('Nie odnaleziono prawidłowego adresu URL strumienia z yt-dlp'));
            }
        });
    });
}

export function reloadYouTubeAgent(): any {
    agentInitialized = false;
    cachedAgent = null;
    return getYouTubeAgent();
}
