"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureYtDlpBinary = ensureYtDlpBinary;
exports.initYouTubeAgent = initYouTubeAgent;
exports.getYouTubeInfo = getYouTubeInfo;
exports.getYouTubeStream = getYouTubeStream;
exports.reloadYouTubeAgent = reloadYouTubeAgent;
const youtube_dl_exec_1 = __importDefault(require("youtube-dl-exec"));
const yt_search_1 = __importDefault(require("yt-search"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const YT_DLP_PATH = path_1.default.join(process.cwd(), 'yt-dlp_linux');
async function ensureYtDlpBinary() {
    if (process.platform === 'win32')
        return; // Windows works with default youtube-dl-exec
    if (!fs_1.default.existsSync(YT_DLP_PATH) || fs_1.default.statSync(YT_DLP_PATH).size === 0) {
        console.log('[YouTubeAgent] Pobieranie samodzielnego pliku binarnego yt-dlp_linux (nie wymaga Pythona)...');
        try {
            const response = await fetch('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux');
            if (!response.ok)
                throw new Error(`HTTP ${response.status} ${response.statusText}`);
            const buffer = await response.arrayBuffer();
            fs_1.default.writeFileSync(YT_DLP_PATH, Buffer.from(buffer));
            fs_1.default.chmodSync(YT_DLP_PATH, 0o755);
            console.log(`[YouTubeAgent] yt-dlp_linux pobrany pomyślnie. Rozmiar: ${buffer.byteLength} bajtów.`);
        }
        catch (err) {
            console.error('[YouTubeAgent] Błąd pobierania yt-dlp_linux:', err.message);
        }
    }
}
function initYouTubeAgent() {
    const cookieFile = path_1.default.join(process.cwd(), 'cookies.txt');
    if (process.env.YOUTUBE_COOKIE) {
        const raw = process.env.YOUTUBE_COOKIE.trim();
        if (raw.includes('# Netscape HTTP Cookie File')) {
            fs_1.default.writeFileSync(cookieFile, raw);
        }
        else {
            let netscape = "# Netscape HTTP Cookie File\n";
            const pairs = raw.split(';').map(c => c.trim()).filter(Boolean);
            for (const pair of pairs) {
                const [key, ...rest] = pair.split('=');
                const value = rest.join('=');
                if (key && value) {
                    netscape += `.youtube.com\tTRUE\t/\tTRUE\t2147483647\t${key}\t${value}\n`;
                }
            }
            fs_1.default.writeFileSync(cookieFile, netscape);
        }
    }
}
async function getYouTubeInfo(query) {
    initYouTubeAgent();
    await ensureYtDlpBinary();
    const isUrl = query.includes('youtube.com') || query.includes('youtu.be');
    try {
        if (isUrl) {
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
            let ytdlInstance = youtube_dl_exec_1.default;
            if (process.platform !== 'win32' && fs_1.default.existsSync(YT_DLP_PATH)) {
                ytdlInstance = youtube_dl_exec_1.default.create(YT_DLP_PATH);
            }
            const info = await ytdlInstance(query, options);
            return {
                title: info.title || 'Nieznany utwór',
                url: info.webpage_url || query
            };
        }
        else {
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
    await ensureYtDlpBinary();
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
    let ytdlInstance = youtube_dl_exec_1.default;
    if (process.platform !== 'win32' && fs_1.default.existsSync(YT_DLP_PATH)) {
        ytdlInstance = youtube_dl_exec_1.default.create(YT_DLP_PATH);
    }
    const streamProcess = ytdlInstance.exec(url, options);
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
    return stream;
}
function reloadYouTubeAgent() {
    initYouTubeAgent();
}
