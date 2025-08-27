const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js'); // Stelle sicher, dass EmbedBuilder importiert ist
const db = require('../db');  // Importiere die DB-Verbindung

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearmessages')
        .setDescription('Löscht eine bestimmte Anzahl an Nachrichten.')
        .addIntegerOption(option =>
            option.setName('anzahl')
                .setDescription('Die Anzahl der Nachrichten, die gelöscht werden sollen.')
                .setRequired(true)),

    async execute(interaction) {
        // Überprüfen, ob der Benutzer Administrator ist
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({
                content: '❌ Du hast keine Berechtigung, diesen Befehl auszuführen. Nur Administratoren können Nachrichten löschen.',
                ephemeral: true,
            });
        }

        const anzahl = interaction.options.getInteger('anzahl');

        // Validierung der Eingabe (maximal 100 Nachrichten)
        if (anzahl < 1 || anzahl > 100) {
            return interaction.reply({
                content: '❌ Die Anzahl der zu löschenden Nachrichten muss zwischen 1 und 100 liegen.',
                ephemeral: true,
            });
        }

        try {
            // Löschen der Nachrichten
            const messages = await interaction.channel.messages.fetch({ limit: anzahl });
            await interaction.channel.bulkDelete(messages, true);

            // Erfolgsantwort an den Benutzer
            await interaction.reply({
                content: `✅ Erfolgreich **${anzahl}** Nachrichten gelöscht.`,
                ephemeral: true,
            });

            // Log-Nachricht für das Löschen der Nachrichten (Nach der Antwort)
            const embed = new EmbedBuilder()
                .setColor('#FF6347')
                .setTitle('🗑️ Nachrichten gelöscht')
                .setDescription(`**Administrator**: ${interaction.user.tag}\n**Gelöschte Nachrichten**: ${anzahl} Nachrichten`)
                .setTimestamp()
                .setFooter({ text: 'Bot Log' });

            // Log-Nachricht senden
            const rows = await db.query('SELECT log_channel_id FROM config WHERE guild_id = ?', [interaction.guild.id]);
            if (rows.length > 0) {
                const logChannelId = rows[0].log_channel_id;
                const logChannel = await interaction.guild.channels.fetch(logChannelId);
                if (logChannel) {
                    logChannel.send({ embeds: [embed] });
                }
            }

        } catch (error) {
            console.error('❌ Fehler beim Löschen der Nachrichten:', error);
            interaction.reply({
                content: '❌ Es gab einen Fehler beim Löschen der Nachrichten. Bitte versuche es später noch einmal.',
                ephemeral: true,
            });
        }
    },
};
