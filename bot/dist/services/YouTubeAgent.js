"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getYouTubeAgent = getYouTubeAgent;
exports.getYtDlpInfo = getYtDlpInfo;
exports.getYtDlpStreamUrl = getYtDlpStreamUrl;
exports.getYtDlpStream = getYtDlpStream;
exports.reloadYouTubeAgent = reloadYouTubeAgent;
const ytdl_core_1 = __importDefault(require("@distube/ytdl-core"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
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
    // 2. Sprawdź zmienną środowiskową YOUTUBE_COOKIE w .env / Railway Variables
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
            else if (cookieStr.includes('# Netscape') || cookieStr.includes('# HTTP Cookie File')) {
                const lines = cookieStr.split('\n');
                const cookies = [];
                for (const line of lines) {
                    if (line.trim().startsWith('#') || line.trim() === '')
                        continue;
                    const parts = line.split('\t');
                    if (parts.length >= 7) {
                        cookies.push({
                            domain: parts[0],
                            path: parts[2],
                            secure: parts[3] === 'TRUE',
                            expirationDate: parseInt(parts[4], 10),
                            name: parts[5],
                            value: parts[6].trim()
                        });
                    }
                }
                if (cookies.length > 0) {
                    console.log(`[YouTubeAgent] Wczytano ${cookies.length} ciasteczek w formacie Netscape z YOUTUBE_COOKIE`);
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
                    console.log(`[YouTubeAgent] Wczytano ${cookies.length} ciasteczek z YOUTUBE_COOKIE w .env / Railway`);
                    cachedAgent = ytdl_core_1.default.createAgent(cookies);
                    return cachedAgent;
                }
            }
        }
        catch (error) {
            console.error('[YouTubeAgent] Błąd podczas parsowania YOUTUBE_COOKIE:', error);
        }
    }
    return undefined;
}
function getYtDlpInfo(query) {
    return new Promise((resolve, reject) => {
        const isWin = process.platform === 'win32';
        const binName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
        const localBin = path_1.default.join(process.cwd(), 'node_modules', '@distube', 'yt-dlp', 'bin', binName);
        let binToUse = 'yt-dlp';
        if (fs_1.default.existsSync(localBin)) {
            binToUse = localBin;
            if (!isWin) {
                try {
                    fs_1.default.chmodSync(localBin, '755');
                }
                catch (e) { }
            }
        }
        else {
            const altBin = path_1.default.join(process.cwd(), 'node_modules', '@distube', 'yt-dlp', 'bin', isWin ? 'yt-dlp' : 'yt-dlp.exe');
            if (fs_1.default.existsSync(altBin)) {
                binToUse = altBin;
                if (!isWin) {
                    try {
                        fs_1.default.chmodSync(altBin, '755');
                    }
                    catch (e) { }
                }
            }
        }
        const isUrl = query.includes('youtube.com') || query.includes('youtu.be');
        const targetStr = isUrl ? query : `ytsearch1:${query}`;
        const args = ['-j', '--no-warnings', '--no-playlist', '-f', 'bestaudio/best', targetStr];
        const cookieFile = path_1.default.join(process.cwd(), 'cookies.txt');
        if (process.env.YOUTUBE_COOKIE) {
            fs_1.default.writeFileSync(cookieFile, process.env.YOUTUBE_COOKIE);
        }
        if (fs_1.default.existsSync(cookieFile)) {
            args.push('--cookies', cookieFile);
        }
        (0, child_process_1.execFile)(binToUse, args, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
            if (error) {
                console.error('[YtDlpInfo] Błąd pobierania informacji:', error, stderr);
                return reject(error);
            }
            try {
                const json = JSON.parse(stdout.trim().split('\n')[0]);
                let streamUrl = json.url;
                if (!streamUrl && json.formats && Array.isArray(json.formats)) {
                    const audioFormat = json.formats.filter((f) => f.acodec !== 'none' && f.vcodec === 'none').pop()
                        || json.formats.filter((f) => f.url).pop();
                    if (audioFormat)
                        streamUrl = audioFormat.url;
                }
                resolve({
                    title: json.title || 'Nieznany utwór',
                    url: json.webpage_url || query,
                    streamUrl: streamUrl,
                });
            }
            catch (parseErr) {
                reject(new Error('Nie udało się przetworzyć danych utworu z yt-dlp'));
            }
        });
    });
}
function getYtDlpStreamUrl(url) {
    return new Promise((resolve, reject) => {
        const isWin = process.platform === 'win32';
        const binName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
        const localBin = path_1.default.join(process.cwd(), 'node_modules', '@distube', 'yt-dlp', 'bin', binName);
        let binToUse = 'yt-dlp';
        if (fs_1.default.existsSync(localBin)) {
            binToUse = localBin;
            if (!isWin) {
                try {
                    fs_1.default.chmodSync(localBin, '755');
                }
                catch (e) { }
            }
        }
        else {
            const altBin = path_1.default.join(process.cwd(), 'node_modules', '@distube', 'yt-dlp', 'bin', isWin ? 'yt-dlp' : 'yt-dlp.exe');
            if (fs_1.default.existsSync(altBin)) {
                binToUse = altBin;
                if (!isWin) {
                    try {
                        fs_1.default.chmodSync(altBin, '755');
                    }
                    catch (e) { }
                }
            }
        }
        const args = ['-g', '-f', 'bestaudio/best', url];
        const cookieFile = path_1.default.join(process.cwd(), 'cookies.txt');
        if (process.env.YOUTUBE_COOKIE) {
            fs_1.default.writeFileSync(cookieFile, process.env.YOUTUBE_COOKIE);
        }
        if (fs_1.default.existsSync(cookieFile)) {
            args.push('--cookies', cookieFile);
        }
        (0, child_process_1.execFile)(binToUse, args, (error, stdout, stderr) => {
            if (error) {
                console.error('[YtDlp] Błąd pobierania linku ze strumienia:', error, stderr);
                return reject(error);
            }
            const streamUrl = stdout.trim().split('\n')[0];
            if (streamUrl && streamUrl.startsWith('http')) {
                resolve(streamUrl);
            }
            else {
                reject(new Error('Nie odnaleziono prawidłowego adresu URL strumienia z yt-dlp'));
            }
        });
    });
}
function getYtDlpStream(url) {
    const isWin = process.platform === 'win32';
    const binName = isWin ? 'yt-dlp.exe' : 'yt-dlp';
    const localBin = path_1.default.join(process.cwd(), 'node_modules', '@distube', 'yt-dlp', 'bin', binName);
    let binToUse = 'yt-dlp';
    if (fs_1.default.existsSync(localBin)) {
        binToUse = localBin;
    }
    else {
        const altBin = path_1.default.join(process.cwd(), 'node_modules', '@distube', 'yt-dlp', 'bin', isWin ? 'yt-dlp' : 'yt-dlp.exe');
        if (fs_1.default.existsSync(altBin)) {
            binToUse = altBin;
        }
    }
    const args = ['-f', 'bestaudio/best', '--no-playlist', '-o', '-', url];
    const cookieFile = path_1.default.join(process.cwd(), 'cookies.txt');
    if (process.env.YOUTUBE_COOKIE) {
        fs_1.default.writeFileSync(cookieFile, process.env.YOUTUBE_COOKIE);
    }
    if (fs_1.default.existsSync(cookieFile)) {
        args.push('--cookies', cookieFile);
    }
    const child = (0, child_process_1.spawn)(binToUse, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    child.stderr.on('data', (data) => {
        console.error('[YtDlpStream] stderr:', data.toString());
    });
    child.on('error', (err) => {
        console.error('[YtDlpStream] error:', err);
    });
    return child.stdout;
}
function reloadYouTubeAgent() {
    agentInitialized = false;
    cachedAgent = null;
    return getYouTubeAgent();
}
