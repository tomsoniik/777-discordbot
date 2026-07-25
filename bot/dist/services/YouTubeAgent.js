"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initYouTubeAgent = initYouTubeAgent;
exports.getYouTubeInfo = getYouTubeInfo;
exports.getYouTubeStream = getYouTubeStream;
exports.reloadYouTubeAgent = reloadYouTubeAgent;
const ytext = __importStar(require("youtube-ext"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
let agentInitialized = false;
function initYouTubeAgent() {
    if (agentInitialized)
        return;
    agentInitialized = true;
    const cookiesPath = path_1.default.join(process.cwd(), 'cookies.json');
    if (fs_1.default.existsSync(cookiesPath)) {
        try {
            const rawData = fs_1.default.readFileSync(cookiesPath, 'utf8');
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
        }
        catch (error) {
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
            }
            else if (cookieStr.includes('# Netscape') || cookieStr.includes('# HTTP Cookie File')) {
                const lines = cookieStr.split('\n');
                for (const line of lines) {
                    if (line.trim().startsWith('#') || line.trim() === '')
                        continue;
                    const parts = line.split('\t');
                    if (parts.length >= 7) {
                        ytext.cookieJar.cookieMap[parts[5]] = parts[6].trim();
                    }
                }
                console.log(`[YouTubeAgent] Wczytano ciasteczka (Netscape) z YOUTUBE_COOKIE`);
            }
            else {
                ytext.CookieJar.parseCookieString(cookieStr, ytext.cookieJar.cookieMap);
                console.log(`[YouTubeAgent] Wczytano ciasteczka (String) z YOUTUBE_COOKIE`);
            }
        }
        catch (error) {
            console.error('[YouTubeAgent] Błąd YOUTUBE_COOKIE:', error);
        }
    }
}
async function getYouTubeInfo(query) {
    initYouTubeAgent();
    const isUrl = query.includes('youtube.com') || query.includes('youtu.be');
    if (isUrl) {
        const info = await ytext.videoInfo(query);
        return {
            title: info.title,
            url: info.url,
        };
    }
    else {
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
async function getYouTubeStream(url) {
    initYouTubeAgent();
    const stream = await ytext.getReadableStream({ url });
    return stream;
}
function reloadYouTubeAgent() {
    agentInitialized = false;
    ytext.cookieJar.cookieMap = {};
    initYouTubeAgent();
}
