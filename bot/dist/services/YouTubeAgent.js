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
    const targetStr = isUrl ? query : `ytsearch1:${query}`;
    const cookieFile = path_1.default.join(process.cwd(), 'cookies.txt');
    const options = {
        dumpJson: true,
        noWarnings: true,
        f: 'bestaudio/best',
        noPlaylist: true,
        defaultSearch: 'ytsearch'
    };
    if (fs_1.default.existsSync(cookieFile)) {
        options.cookies = cookieFile;
    }
    try {
        const info = await (0, youtube_dl_exec_1.default)(targetStr, options);
        return {
            title: info.title || 'Nieznany utwór',
            url: info.webpage_url || (isUrl ? query : info.url)
        };
    }
    catch (error) {
        console.error('[YouTubeAgent] Błąd wyszukiwania youtube-dl-exec:', error.message || error);
        throw new Error('Nie znaleziono utworu lub wystąpił błąd pobierania danych (możliwy błąd 429). Spróbuj ponownie za chwilę.');
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
    streamProcess.stderr?.on('data', (data) => {
        const msg = data.toString();
        if (msg.includes('ERROR') || msg.includes('WARNING')) {
            console.error('[yt-dlp stderr]', msg.trim());
        }
    });
    streamProcess.on('error', (err) => {
        console.error('[YtDlpStream] error:', err);
    });
    return streamProcess.stdout;
}
function reloadYouTubeAgent() {
    initYouTubeAgent();
}
