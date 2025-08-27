const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const db = require('../db'); // Datenbank-Anbindung

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-bump-reminder')
        .setDescription('Setzt den Reminder-Kanal und die zu pingende Rolle.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Der Kanal, in dem der Reminder gesendet wird.')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Die Rolle, die gepingt wird.')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'Nur Administratoren können diesen Befehl verwenden!', ephemeral: true });
        }

        const channel = interaction.options.getChannel('channel');
        const role = interaction.options.getRole('role');
        const guildId = interaction.guild.id;

        try {
            // Speichern oder Aktualisieren in der Datenbank
            await db.query(`
                INSERT INTO bump_reminders (guild_id, channel_id, role_id)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE
                channel_id = VALUES(channel_id),
                role_id = VALUES(role_id);
            `, [guildId, channel.id, role.id]);

            await interaction.reply(`Bump-Reminder wurde gesetzt: Kanal ${channel} und Rolle ${role}.`);
        } catch (error) {
            console.error('[ERROR] Fehler beim Setzen des Bump-Reminders:', error);
            await interaction.reply({
                content: 'Es gab einen Fehler beim Speichern des Bump-Reminders. Bitte versuche es später erneut.',
                ephemeral: true,
            });
        }
    },
};
