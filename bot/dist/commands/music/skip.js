"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipCommand = void 0;
const discord_js_1 = require("discord.js");
const MusicManager_1 = require("../../services/MusicManager");
exports.skipCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('skip')
        .setDescription('Pomija aktualnie odtwarzany utwór'),
    execute: async (interaction) => {
        if (!interaction.guild)
            return;
        const serverQueue = MusicManager_1.musicManager.getQueue(interaction.guild.id);
        if (!interaction.member || !interaction.member.voice.channel) {
            await interaction.reply({ content: 'Musisz być na kanale głosowym, aby pominąć utwór!', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        if (!serverQueue) {
            await interaction.reply({ content: 'Nie ma nic w kolejce!', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        serverQueue.player.stop();
        await interaction.reply('Pominięto utwór.');
    }
};
