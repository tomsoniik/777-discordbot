import { Client, Events, REST, Routes } from 'discord.js';
import { commands } from '../commands';
import { ENV } from '../config/env';
import { UnturnedTracker } from '../services/UnturnedTracker';

export async function onReady(client: Client) {
    console.log(`Bot logged in as ${client.user?.tag}`);

    try {
        const rest = new REST({ version: '10' }).setToken(ENV.DISCORD_TOKEN);
        console.log('Rozpoczęto rejestrację (/) commands.');

        const allCommands = commands.map(c => c.data.toJSON());
        
        if (ENV.GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(client.user!.id, ENV.GUILD_ID),
                { body: allCommands },
            );
            console.log('Pomyślnie zarejestrowano (/) commands dla gildii.');
        } else {
            await rest.put(
                Routes.applicationCommands(client.user!.id),
                { body: allCommands },
            );
            console.log('Pomyślnie zarejestrowano globalne (/) commands.');
        }
    } catch (error) {
        console.error(error);
    }

    const tracker = new UnturnedTracker(client);
    tracker.start();
}
