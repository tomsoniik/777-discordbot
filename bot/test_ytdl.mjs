import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const p = path.join(process.cwd(), 'yt-dlp_linux');
console.log('Exists?', fs.existsSync(p));
if (fs.existsSync(p)) {
    try {
        const out = execSync(p + ' --version');
        console.log('Version:', out.toString());
    } catch (e) {
        console.error('Error running:', e.message);
    }
}
