import { Message, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { ENV } from '../config/env';

export async function onMessageCreate(message: Message) {
    if (message.author.bot) return;

    if (message.content === '!ticketsetup' && message.member?.permissions.has('Administrator')) {
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Stwórz Ticket (Aplikuj)')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`${ENV.WEB_URL}/apply`)
            );

    if ('send' in message.channel) {
        await message.channel.send({
            content: 'Kliknij poniższy przycisk, aby przejść do panelu rekrutacji i wypełnić formularz logując się przez Steam:',
            components: [row]
        });
    }
    }
}
