import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { GuildQueue, QueueRepeatMode } from 'discord-player';

export function buildMusicMessage(queue: GuildQueue<any>) {
    const track = queue.currentTrack;
    if (!track) return { embeds: [], components: [] };

    const isAutoplay = queue.repeatMode === QueueRepeatMode.AUTOPLAY;

    let loopModeTxt = 'Off';
    if (queue.repeatMode === QueueRepeatMode.TRACK) loopModeTxt = 'Track';
    if (queue.repeatMode === QueueRepeatMode.QUEUE) loopModeTxt = 'Queue';

    const autoplayTxt = isAutoplay ? 'On' : 'Off';
    const color = '#1db954'; // Zielony, dopasowany do zrzutu ekranu

    const progress = queue.node.createProgressBar({
        indicator: '🔵',
        length: 14,
        timecodes: true,
    });

    const isPaused = queue.node.isPaused();
    const playbackState = isPaused ? '⏸️ Paused' : '▶️ Playing';

    // Formatting source neatly
    let sourceName = track.source;
    if (sourceName === 'soundcloud') sourceName = 'SoundCloud';
    else if (sourceName === 'youtube') sourceName = 'YouTube';

    const embed = new EmbedBuilder()
        .setColor(color)
        .setAuthor({ name: '🎶 Now playing' })
        .setTitle(track.title)
        .setURL(track.url)
        .setThumbnail(track.thumbnail || null)
        .addFields(
            { name: 'Duration', value: `\`${track.duration}\``, inline: true },
            { name: 'Source', value: sourceName, inline: true },
            { name: 'Playback', value: playbackState, inline: true },
            { name: 'Added by', value: track.requestedBy ? track.requestedBy.toString() : 'Nieznany', inline: true },
            { name: 'Songs in queue', value: queue.tracks.size.toString(), inline: true },
            { name: '\u200b', value: '\u200b', inline: true }, // Empty field for grid alignment
            { name: 'Progress', value: progress || '0:00 🔵▬▬▬▬▬▬▬▬▬▬▬▬▬▬ 0:00' },
            {
                name: 'Status',
                value: `Volume: \`${queue.node.volume}%\` | Loop: \`${loopModeTxt}\` | Autoplay: \`${autoplayTxt}\``,
            },
        )
        .setFooter({ text: 'SkullBot Music' })
        .setTimestamp();

    // Rząd 1
    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('music_pause')
            .setLabel('Pause')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(isPaused),
        new ButtonBuilder()
            .setCustomId('music_resume')
            .setLabel('Resume')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(!isPaused),
        new ButtonBuilder()
            .setCustomId('music_previous')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(queue.history.tracks.size === 0),
        new ButtonBuilder().setCustomId('music_skip').setLabel('Skip').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('music_stop').setLabel('Stop').setStyle(ButtonStyle.Primary),
    );

    // Rząd 2
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('music_volup')
            .setLabel('Volume up')
            .setStyle(ButtonStyle.Success)
            .setDisabled(queue.node.volume >= 100),
        new ButtonBuilder()
            .setCustomId('music_voldown')
            .setLabel('Volume down')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(queue.node.volume <= 0),
        new ButtonBuilder()
            .setCustomId('music_shuffle')
            .setLabel('Shuffle')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(queue.tracks.size === 0),
        new ButtonBuilder().setCustomId('music_repeat').setLabel('Repeat').setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('music_autoplay')
            .setLabel(`AutoPlay: ${autoplayTxt}`)
            .setStyle(ButtonStyle.Secondary),
    );

    return { embeds: [embed], components: [row1, row2] };
}
