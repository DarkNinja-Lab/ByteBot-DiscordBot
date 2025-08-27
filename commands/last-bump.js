const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const db = require('../db'); // Verbindung zur Datenbank

module.exports = {
    data: new SlashCommandBuilder()
        .setName('last-bump')
        .setDescription('Zeigt den Zeitpunkt des letzten Bumps an.'),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'Nur Administratoren können diesen Befehl verwenden!', ephemeral: true });
        }

        const guildId = interaction.guild.id;

        try {
            // Hole den letzten Bump-Zeitstempel aus der Datenbank
            const result = await db.query(`
                SELECT last_bump
                FROM bump_reminders
                WHERE guild_id = ?
            `, [guildId]);

            if (result.length === 0 || !result[0].last_bump) {
                return interaction.reply('Es wurde noch kein Bump-Zeitpunkt gespeichert.');
            }

            const lastBump = new Date(result[0].last_bump).toLocaleString('de-DE', {
                timeZone: 'Europe/Berlin',
                dateStyle: 'short',
                timeStyle: 'short',
            });

            return interaction.reply(`Der letzte Bump war am: **${lastBump}**`);
        } catch (error) {
            console.error('[ERROR] Fehler beim Abrufen des letzten Bump-Zeitpunkts:', error);
            return interaction.reply({
                content: 'Es gab einen Fehler beim Abrufen des letzten Bump-Zeitpunkts. Bitte versuche es später erneut.',
                ephemeral: true,
            });
        }
    },
};
