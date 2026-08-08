"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusCommand = void 0;
const logger_1 = require("../../utils/logger");
const discord_js_1 = require("discord.js");
const StatusUpdater_1 = require("../../services/StatusUpdater");
exports.statusCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('status')
        .setDescription('Tworzy panel ze statusem serwerów odświeżający się co 1 minutę'),
    execute: async (interaction) => {
        await interaction.deferReply();
        try {
            const embed = await StatusUpdater_1.statusUpdater.generateEmbed();
            const message = await interaction.editReply({ embeds: [embed] });
            await StatusUpdater_1.statusUpdater.addPanel(message.channelId, message.id);
        }
        catch (e) {
            logger_1.logger.error(e, 'Błąd podczas wykonywania komendy /status:');
            await interaction.editReply('❌ Wystąpił błąd podczas pobierania statusu serwerów.');
        }
    },
};
