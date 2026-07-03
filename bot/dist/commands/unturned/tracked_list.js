"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackedListCommand = void 0;
const discord_js_1 = require("discord.js");
const db_1 = require("../../utils/db");
const env_1 = require("../../config/env");
exports.trackedListCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('tracked_list')
        .setDescription('Pokaż listę obecnie śledzonych graczy z bazy danych'),
    execute: async (interaction) => {
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const activeTrackers = await db_1.prisma.trackedPlayer.findMany({ where: { isActive: true } });
        if (activeTrackers.length === 0) {
            await interaction.editReply('Obecnie nie śledzę żadnych graczy.');
            return;
        }
        const embeds = [];
        const mainEmbed = new discord_js_1.EmbedBuilder()
            .setTitle('📡 Lista Śledzonych Graczy')
            .setColor('#7289da')
            .setDescription(`Obecnie sprawdzam serwery w poszukiwaniu **${activeTrackers.length}** graczy.`);
        embeds.push(mainEmbed);
        const steamIds = activeTrackers.slice(0, 9).map((t) => t.steamId);
        if (steamIds.length > 0) {
            try {
                const res = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${env_1.ENV.STEAM_API_KEY}&steamids=${steamIds.join(',')}`);
                const data = await res.json();
                const players = data.response?.players || [];
                for (const player of players) {
                    const embed = new discord_js_1.EmbedBuilder()
                        .setColor('#2b2d31')
                        .setAuthor({
                        name: player.personaname || player.steamid,
                        iconURL: player.avatarfull,
                        url: player.profileurl
                    })
                        .setDescription(`Identyfikator: \`${player.steamid}\``);
                    embeds.push(embed);
                }
            }
            catch (e) {
                console.error(e);
            }
        }
        if (activeTrackers.length > 9) {
            embeds.push(new discord_js_1.EmbedBuilder().setColor('#2b2d31').setDescription(`*...i ${activeTrackers.length - 9} innych w bazie (limit wyświetlania)*`));
        }
        await interaction.editReply({ embeds });
    }
};
