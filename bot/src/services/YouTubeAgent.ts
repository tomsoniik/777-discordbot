import youtubedl from 'youtube-dl-exec';
import ytSearch from 'yt-search';
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
    
    try {
        if (isUrl) {
            // For URL, we can use youtube-dl-exec directly to get title
            const cookieFile = path.join(process.cwd(), 'cookies.txt');
            const options: any = {
                dumpJson: true,
                noWarnings: true,
                f: 'bestaudio/best',
                noPlaylist: true
            };
            if (fs.existsSync(cookieFile)) {
                options.cookies = cookieFile;
            }
            const info: any = await youtubedl(query, options);
            return {
                title: info.title || 'Nieznany utwór',
                url: info.webpage_url || query
            };
        } else {
            // Search using yt-search
            const r = await ytSearch(query);
            const videos = r.videos;
            if (!videos || videos.length === 0) {
                throw new Error('Nic nie znaleziono dla tego zapytania.');
            }
            const top = videos[0];
            return {
                title: top.title,
                url: top.url
            };
        }
    } catch (error: any) {
        const msg = error?.message || String(error);
        console.error('[YouTubeAgent] Błąd wyszukiwania:', msg);
        throw new Error(`Szczegóły: ${msg}`);
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
    const stream = streamProcess.stdout;
    if (!stream) {
        throw new Error('Nie udało się utworzyć strumienia yt-dlp.');
    }

    let errorOutput = '';
    streamProcess.stderr?.on('data', (data) => {
        const msg = data.toString();
        errorOutput += msg;
        if (msg.includes('ERROR') || msg.includes('WARNING')) {
            console.error('[yt-dlp stderr]', msg.trim());
        }
    });

    streamProcess.on('close', (code) => {
        if (code !== 0 && code !== null) {
            console.error(`[YtDlpStream] closed with code ${code}, error: ${errorOutput}`);
            // Force destroy the stream with an error so the AudioPlayer handles it
            const shortError = errorOutput.split('\n').find(l => l.includes('ERROR')) || 'Nieznany błąd';
            stream.destroy(new Error(`yt-dlp error: ${shortError}`));
        }
    });

    streamProcess.on('error', (err) => {
        console.error('[YtDlpStream] process error:', err);
    });

    return stream as Readable;
}

export function reloadYouTubeAgent() {
    initYouTubeAgent();
}
