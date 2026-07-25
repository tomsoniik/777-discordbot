"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onInteractionCreate = onInteractionCreate;
const commands_1 = require("../commands");
async function onInteractionCreate(interaction) {
    if (interaction.isChatInputCommand()) {
        try {
            const command = commands_1.commands.find(c => c.data.name === interaction.commandName);
            if (command) {
                await command.execute(interaction);
            }
        }
        catch (e) {
            console.error('Błąd podczas obsługi komendy:', e);
            const errMsg = e instanceof Error ? e.message : String(e);
            if (interaction.isRepliable()) {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply(`Wystąpił nieoczekiwany błąd podczas wykonywania tej komendy: \`${errMsg}\``);
                }
                else {
                    await interaction.reply({ content: `Wystąpił nieoczekiwany błąd podczas wykonywania tej komendy: \`${errMsg}\``, flags: 64 });
                }
            }
        }
    }
    else if (interaction.isButton()) {
        if (interaction.customId.startsWith('music_')) {
            await interaction.reply({ content: 'Panel sterowania został wyłączony w nowej wersji systemu.', flags: 64 });
        }
    }
}
