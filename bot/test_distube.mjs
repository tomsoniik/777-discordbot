import ytdl from '@distube/ytdl-core';
import ytSearch from 'yt-search';

async function test() {
    try {
        console.log('Testing @distube/ytdl-core...');
        const stream = ytdl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
            filter: 'audioonly',
            quality: 'highestaudio'
        });
        
        let bytes = 0;
        stream.on('data', (chunk) => {
            bytes += chunk.length;
            if (bytes > 100000) {
                console.log('Received more than 100KB, @distube/ytdl-core works!');
                process.exit(0);
            }
        });
        stream.on('error', (err) => {
            console.error('Stream error:', err);
            process.exit(1);
        });
    } catch (e) {
        console.error('@distube/ytdl-core error:', e);
        process.exit(1);
    }
}
test();
