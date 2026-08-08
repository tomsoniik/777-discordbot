"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusUpdater = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const discord_js_1 = require("discord.js");
const logger_1 = require("../utils/logger");
const UnturnedTracker_1 = require("./UnturnedTracker");
const A2SQuery_1 = require("./A2SQuery");
const PANELS_FILE = path_1.default.join(process.cwd(), 'status-panels.json');
class StatusUpdaterManager {
    client = null;
    interval = null;
    panels = [];
    async loadPanels() {
        try {
            const data = await promises_1.default.readFile(PANELS_FILE, 'utf-8');
            this.panels = JSON.parse(data);
        }
        catch (e) {
            this.panels = [];
        }
    }
    async savePanels() {
        try {
            await promises_1.default.writeFile(PANELS_FILE, JSON.stringify(this.panels, null, 2));
        }
        catch (e) {
            logger_1.logger.error(e, 'Błąd zapisu status-panels.json');
        }
    }
    async addPanel(channelId, messageId) {
        this.panels.push({ channelId, messageId });
        await this.savePanels();
    }
    init(client) {
        this.client = client;
        this.loadPanels().then(() => {
            this.interval = setInterval(() => {
                this.updateAllPanels();
            }, 60000); // 1 minute
            logger_1.logger.info('Uruchomiono StatusUpdater (co 1 minutę).');
        });
    }
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    async generateEmbed() {
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🌐 Status Serwerów Unturned')
            .setColor('#1db954')
            .setDescription('Aktualna liczba graczy i stan serwerów w czasie rzeczywistym. Odświeża się co minutę.')
            .setTimestamp();
        let totalPlayers = 0;
        let onlineServersCount = 0;
        for (const [key, server] of Object.entries(UnturnedTracker_1.PREDEFINED_SERVERS)) {
            const status = await A2SQuery_1.A2SQuery.getServerStatus(server.ip, server.port, server.serverId);
            const displayName = server.displayName || key.toUpperCase();
            if (status) {
                onlineServersCount++;
                totalPlayers += status.playersCount;
                embed.addFields({
                    name: `🟢 ${displayName}`,
                    value: `Graczy: **${status.playersCount}/${status.maxPlayers}** | Mapa: \`${status.map}\`\n🔗 **Direct Connect:** \`steam://connect/${status.ipPort}\``,
                    inline: false,
                });
            }
            else {
                embed.addFields({
                    name: `🔴 ${displayName}`,
                    value: `Brak odpowiedzi lub serwer offline`,
                    inline: false,
                });
            }
        }
        embed.setFooter({
            text: `Aktywne serwery: ${onlineServersCount}/${Object.keys(UnturnedTracker_1.PREDEFINED_SERVERS).length} | Łącznie graczy: ${totalPlayers}`,
        });
        return embed;
    }
    async updateAllPanels() {
        if (this.panels.length === 0 || !this.client)
            return;
        try {
            const embed = await this.generateEmbed();
            const invalidIndexes = [];
            for (let i = 0; i < this.panels.length; i++) {
                const panel = this.panels[i];
                try {
                    const channel = await this.client.channels.fetch(panel.channelId);
                    if (!channel) {
                        invalidIndexes.push(i);
                        continue;
                    }
                    const message = await channel.messages.fetch(panel.messageId);
                    if (!message) {
                        invalidIndexes.push(i);
                        continue;
                    }
                    await message.edit({ embeds: [embed] });
                }
                catch (e) {
                    // Jeśli wiadomość została usunięta lub nie ma dostępu
                    invalidIndexes.push(i);
                }
            }
            if (invalidIndexes.length > 0) {
                for (let i = invalidIndexes.length - 1; i >= 0; i--) {
                    this.panels.splice(invalidIndexes[i], 1);
                }
                await this.savePanels();
            }
        }
        catch (e) {
            logger_1.logger.error(e, 'Błąd podczas odświeżania paneli statusu');
        }
    }
}
exports.statusUpdater = new StatusUpdaterManager();
