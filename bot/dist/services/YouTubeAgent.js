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
const https_1 = __importDefault(require("https"));
const YT_DLP_PATH = path_1.default.join(process.cwd(), 'yt-dlp_linux');
async function ensureYtDlpBinary() {
    if (process.platform === 'win32')
        return; // Windows works with default youtube-dl-exec
    if (!fs_1.default.existsSync(YT_DLP_PATH)) {
        console.log('[YouTubeAgent] Pobieranie samodzielnego pliku binarnego yt-dlp_linux (nie wymaga Pythona)...');
        return new Promise((resolve, reject) => {
            const file = fs_1.default.createWriteStream(YT_DLP_PATH);
            https_1.default.get('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux', (response) => {
                if (response.statusCode === 302 || response.statusCode === 301) {
                    https_1.default.get(response.headers.location, (res2) => {
                        res2.pipe(file);
                        file.on('finish', () => {
                            file.close();
                            fs_1.default.chmodSync(YT_DLP_PATH, 0o755);
                            console.log('[YouTubeAgent] yt-dlp_linux pobrany i gotowy.');
                            resolve();
                        });
                    }).on('error', (err) => {
                        fs_1.default.unlink(YT_DLP_PATH, () => reject(err));
                    });
                }
                else {
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        fs_1.default.chmodSync(YT_DLP_PATH, 0o755);
                        console.log('[YouTubeAgent] yt-dlp_linux pobrany i gotowy.');
                        resolve();
                    });
                }
            }).on('error', (err) => {
                fs_1.default.unlink(YT_DLP_PATH, () => reject(err));
            });
        });
    }
}
function initYouTubeAgent() {
    const cookieFile = path_1.default.join(process.cwd(), 'cookies.txt');
    if (process.env.YOUTUBE_COOKIE) {
        fs_1.default.writeFileSync(cookieFile, process.env.YOUTUBE_COOKIE);
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
            if (process.platform !== 'win32' && fs_1.default.existsSync(YT_DLP_PATH)) {
                options.execPath = YT_DLP_PATH;
            }
            const info = await (0, youtube_dl_exec_1.default)(query, options);
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
    if (process.platform !== 'win32' && fs_1.default.existsSync(YT_DLP_PATH)) {
        options.execPath = YT_DLP_PATH;
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
