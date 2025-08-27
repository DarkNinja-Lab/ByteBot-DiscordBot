const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Überspringt den aktuellen Track'),
    async execute(interaction) {
        if (!global.player || global.player.state.status === 'idle') {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Yellow')
                        .setTitle('⚠️ Kein Song wird gerade abgespielt.')
                        .setDescription('Die Warteschlange scheint leer zu sein. Füge einen neuen Song mit `/play` hinzu!')
                ],
            });
        }

        // Embed für das Überspringen
        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('⏭️ Song wird übersprungen...')
            .setDescription('Bitte einen Moment Geduld, der nächste Song wird geladen... 🎵')
            .setFooter({ text: 'Danke für deine Geduld!' });

        // Antwort mit Embed, sichtbar für alle
        await interaction.reply({ embeds: [embed] });

        // Überspringt den aktuellen Song
        global.player.stop();
    },
};
