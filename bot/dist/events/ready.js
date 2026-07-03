"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onReady = onReady;
const discord_js_1 = require("discord.js");
const commands_1 = require("../commands");
const env_1 = require("../config/env");
const UnturnedTracker_1 = require("../services/UnturnedTracker");
async function onReady(client) {
    console.log(`Bot logged in as ${client.user?.tag}`);
    try {
        const rest = new discord_js_1.REST({ version: '10' }).setToken(env_1.ENV.DISCORD_TOKEN);
        console.log('Rozpoczęto rejestrację (/) commands.');
        const allCommands = commands_1.commands.map(c => c.data.toJSON());
        if (env_1.ENV.GUILD_ID) {
            await rest.put(discord_js_1.Routes.applicationGuildCommands(client.user.id, env_1.ENV.GUILD_ID), { body: allCommands });
            console.log('Pomyślnie zarejestrowano (/) commands dla gildii.');
        }
        else {
            await rest.put(discord_js_1.Routes.applicationCommands(client.user.id), { body: allCommands });
            console.log('Pomyślnie zarejestrowano globalne (/) commands.');
        }
    }
    catch (error) {
        console.error(error);
    }
    const tracker = new UnturnedTracker_1.UnturnedTracker(client);
    tracker.start();
}
