import play from 'play-dl';
import fs from 'fs';

async function test() {
    try {
        console.log('Testing play-dl stream...');
        const stream = await play.stream('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
            discordPlayerCompatibility: true
        });
        
        let bytes = 0;
        stream.stream.on('data', (chunk) => {
            bytes += chunk.length;
            if (bytes > 100000) {
                console.log('Received more than 100KB, play-dl works!');
                process.exit(0);
            }
        });
    } catch (e) {
        console.error('play-dl error:', e);
        process.exit(1);
    }
}
test();
