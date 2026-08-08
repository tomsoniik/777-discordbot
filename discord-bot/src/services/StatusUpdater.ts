import fs from 'fs/promises';
import path from 'path';
import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { logger } from '../utils/logger';
import { PREDEFINED_SERVERS } from './UnturnedTracker';
import { A2SQuery } from './A2SQuery';

interface StatusPanel {
    channelId: string;
    messageId: string;
}

const PANELS_FILE = path.join(process.cwd(), 'status-panels.json');

class StatusUpdaterManager {
    private client: Client | null = null;
    private interval: NodeJS.Timeout | null = null;
    private panels: StatusPanel[] = [];

    public async loadPanels() {
        try {
            const data = await fs.readFile(PANELS_FILE, 'utf-8');
            this.panels = JSON.parse(data);
        } catch (e) {
            this.panels = [];
        }
    }

    public async savePanels() {
        try {
            await fs.writeFile(PANELS_FILE, JSON.stringify(this.panels, null, 2));
        } catch (e) {
            logger.error(e as Error, 'Błąd zapisu status-panels.json');
        }
    }

    public async addPanel(channelId: string, messageId: string) {
        this.panels.push({ channelId, messageId });
        await this.savePanels();
    }

    public init(client: Client) {
        this.client = client;
        this.loadPanels().then(() => {
            this.interval = setInterval(() => {
                this.updateAllPanels();
            }, 60000); // 1 minute
            logger.info('Uruchomiono StatusUpdater (co 1 minutę).');
        });
    }

    public stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    public async generateEmbed(): Promise<EmbedBuilder> {
        const embed = new EmbedBuilder()
            .setTitle('🌍 STATUS SERWERÓW UNBEATEN')
            .setColor('#00ffaa')
            .setFooter({ text: 'Aktualizacja co 1 minutę' })
            .setTimestamp();

        let totalPlayers = 0;
        let onlineServersCount = 0;

        for (const [key, server] of Object.entries(PREDEFINED_SERVERS)) {
            // Dodajemy opóźnienie 1.5s aby nie dostać rate limitu od Steam API
            await new Promise(r => setTimeout(r, 1500));
            const status = await A2SQuery.getServerStatus(server.ip, server.port, server.serverId);
            const displayName = server.displayName || key.toUpperCase();

            if (status) {
                onlineServersCount++;
                totalPlayers += status.playersCount;

                embed.addFields({
                    name: `🟢 ${displayName}`,
                    value: `Graczy: **${status.playersCount}/${status.maxPlayers}** | Mapa: \`${status.map}\`\n🔗 **Direct Connect:** \`steam://connect/${status.ipPort}\``,
                    inline: false,
                });
            } else {
                embed.addFields({
                    name: `🔴 ${displayName}`,
                    value: `Brak odpowiedzi lub serwer offline`,
                    inline: false,
                });
            }
        }

        embed.setFooter({
            text: `Aktywne serwery: ${onlineServersCount}/${Object.keys(PREDEFINED_SERVERS).length} | Łącznie graczy: ${totalPlayers}`,
        });

        return embed;
    }

    private async updateAllPanels() {
        if (this.panels.length === 0 || !this.client) return;

        try {
            const embed = await this.generateEmbed();
            const invalidIndexes: number[] = [];

            for (let i = 0; i < this.panels.length; i++) {
                const panel = this.panels[i];
                try {
                    const channel = await this.client.channels.fetch(panel.channelId) as TextChannel;
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
                } catch (e) {
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
        } catch (e) {
            logger.error(e as Error, 'Błąd podczas odświeżania paneli statusu');
        }
    }
}

export const statusUpdater = new StatusUpdaterManager();
