"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initYouTubeAgent = initYouTubeAgent;
exports.getYouTubeInfo = getYouTubeInfo;
exports.getYouTubeStream = getYouTubeStream;
exports.reloadYouTubeAgent = reloadYouTubeAgent;
const youtube_dl_exec_1 = __importDefault(require("youtube-dl-exec"));
const yt_search_1 = __importDefault(require("yt-search"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function initYouTubeAgent() {
    const cookieFile = path_1.default.join(process.cwd(), 'cookies.txt');
    if (process.env.YOUTUBE_COOKIE) {
        fs_1.default.writeFileSync(cookieFile, process.env.YOUTUBE_COOKIE);
    }
}
async function getYouTubeInfo(query) {
    initYouTubeAgent();
    const isUrl = query.includes('youtube.com') || query.includes('youtu.be');
    try {
        if (isUrl) {
            // For URL, we can use youtube-dl-exec directly to get title
            const cookieFile = path_1.default.join(process.cwd(), 'cookies.txt');
            const options = {
                dumpJson: true,
                noWarnings: true,
                f: 'bestaudio/best',
                noPlaylist: true
            };
            if (fs_1.default.existsSync(cookieFile)) {
                options.cookies = cookieFile;
            }
            const info = await (0, youtube_dl_exec_1.default)(query, options);
            return {
                title: info.title || 'Nieznany utwór',
                url: info.webpage_url || query
            };
        }
        else {
            // Search using yt-search
            const r = await (0, yt_search_1.default)(query);
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
    }
    catch (error) {
        const msg = error?.message || String(error);
        console.error('[YouTubeAgent] Błąd wyszukiwania:', msg);
        throw new Error(`Szczegóły: ${msg}`);
    }
}
async function getYouTubeStream(url) {
    initYouTubeAgent();
    const cookieFile = path_1.default.join(process.cwd(), 'cookies.txt');
    const options = {
        f: 'bestaudio/best',
        o: '-',
        quiet: true,
        noWarnings: true,
        noPlaylist: true
    };
    if (fs_1.default.existsSync(cookieFile)) {
        options.cookies = cookieFile;
    }
    const streamProcess = youtube_dl_exec_1.default.exec(url, options);
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
    return stream;
}
function reloadYouTubeAgent() {
    initYouTubeAgent();
}
