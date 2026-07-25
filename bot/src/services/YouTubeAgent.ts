import youtubedl from 'youtube-dl-exec';
import ytSearch from 'yt-search';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import https from 'https';

const YT_DLP_PATH = path.join(process.cwd(), 'yt-dlp_linux');

export async function ensureYtDlpBinary() {
    if (process.platform === 'win32') return; // Windows works with default youtube-dl-exec
    
    if (!fs.existsSync(YT_DLP_PATH)) {
        console.log('[YouTubeAgent] Pobieranie samodzielnego pliku binarnego yt-dlp_linux (nie wymaga Pythona)...');
        return new Promise<void>((resolve, reject) => {
            const file = fs.createWriteStream(YT_DLP_PATH);
            https.get('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux', (response) => {
                if (response.statusCode === 302 || response.statusCode === 301) {
                    https.get(response.headers.location!, (res2) => {
                        res2.pipe(file);
                        file.on('finish', () => {
                            file.close();
                            fs.chmodSync(YT_DLP_PATH, 0o755);
                            console.log('[YouTubeAgent] yt-dlp_linux pobrany i gotowy.');
                            resolve();
                        });
                    }).on('error', (err) => {
                        fs.unlink(YT_DLP_PATH, () => reject(err));
                    });
                } else {
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        fs.chmodSync(YT_DLP_PATH, 0o755);
                        console.log('[YouTubeAgent] yt-dlp_linux pobrany i gotowy.');
                        resolve();
                    });
                }
            }).on('error', (err) => {
                fs.unlink(YT_DLP_PATH, () => reject(err));
            });
        });
    }
}

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
    await ensureYtDlpBinary();
    
    const isUrl = query.includes('youtube.com') || query.includes('youtu.be');
    
    try {
        if (isUrl) {
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
            if (process.platform !== 'win32' && fs.existsSync(YT_DLP_PATH)) {
                options.execPath = YT_DLP_PATH;
            }
            const info: any = await youtubedl(query, options);
            return {
                title: info.title || 'Nieznany utwór',
                url: info.webpage_url || query
            };
        } else {
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
    await ensureYtDlpBinary();
    
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
    if (process.platform !== 'win32' && fs.existsSync(YT_DLP_PATH)) {
        options.execPath = YT_DLP_PATH;
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
            const shortError = errorOutput.split('\n').find(l => l.includes('ERROR')) || errorOutput || 'Nieznany błąd';
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
