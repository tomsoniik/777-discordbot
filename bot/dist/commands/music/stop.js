"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopCommand = void 0;
const discord_js_1 = require("discord.js");
const MusicManager_1 = require("../../services/MusicManager");
exports.stopCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('stop')
        .setDescription('Zatrzymuje muzykę i czyści kolejkę'),
    execute: async (interaction) => {
        if (!interaction.guild)
            return;
        const serverQueue = MusicManager_1.musicManager.getQueue(interaction.guild.id);
        if (!interaction.member || !interaction.member.voice.channel) {
            await interaction.reply({ content: 'Musisz być na kanale głosowym, aby zatrzymać muzykę!', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        if (!serverQueue) {
            await interaction.reply({ content: 'Nie ma nic w kolejce!', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        serverQueue.songs = [];
        serverQueue.player.stop();
        await interaction.reply('Zatrzymano odtwarzanie i wyczyszczono kolejkę.');
    }
};
