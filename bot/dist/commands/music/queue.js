"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueCommand = void 0;
const discord_js_1 = require("discord.js");
const discord_player_1 = require("discord-player");
exports.queueCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('queue')
        .setDescription('Wyświetla aktualną kolejkę utworów'),
    execute: async (interaction) => {
        const queue = (0, discord_player_1.useQueue)(interaction.guildId);
        if (!queue || !queue.isPlaying()) {
            await interaction.reply({ content: '❌ Obecnie nic nie jest odtwarzane.', flags: 64 });
            return;
        }
        const currentTrack = queue.currentTrack;
        const tracks = queue.tracks.toArray().slice(0, 10);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle(`Kolejka na serwerze`)
            .setDescription(`**Teraz gra:**\n${currentTrack?.title} - ${currentTrack?.author}\n\n**Następne w kolejce:**\n${tracks.length > 0 ? tracks.map((track, i) => `${i + 1}. ${track.title}`).join('\n') : 'Brak'}`)
            .setFooter({ text: `Łącznie utworów: ${queue.tracks.size}` });
        await interaction.reply({ embeds: [embed] });
    },
};
