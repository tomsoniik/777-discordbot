"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueCommand = void 0;
const discord_js_1 = require("discord.js");
const MusicManager_1 = require("../../services/MusicManager");
exports.queueCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('queue')
        .setDescription('Wyświetla aktualną kolejkę utworów'),
    execute: async (interaction) => {
        if (!interaction.guild)
            return;
        const serverQueue = MusicManager_1.musicManager.getQueue(interaction.guild.id);
        if (!serverQueue || serverQueue.songs.length === 0) {
            await interaction.reply({ content: 'Kolejka jest pusta!', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        const queueString = serverQueue.songs.map((song, index) => `${index === 0 ? '**Teraz gram:**' : `**${index}.**`} ${song.title}`).join('\n');
        await interaction.reply(`**Kolejka:**\n${queueString}`);
    }
};
