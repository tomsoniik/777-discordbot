import { logger } from '../utils/logger';
import { Client, REST, Routes } from 'discord.js';
import { commands } from '../commands';
import { ENV } from '../config/env';
import { UnturnedTracker } from '../services/UnturnedTracker';
import { statusUpdater } from '../services/StatusUpdater';

export async function onReady(client: Client) {
    logger.info(`Bot logged in as ${client.user?.tag}`);

    try {
        const rest = new REST({ version: '10' }).setToken(ENV.DISCORD_TOKEN);
        logger.info('Rozpoczęto rejestrację (/) commands.');

        const allCommands = commands.map((c) => c.data.toJSON());

        if (ENV.GUILD_ID) {
            await rest.put(Routes.applicationGuildCommands(client.user!.id, ENV.GUILD_ID), { body: allCommands });
            logger.info('Pomyślnie zarejestrowano (/) commands dla gildii.');
        } else {
            await rest.put(Routes.applicationCommands(client.user!.id), { body: allCommands });
            logger.info('Pomyślnie zarejestrowano globalne (/) commands.');
        }
    } catch (error) {
        logger.error(error);
    }

    const tracker = new UnturnedTracker(client);
    tracker.start();

    statusUpdater.init(client);
}
