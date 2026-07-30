"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onReady = onReady;
const logger_1 = require("../utils/logger");
const discord_js_1 = require("discord.js");
const commands_1 = require("../commands");
const env_1 = require("../config/env");
const UnturnedTracker_1 = require("../services/UnturnedTracker");
async function onReady(client) {
    logger_1.logger.info(`Bot logged in as ${client.user?.tag}`);
    try {
        const rest = new discord_js_1.REST({ version: '10' }).setToken(env_1.ENV.DISCORD_TOKEN);
        logger_1.logger.info('Rozpoczęto rejestrację (/) commands.');
        const allCommands = commands_1.commands.map((c) => c.data.toJSON());
        if (env_1.ENV.GUILD_ID) {
            await rest.put(discord_js_1.Routes.applicationGuildCommands(client.user.id, env_1.ENV.GUILD_ID), { body: allCommands });
            logger_1.logger.info('Pomyślnie zarejestrowano (/) commands dla gildii.');
        }
        else {
            await rest.put(discord_js_1.Routes.applicationCommands(client.user.id), { body: allCommands });
            logger_1.logger.info('Pomyślnie zarejestrowano globalne (/) commands.');
        }
    }
    catch (error) {
        logger_1.logger.error(error);
    }
    const tracker = new UnturnedTracker_1.UnturnedTracker(client);
    tracker.start();
}
