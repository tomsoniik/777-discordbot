"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueCommand = void 0;
const discord_js_1 = require("discord.js");
const discord_player_1 = require("discord-player");
exports.queueCommand = {
    data: new discord_js_1.SlashCommandBuilder().setName('queue').setDescription('Wyświetla aktualną kolejkę utworów'),
    execute: async (interaction) => {
        if (!interaction.guild)
            return;
        const queue = (0, discord_player_1.useQueue)(interaction.guild.id);
        if (!queue || !queue.isPlaying()) {
            await interaction.reply('Aktualnie nic nie jest odtwarzane!');
            return;
        }
        const currentTrack = queue.currentTrack;
        const tracks = queue.tracks.toArray();
        let description = `**Teraz odtwarzane:**\n🎵 ${currentTrack?.title} - ${currentTrack?.author}\n\n**Następne w kolejce:**\n`;
        if (tracks.length === 0) {
            description += 'Brak utworów w kolejce.';
        }
        else {
            const nextSongs = tracks.slice(0, 10);
            nextSongs.forEach((song, index) => {
                description += `${index + 1}. ${song.title} - ${song.author}\n`;
            });
            if (tracks.length > 10) {
                description += `...i ${tracks.length - 10} innych utworów.`;
            }
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Kolejka odtwarzania')
            .setDescription(description)
            .setColor('#7289da');
        await interaction.reply({ embeds: [embed] });
    },
};
