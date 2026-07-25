"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipCommand = void 0;
const discord_js_1 = require("discord.js");
const discord_player_1 = require("discord-player");
exports.skipCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('skip')
        .setDescription('Pomija aktualnie odtwarzany utwór'),
    execute: async (interaction) => {
        if (!interaction.guild)
            return;
        const queue = (0, discord_player_1.useQueue)(interaction.guild.id);
        if (!queue || !queue.isPlaying()) {
            await interaction.reply('Aktualnie nic nie jest odtwarzane!');
            return;
        }
        queue.node.skip();
        await interaction.reply('⏭️ Pominięto utwór!');
    }
};
