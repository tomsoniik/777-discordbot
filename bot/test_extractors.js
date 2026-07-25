const { Player } = require('discord-player');
const { YoutubeiExtractor } = require('discord-player-youtubei');
const { DefaultExtractors } = require('@discord-player/extractor');
const { Client } = require('discord.js');

async function test() {
    const client = new Client({ intents: [] });
    const player = new Player(client);
    console.log('Loading multi...');
    await player.extractors.loadMulti(DefaultExtractors);
    console.log('Registering youtubei...');
    await player.extractors.register(YoutubeiExtractor, {});
    console.log('Extractors loaded:');
    console.log(player.extractors.store.map(e => e.identifier));
    
    console.log('Testing search...');
    const result = await player.search('https://www.youtube.com/watch?v=0qPgeyCfNvA');
    console.log(result.tracks.length);
    console.log(result.extractor?.identifier);
}
test().catch(console.error);
