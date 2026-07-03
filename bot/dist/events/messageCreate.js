"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onMessageCreate = onMessageCreate;
const discord_js_1 = require("discord.js");
const env_1 = require("../config/env");
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
}
