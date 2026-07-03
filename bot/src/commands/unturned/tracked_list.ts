import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { prisma } from '../../utils/db';
import { ENV } from '../../config/env';

export const trackedListCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('tracked_list')
        .setDescription('Pokaż listę obecnie śledzonych graczy z bazy danych'),
    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        const activeTrackers = await prisma.trackedPlayer.findMany({ where: { isActive: true } });
        
        if (activeTrackers.length === 0) {
            await interaction.editReply('Obecnie nie śledzę żadnych graczy.');
            return;
        }

        const embeds: EmbedBuilder[] = [];
        
        const mainEmbed = new EmbedBuilder()
            .setTitle('📡 Lista Śledzonych Graczy')
            .setColor('#7289da')
            .setDescription(`Obecnie sprawdzam serwery w poszukiwaniu **${activeTrackers.length}** graczy.`);
        embeds.push(mainEmbed);

        const steamIds = activeTrackers.slice(0, 9).map((t: any) => t.steamId);
        
        if (steamIds.length > 0) {
            try {
                const res = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${ENV.STEAM_API_KEY}&steamids=${steamIds.join(',')}`);
                const data: any = await res.json();
                const players = data.response?.players || [];
                
                for (const player of players) {
                    const embed = new EmbedBuilder()
                        .setColor('#2b2d31')
                        .setAuthor({ 
                            name: player.personaname || player.steamid, 
                            iconURL: player.avatarfull, 
                            url: player.profileurl 
                        })
                        .setDescription(`Identyfikator: \`${player.steamid}\``);
                    embeds.push(embed);
                }
            } catch (e) {
                console.error(e);
            }
        }
        
        if (activeTrackers.length > 9) {
            embeds.push(new EmbedBuilder().setColor('#2b2d31').setDescription(`*...i ${activeTrackers.length - 9} innych w bazie (limit wyświetlania)*`));
        }

        await interaction.editReply({ embeds });
    }
};
