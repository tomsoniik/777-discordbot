import fs from 'fs';
import path from 'path';

const YT_DLP_PATH = path.join(process.cwd(), 'yt-dlp_linux_test_fetch');

export async function testDownload() {
    console.log('[YouTubeAgent] Pobieranie samodzielnego pliku binarnego yt-dlp_linux (nie wymaga Pythona)...');
    try {
        const response = await fetch('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux');
        if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
        
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(YT_DLP_PATH, Buffer.from(buffer));
        console.log(`[YouTubeAgent] yt-dlp_linux pobrany pomyślnie. Rozmiar: ${buffer.byteLength} bajtów.`);
    } catch (err) {
        console.error('[YouTubeAgent] Błąd pobierania yt-dlp_linux:', err.message);
    }
}
testDownload();
