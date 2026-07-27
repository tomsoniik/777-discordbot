import { Interaction } from 'discord.js';
import { commands } from '../commands';
import { useMainPlayer } from 'discord-player';

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
                await interaction.reply({ content: 'Błąd: odtwarzacz nie jest załadowany.', flags: 64 });
                return;
            }

            const queue = player.nodes.get(interaction.guildId!);
            if (!queue || !queue.node.isPlaying()) {
                // Ignore if not playing or paused
                if (!queue) {
                    await interaction.reply({ content: 'Obecnie nic nie jest odtwarzane.', flags: 64 });
                    return;
                }
            }

            try {
                if (interaction.customId === 'music_pause') {
                    const isPaused = queue.node.isPaused();
                    queue.node.setPaused(!isPaused);
                    await interaction.reply({ content: `Muzyka została ${!isPaused ? 'wstrzymana' : 'wznowiona'}.` });
                } else if (interaction.customId === 'music_skip') {
                    queue.node.skip();
                    await interaction.reply({ content: 'Pominięto utwór.' });
                } else if (interaction.customId === 'music_stop') {
                    queue.delete();
                    await interaction.reply({ content: 'Odtwarzanie zatrzymane, kolejka wyczyszczona.' });
                }
            } catch (e) {
                console.error('Błąd przycisku muzyki:', e);
                await interaction.reply({ content: 'Wystąpił błąd podczas używania tego przycisku.', flags: 64 });
            }
        }
    }
}
