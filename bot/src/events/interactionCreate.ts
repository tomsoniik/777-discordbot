import { Interaction } from 'discord.js';
import { commands } from '../commands';
import { musicManager } from '../services/MusicManager';

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
            const guildId = interaction.guildId;
            if (!guildId) return;

            const serverQueue = musicManager.getQueue(guildId);
            if (!serverQueue) {
                await interaction.reply({ content: 'Obecnie nie jest odtwarzana żadna muzyka!', flags: 64 });
                return;
            }

            const member = await interaction.guild?.members.fetch(interaction.user.id);
            const voiceChannel = member?.voice.channel;
            if (!voiceChannel || voiceChannel.id !== serverQueue.voiceChannel.id) {
                await interaction.reply({ content: 'Musisz być na tym samym kanale głosowym co bot, aby sterować muzyką!', flags: 64 });
                return;
            }

            try {
                if (interaction.customId === 'music_pause_resume') {
                    if (serverQueue.player.state.status === 'playing') serverQueue.player.pause();
                    else serverQueue.player.unpause();
                    await musicManager.sendMusicDashboard(guildId, serverQueue.songs[0], serverQueue.textChannel, interaction);
                } else if (interaction.customId === 'music_skip') {
                    serverQueue.player.stop(); 
                    await interaction.reply({ content: '⏭️ Pominięto utwór.', flags: 64 });
                } else if (interaction.customId === 'music_stop') {
                    serverQueue.songs = [];
                    serverQueue.player.stop();
                    await interaction.reply({ content: '⏹️ Zatrzymano odtwarzanie i wyczyszczono kolejkę.', flags: 64 });
                } else if (interaction.customId === 'music_queue') {
                    if (serverQueue.songs.length === 0) {
                        await interaction.reply({ content: 'Kolejka jest pusta!', flags: 64 });
                        return;
                    }
                    const queueString = serverQueue.songs.map((song, index) => `${index === 0 ? '**Teraz gram:**' : `**${index}.**`} ${song.title}`).join('\n');
                    await interaction.reply({ content: `**Kolejka:**\n${queueString.substring(0, 1900)}`, flags: 64 });
                } else if (interaction.customId === 'music_loop') {
                    serverQueue.loop = !serverQueue.loop;
                    await musicManager.sendMusicDashboard(guildId, serverQueue.songs[0], serverQueue.textChannel, interaction);
                } else if (interaction.customId === 'music_vol_up') {
                    if (serverQueue.volume >= 200) {
                        await interaction.reply({ content: 'Głośność jest już na maksymalnym poziomie!', flags: 64 });
                        return;
                    }
                    serverQueue.volume += 10;
                    serverQueue.resource?.volume?.setVolume(serverQueue.volume / 100);
                    await musicManager.sendMusicDashboard(guildId, serverQueue.songs[0], serverQueue.textChannel, interaction);
                } else if (interaction.customId === 'music_vol_down') {
                    if (serverQueue.volume <= 10) {
                        await interaction.reply({ content: 'Głośność jest na minimalnym poziomie!', flags: 64 });
                        return;
                    }
                    serverQueue.volume -= 10;
                    serverQueue.resource?.volume?.setVolume(serverQueue.volume / 100);
                    await musicManager.sendMusicDashboard(guildId, serverQueue.songs[0], serverQueue.textChannel, interaction);
                }
            } catch (err) {
                console.error(err);
            }
        }
    }
}
