import youtubedl from 'youtube-dl-exec';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

export function initYouTubeAgent() {
    const cookieFile = path.join(process.cwd(), 'cookies.txt');
    if (process.env.YOUTUBE_COOKIE) {
        fs.writeFileSync(cookieFile, process.env.YOUTUBE_COOKIE);
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
    const targetStr = isUrl ? query : `ytsearch1:${query}`;
    
    const cookieFile = path.join(process.cwd(), 'cookies.txt');
    const options: any = {
        dumpJson: true,
        noWarnings: true,
        f: 'bestaudio/best',
        noPlaylist: true,
        defaultSearch: 'ytsearch'
    };
    if (fs.existsSync(cookieFile)) {
        options.cookies = cookieFile;
    }

    try {
        const info: any = await youtubedl(targetStr, options);
        return {
            title: info.title || 'Nieznany utwór',
            url: info.webpage_url || (isUrl ? query : info.url)
        };
    } catch (error: any) {
        console.error('[YouTubeAgent] Błąd wyszukiwania youtube-dl-exec:', error.message || error);
        throw new Error('Nie znaleziono utworu lub wystąpił błąd pobierania danych (możliwy błąd 429). Spróbuj ponownie za chwilę.');
    }
}

export async function getYouTubeStream(url: string): Promise<Readable> {
    initYouTubeAgent();
    const cookieFile = path.join(process.cwd(), 'cookies.txt');
    const options: any = {
        f: 'bestaudio/best',
        o: '-',
        quiet: true,
        noWarnings: true,
        noPlaylist: true
    };
    if (fs.existsSync(cookieFile)) {
        options.cookies = cookieFile;
    }

    const streamProcess = youtubedl.exec(url, options);
    
    streamProcess.stderr?.on('data', (data) => {
        const msg = data.toString();
        if (msg.includes('ERROR') || msg.includes('WARNING')) {
            console.error('[yt-dlp stderr]', msg.trim());
        }
    });

    streamProcess.on('error', (err) => {
        console.error('[YtDlpStream] error:', err);
    });

    return streamProcess.stdout as Readable;
}

export function reloadYouTubeAgent() {
    initYouTubeAgent();
}
