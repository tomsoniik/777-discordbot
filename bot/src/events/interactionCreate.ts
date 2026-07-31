import { logger } from '../utils/logger';
import { Interaction } from 'discord.js';
import { commands } from '../commands';
import { useMainPlayer, QueueRepeatMode } from 'discord-player';
import { buildMusicMessage } from '../utils/musicEmbed';

export async function onInteractionCreate(interaction: Interaction) {
    if (interaction.isChatInputCommand()) {
        try {
            const command = commands.find((c) => c.data.name === interaction.commandName);
            if (command) {
                await command.execute(interaction);
            }
        } catch (e: any) {
            logger.error(e as Error, 'Błąd podczas obsługi komendy:');
            const errMsg = e instanceof Error ? e.message : String(e);
            if (interaction.isRepliable()) {
                try {
                    if (interaction.deferred || interaction.replied) {
                        await interaction.editReply(
                            `Wystąpił nieoczekiwany błąd podczas wykonywania tej komendy: \`${errMsg}\``,
                        );
                    } else {
                        await interaction.reply({
                            content: `Wystąpił nieoczekiwany błąd podczas wykonywania tej komendy: \`${errMsg}\``,
                            flags: 64,
                        });
                    }
                } catch (replyError) {
                    logger.error(replyError as Error, 'Nie udało się wysłać powiadomienia o błędzie do użytkownika:');
                }
            }
        }
    } else if (interaction.isButton()) {
        if (interaction.customId.startsWith('music_')) {
            const player = useMainPlayer();
            if (!player) {
                await interaction.reply({ content: '❌ Odtwarzacz nie jest załadowany.', flags: 64 });
                return;
            }

            const queue = player.nodes.get(interaction.guildId!);
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
                        const modes: QueueRepeatMode[] = [QueueRepeatMode.OFF, QueueRepeatMode.TRACK, QueueRepeatMode.QUEUE];
                        let nextModeIdx = modes.indexOf(queue.repeatMode) + 1;
                        if (nextModeIdx >= modes.length || nextModeIdx < 0) nextModeIdx = 0;
                        queue.setRepeatMode(modes[nextModeIdx] as any);
                        break;
                    }
                    case 'music_autoplay': {
                        if (queue.repeatMode === QueueRepeatMode.AUTOPLAY) {
                            queue.setRepeatMode(QueueRepeatMode.OFF as any);
                        } else {
                            queue.setRepeatMode(QueueRepeatMode.AUTOPLAY as any);
                        }
                        break;
                    }
                }

                // Płynna aktualizacja embeda bez wysyłania nowej wiadomości
                await interaction.update(buildMusicMessage(queue));
            } catch (e) {
                logger.error(e as Error, 'Błąd przycisku muzyki:');
                await interaction.reply({ content: '❌ Wystąpił błąd.', flags: 64 }).catch(() => {});
            }
        }
    }
}
