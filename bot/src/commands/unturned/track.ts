import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { prisma } from '../../utils/db';
import { resolveSteamId } from '../../utils/steam';
import { PREDEFINED_SERVERS } from '../../services/UnturnedTracker';
import { ShadowNetwork } from '../../services/ShadowNetwork';
import { ENV } from '../../config/env';

export const trackCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('track')
        .setDescription('Rozpocznij śledzenie gracza na serwerze Unturned')
        .addStringOption(option => 
            option.setName('steamid')
                .setDescription('Link do profilu Steam, vanity URL lub SteamID64')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('server')
                .setDescription('Wybierz gotowy serwer Unbeaten')
                .addChoices(
                    { name: 'Wszystkie serwery (All)', value: 'all' },
                    { name: 'Washington x100', value: 'washington' },
                    { name: 'Arena', value: 'arena' },
                    { name: 'California x100', value: 'california' },
                    { name: 'Germany x100', value: 'germany' },
                    { name: 'PEI x100', value: 'pei' },
                    { name: 'Russia x100', value: 'russia' },
                    { name: 'Arid', value: 'arid' },
                    { name: 'A6 Polaris', value: 'polaris' }
                )
                .setRequired(false))
        .addStringOption(option => 
            option.setName('link_to')
                .setDescription('Opcjonalnie podaj profil/SteamID by złączyć ich na grafie (nawet jak prywatny)')
                .setRequired(false)),
    execute: async (interaction: ChatInputCommandInteraction) => {
        if (!ENV.STEAM_API_KEY) {
            await interaction.reply({ content: 'Brak STEAM_API_KEY w konfiguracji bota!', flags: MessageFlags.Ephemeral });
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        const rawInput = interaction.options.getString('steamid', true);
        const serverChoice = interaction.options.getString('server') || 'all';
        const linkToRaw = interaction.options.getString('link_to');
        
        const steamId = await resolveSteamId(rawInput);
        if (!steamId) {
            await interaction.editReply('Nie udało się rozwiązać SteamID z podanego wejścia. Podaj poprawny SteamID64 lub link do profilu publicznego.');
            return;
        }

        let settings = await prisma.botSettings.findUnique({ where: { id: 1 } });
        let channelId = settings?.defaultChannelId;
        
        if (!channelId) {
            await prisma.botSettings.upsert({
                where: { id: 1 },
                update: { defaultChannelId: interaction.channelId },
                create: { id: 1, defaultChannelId: interaction.channelId }
            });
        }

        const existing = await prisma.trackedPlayer.findUnique({ where: { steamId } });
        let privacyWarning = '';
        try {
            const res = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${ENV.STEAM_API_KEY}&steamids=${steamId}`);
            const data: any = await res.json();
            const player = data.response?.players?.[0];
            if (player && player.communityvisibilitystate !== 3) {
                privacyWarning = '\n\n⚠️ **OSTRZEŻENIE:** Ten profil Steam jest **Prywatny** (lub ma ukryte szczegóły gry). System nie będzie w stanie go śledzić przez Steam API.';
            }
        } catch (e) {}

        const targetName = serverChoice === 'all' ? 'wszystkich zapisanych serwerach' : `serwerze ${PREDEFINED_SERVERS[serverChoice]?.displayName}`;
        
        if (existing && existing.isActive) {
            await prisma.trackedPlayer.update({ where: { steamId }, data: { targetServer: serverChoice, addedBy: interaction.user.id } });
            await interaction.editReply(`Zaktualizowano śledzenie gracza \`${steamId}\` na **${targetName}**!${privacyWarning}`);
            return;
        }

        await prisma.trackedPlayer.upsert({
            where: { steamId },
            update: { isActive: true, targetServer: serverChoice, addedBy: interaction.user.id, isOnline: false, lastServer: null },
            create: { steamId, targetServer: serverChoice, addedBy: interaction.user.id, isOnline: false, lastServer: null }
        });

        // ECHO-TRACKER: Asynchronously build friend network
        ShadowNetwork.scrapeFriends(steamId).catch(console.error);

        if (linkToRaw) {
            const linkToSteamId = await resolveSteamId(linkToRaw);
            if (linkToSteamId && linkToSteamId !== steamId) {
                const [a, b] = [steamId, linkToSteamId].sort();
                await prisma.playerNode.upsert({ where: { steamId: a }, update: {}, create: { steamId: a } });
                await prisma.playerNode.upsert({ where: { steamId: b }, update: {}, create: { steamId: b } });
                await prisma.playerRelation.upsert({
                    where: { steamIdA_steamIdB: { steamIdA: a, steamIdB: b } },
                    update: { bondStrength: { increment: 5 } },
                    create: { steamIdA: a, steamIdB: b, bondStrength: 10 }
                });
                privacyWarning += `\n🔗 **Połączono w Shadow Network z:** \`${linkToSteamId}\``;
            } else {
                privacyWarning += `\n⚠️ Nie udało się odczytać profilu powiązanego (\`link_to\`).`;
            }
        }

        await interaction.editReply(`Rozpoczęto śledzenie SteamID: \`${steamId}\` na **${targetName}**!${privacyWarning}`);
    }
};
