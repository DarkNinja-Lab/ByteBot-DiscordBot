const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('feedback-send')
        .setDescription('📩 Sende Feedback oder eine Idee an die Admins.')
        .addStringOption(option =>
            option.setName('nachricht')
                .setDescription('Dein Feedback oder deine Idee.')
                .setRequired(true)
        ),
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const feedbackMessage = interaction.options.getString('nachricht');

        try {
            // Hole die Feedback-Einstellungen aus der Datenbank
            const rows = await db.query(
                'SELECT feedback_channel_id FROM feedback_settings WHERE guild_id = ?',
                [guildId]
            );

            // Überprüfen, ob rows vorhanden ist und die feedback_channel_id gesetzt ist
            if (!rows || rows.length === 0 || !rows[0].feedback_channel_id) {
                return interaction.reply({
                    content: '❌ Es wurde kein Feedback-Kanal festgelegt. Bitte wende dich an einen Administrator.',
                    ephemeral: true,
                });
            }

            // Holen des Feedback-Kanals mit der Channel-ID
            const feedbackChannelId = rows[0].feedback_channel_id;
            const feedbackChannel = interaction.guild.channels.cache.get(feedbackChannelId);

            // Überprüfen, ob der Kanal existiert
            if (!feedbackChannel) {
                return interaction.reply({
                    content: '❌ Der Feedback-Kanal ist nicht mehr verfügbar. Bitte wende dich an einen Administrator.',
                    ephemeral: true,
                });
            }

            // Erstelle das Embed mit dem Feedback
            const feedbackEmbed = new EmbedBuilder()
                .setTitle('📩 Neues Feedback')
                .setDescription(feedbackMessage)
                .setColor('Green')
                .setFooter({
                    text: `Von: ${interaction.user.tag} | User ID: ${interaction.user.id}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setTimestamp();

            // Sende das Feedback als Embed in den Feedback-Kanal
            await feedbackChannel.send({ embeds: [feedbackEmbed] });

            // Bestätige dem Benutzer das erfolgreiche Senden
            return interaction.reply({
                content: '✅ Dein Feedback wurde erfolgreich gesendet. Danke für deine Rückmeldung!',
                ephemeral: true,
            });

        } catch (error) {
            // Fehlerbehandlung falls etwas schief geht
            console.error('❌ Fehler beim Senden des Feedbacks:', error);
            return interaction.reply({
                content: '❌ Es gab einen Fehler beim Senden deines Feedbacks. Bitte versuche es später erneut.',
                ephemeral: true,
            });
        }
    },
};