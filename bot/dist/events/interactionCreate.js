"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onInteractionCreate = onInteractionCreate;
const logger_1 = require("../utils/logger");
const commands_1 = require("../commands");
const discord_player_1 = require("discord-player");
const musicEmbed_1 = require("../utils/musicEmbed");
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
                        break;
                    case 'music_resume':
                        queue.node.setPaused(false);
                        break;
                    case 'music_skip':
                        queue.node.skip();
                        break;
                    case 'music_stop':
                        queue.delete();
                        await interaction.update({ embeds: [], components: [], content: '⏹️ Odtwarzanie zatrzymane.' });
                        return;
                    case 'music_previous':
                        if (queue.history.tracks.size > 0) {
                            await queue.history.previous();
                        }
                        break;
                    case 'music_volup':
                        queue.node.setVolume(Math.min(100, queue.node.volume + 10));
                        break;
                    case 'music_voldown':
                        queue.node.setVolume(Math.max(0, queue.node.volume - 10));
                        break;
                    case 'music_shuffle':
                        queue.tracks.shuffle();
                        break;
                    case 'music_repeat': {
                        const modes = [discord_player_1.QueueRepeatMode.OFF, discord_player_1.QueueRepeatMode.TRACK, discord_player_1.QueueRepeatMode.QUEUE];
                        let nextModeIdx = modes.indexOf(queue.repeatMode) + 1;
                        if (nextModeIdx >= modes.length || nextModeIdx < 0)
                            nextModeIdx = 0;
                        queue.setRepeatMode(modes[nextModeIdx]);
                        break;
                    }
                    case 'music_autoplay': {
                        if (queue.repeatMode === discord_player_1.QueueRepeatMode.AUTOPLAY) {
                            queue.setRepeatMode(discord_player_1.QueueRepeatMode.OFF);
                        }
                        else {
                            queue.setRepeatMode(discord_player_1.QueueRepeatMode.AUTOPLAY);
                        }
                        break;
                    }
                }
                // Płynna aktualizacja embeda bez wysyłania nowej wiadomości
                await interaction.update((0, musicEmbed_1.buildMusicMessage)(queue));
            }
            catch (e) {
                logger_1.logger.error(e, 'Błąd przycisku muzyki:');
                await interaction.reply({ content: '❌ Wystąpił błąd.', flags: 64 }).catch(() => { });
            }
        }
    }
}
