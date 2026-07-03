import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { Command } from '../../types';
import { GameDig } from 'gamedig';

export const checkServersCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('check_servers')
        .setDescription('Sprawdza, na którym porcie serwer Unturned poprawnie zwraca listę graczy')
        .addStringOption(option => 
            option.setName('ip')
                .setDescription('Adres IP serwera (np. 123.45.67.89)')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('port')
                .setDescription('Główny port gry (np. 27015)')
                .setRequired(true)),
    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        const ip = interaction.options.getString('ip', true);
        const gamePort = interaction.options.getInteger('port', true);
        
        const portsToTest = [gamePort, gamePort + 1, gamePort + 2];
        let resultMessage = `🔍 **Analiza serwera ${ip}:${gamePort}**\n\n`;

        for (const port of portsToTest) {
            try {
                const state = await GameDig.query({
                    type: 'unturned',
                    host: ip,
                    port: port,
                    maxRetries: 2,
                    requestRules: true
                });

                const playerNames = state.players
                    .map((p: any) => p.name)
                    .filter((name: any) => name && name.trim() !== '');

                resultMessage += `✅ **Port ${port}:** ZNALAZŁEM!\n`;
                resultMessage += `Liczba graczy: ${playerNames.length}/${state.maxplayers}\n`;
                
                if (playerNames.length > 0) {
                    // Ograniczamy do pierwszych 30 nicków, żeby nie przebić limitu Discorda (2000 znaków)
                    const sample = playerNames.slice(0, 30).join(', ');
                    resultMessage += `Nicki: ${sample}${playerNames.length > 30 ? ' ...i więcej' : ''}\n\n`;
                } else {
                    resultMessage += `Serwer odpowiedział, ale nie przesłał nicków (mogą być ukryte).\n\n`;
                }
                
                // Mamy to co chcieliśmy, kończymy szukanie
                await interaction.editReply(resultMessage);
                return;

            } catch (error: any) {
                resultMessage += `❌ **Port ${port}:** Brak odpowiedzi\n`;
            }
        }
        
        resultMessage += `\n⚠️ **Żaden z portów nie zwrócił poprawnej odpowiedzi A2S.** (Ochrona serwera blokuje zapytania gamedig z zewnątrz)`;
        await interaction.editReply(resultMessage);
    }
};
