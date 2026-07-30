"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopCommand = void 0;
const discord_js_1 = require("discord.js");
const discord_player_1 = require("discord-player");
exports.stopCommand = {
    data: new discord_js_1.SlashCommandBuilder().setName('stop').setDescription('Zatrzymuje odtwarzanie i czyści kolejkę'),
    execute: async (interaction) => {
        if (!interaction.guild)
            return;
        const queue = (0, discord_player_1.useQueue)(interaction.guild.id);
        if (!queue || !queue.isPlaying()) {
            await interaction.reply('Aktualnie nic nie jest odtwarzane!');
            return;
        }
        queue.delete();
        await interaction.reply('⏹️ Odtwarzanie zatrzymane, kolejka wyczyszczona.');
    },
};
