import { Interaction } from 'discord.js';
import { commands } from '../commands';

export async function onInteractionCreate(interaction: Interaction) {
    if (interaction.isChatInputCommand()) {
        try {
            const command = commands.find(c => c.data.name === interaction.commandName);
            if (command) {
                await command.execute(interaction);
            }
        } catch (e: any) {
            console.error('Błąd podczas obsługi komendy:', e);
            const errMsg = e instanceof Error ? e.message : String(e);
            if (interaction.isRepliable()) {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply(`Wystąpił nieoczekiwany błąd podczas wykonywania tej komendy: \`${errMsg}\``);
                } else {
                    await interaction.reply({ content: `Wystąpił nieoczekiwany błąd podczas wykonywania tej komendy: \`${errMsg}\``, flags: 64 });
                }
            }
        }
    } else if (interaction.isButton()) {
        if (interaction.customId.startsWith('music_')) {
            await interaction.reply({ content: 'Panel sterowania został wyłączony w nowej wersji systemu.', flags: 64 });
        }
    }
}
