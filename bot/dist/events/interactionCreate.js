"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onInteractionCreate = onInteractionCreate;
const logger_1 = require("../utils/logger");
const commands_1 = require("../commands");
const discord_player_1 = require("discord-player");
async function onInteractionCreate(interaction) {
    if (interaction.isChatInputCommand()) {
        try {
            const command = commands_1.commands.find((c) => c.data.name === interaction.commandName);
            if (command) {
                await command.execute(interaction);
            }
        }
        catch (e) {
            logger_1.logger.error(e, 'Błąd podczas obsługi komendy:');
            const errMsg = e instanceof Error ? e.message : String(e);
            if (interaction.isRepliable()) {
                try {
                    if (interaction.deferred || interaction.replied) {
                        await interaction.editReply(`Wystąpił nieoczekiwany błąd podczas wykonywania tej komendy: \`${errMsg}\``);
                    }
                    else {
                        await interaction.reply({
                            content: `Wystąpił nieoczekiwany błąd podczas wykonywania tej komendy: \`${errMsg}\``,
                            flags: 64,
                        });
                    }
                }
                catch (replyError) {
                    logger_1.logger.error(replyError, 'Nie udało się wysłać powiadomienia o błędzie do użytkownika:');
                }
            }
        }
    }
    else if (interaction.isButton()) {
        if (interaction.customId.startsWith('music_')) {
            const player = (0, discord_player_1.useMainPlayer)();
            if (!player) {
                await interaction.reply({ content: '❌ Odtwarzacz nie jest załadowany.', flags: 64 });
                return;
            }
            const queue = player.nodes.get(interaction.guildId);
            if (!queue) {
                await interaction.reply({ content: '❌ Obecnie nic nie jest odtwarzane.', flags: 64 });
                return;
            }
            try {
                switch (interaction.customId) {
                    case 'music_pause':
                        queue.node.setPaused(true);
                        await interaction.reply({ content: '⏸️ Muzyka została wstrzymana.' });
                        break;
                    case 'music_resume':
                        queue.node.setPaused(false);
                        await interaction.reply({ content: '▶️ Muzyka została wznowiona.' });
                        break;
                    case 'music_skip':
                        queue.node.skip();
                        await interaction.reply({ content: '⏭️ Pominięto utwór.' });
                        break;
                    case 'music_stop':
                        queue.delete();
                        await interaction.reply({ content: '⏹️ Odtwarzanie zatrzymane, kolejka wyczyszczona.' });
                        break;
                }
            }
            catch (e) {
                logger_1.logger.error(e, 'Błąd przycisku muzyki:');
                await interaction.reply({ content: '❌ Wystąpił błąd.', flags: 64 }).catch(() => { });
            }
        }
    }
}
