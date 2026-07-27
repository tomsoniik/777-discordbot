import { Interaction } from 'discord.js';
import { commands } from '../commands';
import { useMainPlayer, QueueRepeatMode } from 'discord-player';

export async function onInteractionCreate(interaction: Interaction) {
    if (interaction.isChatInputCommand()) {
        try {
            const command = commands.find(c => c.data.name === interaction.commandName);
            if (command) {
                await command.execute(interaction);
            }
        } catch (e: any) {
            console.error('Błąd podczas obsługi komendy:', e);
            const errMsg = e instanceof Error ? e.message : String(e);
            if (interaction.isRepliable()) {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply(`Wystąpił nieoczekiwany błąd podczas wykonywania tej komendy: \`${errMsg}\``);
                } else {
                    await interaction.reply({ content: `Wystąpił nieoczekiwany błąd podczas wykonywania tej komendy: \`${errMsg}\``, flags: 64 });
                }
            }
        }
    } else if (interaction.isButton()) {
        if (interaction.customId.startsWith('music_')) {
            const player = useMainPlayer();
            if (!player) {
                await interaction.reply({ content: '❌ Błąd: Odtwarzacz nie jest załadowany.', flags: 64 });
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
                        await interaction.reply({ content: '⏸️ Muzyka została wstrzymana.' });
                        break;
                    case 'music_resume':
                        queue.node.setPaused(false);
                        await interaction.reply({ content: '▶️ Muzyka została wznowiona.' });
                        break;
                    case 'music_previous':
                        if (queue.history.tracks.data.length === 0) {
                            await interaction.reply({ content: '❌ Brak poprzednich utworów w historii.', flags: 64 });
                        } else {
                            await queue.history.previous();
                            await interaction.reply({ content: '⏮️ Wrócono do poprzedniego utworu.' });
                        }
                        break;
                    case 'music_skip':
                        queue.node.skip();
                        await interaction.reply({ content: '⏭️ Pominięto utwór.' });
                        break;
                    case 'music_stop':
                        queue.delete();
                        await interaction.reply({ content: '⏹️ Odtwarzanie zatrzymane, kolejka wyczyszczona.' });
                        break;
                    case 'music_volup':
                        const volUp = Math.min(queue.node.volume + 10, 100);
                        queue.node.setVolume(volUp);
                        await interaction.reply({ content: `🔊 Głośność: ${volUp}%` });
                        break;
                    case 'music_voldown':
                        const volDown = Math.max(queue.node.volume - 10, 0);
                        queue.node.setVolume(volDown);
                        await interaction.reply({ content: `🔉 Głośność: ${volDown}%` });
                        break;
                    case 'music_shuffle':
                        queue.tracks.shuffle();
                        await interaction.reply({ content: '🔀 Kolejka została przetasowana.' });
                        break;
                    case 'music_repeat':
                        const nextLoop = queue.repeatMode === QueueRepeatMode.TRACK ? QueueRepeatMode.OFF : QueueRepeatMode.TRACK;
                        queue.setRepeatMode(nextLoop);
                        await interaction.reply({ content: `🔁 Pętla utworu: ${nextLoop === QueueRepeatMode.TRACK ? 'Włączona' : 'Wyłączona'}` });
                        break;
                    case 'music_autoplay':
                        const nextAuto = queue.repeatMode === QueueRepeatMode.AUTOPLAY ? QueueRepeatMode.OFF : QueueRepeatMode.AUTOPLAY;
                        queue.setRepeatMode(nextAuto);
                        await interaction.reply({ content: `🎵 AutoPlay: ${nextAuto === QueueRepeatMode.AUTOPLAY ? 'Włączony' : 'Wyłączony'}` });
                        break;
                }
            } catch (e) {
                console.error('Błąd przycisku muzyki:', e);
                await interaction.reply({ content: '❌ Wystąpił błąd podczas używania tego przycisku.', flags: 64 });
            }
        }
    }
}
