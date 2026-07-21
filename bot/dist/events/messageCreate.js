"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onMessageCreate = onMessageCreate;
const discord_js_1 = require("discord.js");
const env_1 = require("../config/env");
const UnturnedTracker_1 = require("../services/UnturnedTracker");
async function onMessageCreate(message) {
    if (message.author.bot)
        return;
    if (message.content === '!ticketsetup' && message.member?.permissions.has('Administrator')) {
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setLabel('Stwórz Ticket (Aplikuj)')
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL(`${env_1.ENV.WEB_URL}/apply`));
        if ('send' in message.channel) {
            await message.channel.send({
                content: 'Kliknij poniższy przycisk, aby przejść do panelu rekrutacji i wypełnić formularz logując się przez Steam:',
                components: [row]
            });
        }
    }
    // ==========================================
    // SYSTEM RAID ALERTÓW (Automatyczny z Webhooka)
    // ==========================================
    const RAID_CHANNEL_ID = '1522591098458079443';
    if (message.channelId === RAID_CHANNEL_ID) {
        // Ignorujemy własne wiadomości bota 777 (żeby nie zapętlił sam siebie)
        if (message.author.id === message.client.user?.id)
            return;
        // Sprawdzamy, czy wiadomość ma jakikolwiek Embed (Webhooki od Unbeaten wysyłają Embedy)
        if (message.embeds.length > 0) {
            const embed = message.embeds[0];
            const title = embed.title?.toLowerCase() || '';
            const desc = embed.description?.toLowerCase() || '';
            // Szukamy słowa "raid" w tytule lub opisie
            if (title.includes('raid') || desc.includes('destroyed') || title.includes('attack')) {
                let foundServerIpPort = '';
                let foundMapName = 'Nieznana Mapa';
                // Szukamy nazwy mapy w tytule powiadomienia (np. "... [SHOP|KIT|TPA] RUSSIA")
                for (const [key, serverData] of Object.entries(UnturnedTracker_1.PREDEFINED_SERVERS)) {
                    if (title.includes(key.toLowerCase()) || desc.includes(key.toLowerCase())) {
                        foundServerIpPort = `${serverData.ip}:${serverData.port}`;
                        foundMapName = serverData.displayName || key.toUpperCase();
                        break;
                    }
                }
                // Generowanie przycisku Direct Connect
                const row = new discord_js_1.ActionRowBuilder();
                if (foundServerIpPort) {
                    row.addComponents(new discord_js_1.ButtonBuilder()
                        .setLabel(`🚀 Połącz: ${foundMapName}`)
                        .setStyle(discord_js_1.ButtonStyle.Link)
                        // Możesz użyć URL join.unbeaten.gg lub steam:// 
                        .setURL(`https://join.unbeaten.gg/${foundServerIpPort}`));
                }
                else {
                    row.addComponents(new discord_js_1.ButtonBuilder()
                        .setLabel(`⚠️ Nie rozpoznano mapy`)
                        .setStyle(discord_js_1.ButtonStyle.Secondary)
                        .setCustomId('disabled_btn')
                        .setDisabled(true));
                }
                const alertEmbed = new discord_js_1.EmbedBuilder()
                    .setTitle('🚨 TRWA RAID NA NASZĄ BAZĘ! 🚨')
                    .setDescription(`Wyśledzono powiadomienie z serwera: **${foundMapName}**\n\n\`\`\`WBIJAĆ DO GRY BRONIĆ BAZY!\`\`\``)
                    .setColor('#FF0000')
                    .setThumbnail('https://i.imgur.com/8zE7jB0.png')
                    .setTimestamp();
                // Pingujemy wszystkich i wysyłamy nasz dodatek zaraz pod powiadomieniem z Webhooka
                if ('send' in message.channel) {
                    await message.channel.send({
                        content: '@everyone 🚨 **ALARM RAIDOWY!** 🚨',
                        embeds: [alertEmbed],
                        components: [row]
                    });
                }
            }
        }
    }
}
