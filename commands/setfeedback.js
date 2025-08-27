const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const db = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('feedback-setoutput')
        .setDescription('📩 Setzt den Kanal für Feedback-Nachrichten (Admin-Only).')
        .addChannelOption(option => 
            option.setName('kanal')
                .setDescription('Der Kanal, in dem Feedback gesendet werden soll.')
                .setRequired(true)
        ),
    async execute(interaction) {
        // Überprüfen, ob der Benutzer Administratorrechte hat
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: '❌ Du hast keine Berechtigung, diesen Befehl zu verwenden.',
                ephemeral: true,
            });
        }

        const guildId = interaction.guild.id;
        const feedbackChannel = interaction.options.getChannel('kanal');

        try {
            // Speichere den Feedback-Kanal in der Datenbank
            await db.query(
                'INSERT INTO feedback_settings (guild_id, feedback_channel_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE feedback_channel_id = ?',
                [guildId, feedbackChannel.id, feedbackChannel.id]
            );

            return interaction.reply({
                content: `✅ Feedback-Kanal wurde erfolgreich auf ${feedbackChannel} gesetzt.`,
                ephemeral: true,
            });
        } catch (error) {
            console.error('❌ Fehler beim Festlegen des Feedback-Kanals:', error);
            return interaction.reply({
                content: '❌ Es gab einen Fehler beim Festlegen des Feedback-Kanals. Bitte versuche es später erneut.',
                ephemeral: true,
            });
        }
    },
};
