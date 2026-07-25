import fs from 'fs';
import path from 'path';
import https from 'https';

const YT_DLP_PATH = path.join(process.cwd(), 'yt-dlp_linux_test');

export async function testDownload() {
    console.log('[YouTubeAgent] Pobieranie samodzielnego pliku binarnego yt-dlp_linux (nie wymaga Pythona)...');
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(YT_DLP_PATH);
        https.get('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux', (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                https.get(response.headers.location, (res2) => {
                    res2.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        console.log('[YouTubeAgent] yt-dlp_linux pobrany i gotowy. Size:', fs.statSync(YT_DLP_PATH).size);
                        resolve();
                    });
                }).on('error', (err) => {
                    fs.unlink(YT_DLP_PATH, () => reject(err));
                });
            } else {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log('[YouTubeAgent] yt-dlp_linux pobrany i gotowy. Size:', fs.statSync(YT_DLP_PATH).size);
                    resolve();
                });
            }
        }).on('error', (err) => {
            fs.unlink(YT_DLP_PATH, () => reject(err));
        });
    });
}
testDownload();
