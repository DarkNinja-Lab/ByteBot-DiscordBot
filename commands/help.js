const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hilfe')
        .setDescription('📋 Zeigt eine Liste aller verfügbaren Befehle.'),

    async execute(interaction) {
        console.log(`✅ [DEBUG] /hilfe command executed by ${interaction.user.tag}`);

        // Erstellung des Embed-Builders für die Hilfe
        const embed = new EmbedBuilder()
            .setTitle('📜 Hilfe & Befehle')
            .setDescription(
                'Willkommen zur Hilfe-Seite! Hier findest du alle verfügbaren Befehle, die du verwenden kannst.\n\n' +
                '📢 **Hinweis:** Bei Fragen oder Problemen wende dich bitte an **@Admin** oder **@Management**.'
            )
            .setColor('Purple')
            .setTimestamp()
            .setFooter({
                text: interaction.guild.name,
                iconURL: interaction.guild.iconURL({ dynamic: true }),
            });

        // Allgemeine Befehle hinzufügen
        embed.addFields(
            {
                name: '📋 **Allgemeine Befehle**',
                value:
                    '🎖️ **/level** - Zeigt dein Level und deine Punkte an.\n' +
                    '📝 **/feedback** - Sende Feedback oder Ideen an das Management-Team.\n' +
                    '🏆 **/leaderboard** - Zeigt die Bestenliste der Benutzer.\n\n' +
                    '🔧 **/hilfe** - Zeigt diese Hilfe-Seite an.',
            },
            {
                name: '🎵 **Musik Befehle**',
                value:
                    '🎶 **/play <Titel/URL>** - Spielt einen Song ab.\n' +
                    '⏭️ **/skip** - Überspringt den aktuellen Song.\n\n' +
                    '⏭️ **/stop** - Stop den aktuellen Song.\n\n' +
                    '🔁 **/queue** - Zeigt die Warteschlange.',
            },
        );

        // Debugging Ausgabe
        console.log(`📤 [DEBUG] Sending help embed to ${interaction.user.tag}`);
        
        // Sende das Embed mit den Befehlen
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
