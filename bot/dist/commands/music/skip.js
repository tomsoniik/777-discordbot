"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipCommand = void 0;
const discord_js_1 = require("discord.js");
const discord_player_1 = require("discord-player");
exports.skipCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('skip')
        .setDescription('Pomija obecnie odtwarzany utwór'),
    execute: async (interaction) => {
        const queue = (0, discord_player_1.useQueue)(interaction.guildId);
        if (!queue) {
            await interaction.reply({ content: '❌ Obecnie nic nie jest odtwarzane.', flags: 64 });
            return;
        }
        queue.node.skip();
        await interaction.reply('⏭️ Pominięto utwór.');
    },
};
