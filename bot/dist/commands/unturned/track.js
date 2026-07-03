"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackCommand = void 0;
const discord_js_1 = require("discord.js");
const db_1 = require("../../utils/db");
const steam_1 = require("../../utils/steam");
const UnturnedTracker_1 = require("../../services/UnturnedTracker");
const ShadowNetwork_1 = require("../../services/ShadowNetwork");
const env_1 = require("../../config/env");
exports.trackCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('track')
        .setDescription('Rozpocznij śledzenie gracza na serwerze Unturned')
        .addStringOption(option => option.setName('steamid')
        .setDescription('Link do profilu Steam, vanity URL lub SteamID64')
        .setRequired(true))
        .addStringOption(option => option.setName('server')
        .setDescription('Wybierz gotowy serwer Unbeaten')
        .addChoices({ name: 'Wszystkie serwery (All)', value: 'all' }, { name: 'Washington x100', value: 'washington' }, { name: 'Arena', value: 'arena' }, { name: 'California x100', value: 'california' }, { name: 'Germany x100', value: 'germany' }, { name: 'PEI x100', value: 'pei' }, { name: 'Russia x100', value: 'russia' }, { name: 'Arid', value: 'arid' }, { name: 'A6 Polaris', value: 'polaris' })
        .setRequired(false)),
    execute: async (interaction) => {
        if (!env_1.ENV.STEAM_API_KEY) {
            await interaction.reply({ content: 'Brak STEAM_API_KEY w konfiguracji bota!', flags: discord_js_1.MessageFlags.Ephemeral });
            return;
        }
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const rawInput = interaction.options.getString('steamid', true);
        const serverChoice = interaction.options.getString('server') || 'all';
        const steamId = await (0, steam_1.resolveSteamId)(rawInput);
        if (!steamId) {
            await interaction.editReply('Nie udało się rozwiązać SteamID z podanego wejścia. Podaj poprawny SteamID64 lub link do profilu publicznego.');
            return;
        }
        let settings = await db_1.prisma.botSettings.findUnique({ where: { id: 1 } });
        let channelId = settings?.defaultChannelId;
        if (!channelId) {
            await db_1.prisma.botSettings.upsert({
                where: { id: 1 },
                update: { defaultChannelId: interaction.channelId },
                create: { id: 1, defaultChannelId: interaction.channelId }
            });
        }
        const existing = await db_1.prisma.trackedPlayer.findUnique({ where: { steamId } });
        let privacyWarning = '';
        try {
            const res = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${env_1.ENV.STEAM_API_KEY}&steamids=${steamId}`);
            const data = await res.json();
            const player = data.response?.players?.[0];
            if (player && player.communityvisibilitystate !== 3) {
                privacyWarning = '\n\n⚠️ **OSTRZEŻENIE:** Ten profil Steam jest **Prywatny** (lub ma ukryte szczegóły gry). System nie będzie w stanie go śledzić przez Steam API.';
            }
        }
        catch (e) { }
        const targetName = serverChoice === 'all' ? 'wszystkich zapisanych serwerach' : `serwerze ${UnturnedTracker_1.PREDEFINED_SERVERS[serverChoice]?.displayName}`;
        if (existing && existing.isActive) {
            await db_1.prisma.trackedPlayer.update({ where: { steamId }, data: { targetServer: serverChoice, addedBy: interaction.user.id } });
            await interaction.editReply(`Zaktualizowano śledzenie gracza \`${steamId}\` na **${targetName}**!${privacyWarning}`);
            return;
        }
        await db_1.prisma.trackedPlayer.upsert({
            where: { steamId },
            update: { isActive: true, targetServer: serverChoice, addedBy: interaction.user.id, isOnline: false, lastServer: null },
            create: { steamId, targetServer: serverChoice, addedBy: interaction.user.id, isOnline: false, lastServer: null }
        });
        // ECHO-TRACKER: Asynchronously build friend network
        ShadowNetwork_1.ShadowNetwork.scrapeFriends(steamId).catch(console.error);
        await interaction.editReply(`Rozpoczęto śledzenie SteamID: \`${steamId}\` na **${targetName}**!${privacyWarning}`);
    }
};
