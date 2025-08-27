const { SlashCommandBuilder } = require('discord.js');
const db = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xp-setlevelpoints')
        .setDescription('Legt fest, wie viele Punkte für das nächste Level benötigt werden (Admin-Only).')
        .addIntegerOption(option =>
            option.setName('punkte')
                .setDescription('Die Anzahl der Punkte, die für das nächste Level benötigt werden.')
                .setRequired(true)
        ),
    async execute(interaction) {
        // Prüfen, ob der Benutzer Admin ist
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({
                content: 'Du hast keine Berechtigung, diesen Befehl zu verwenden.',
                ephemeral: true
            });
        }

        const points = interaction.options.getInteger('punkte');
        const guildId = interaction.guild.id;

        // Punkte in der Datenbank speichern
        await db.query(
            'INSERT INTO level_settings (guild_id, points_per_level) VALUES (?, ?) ON DUPLICATE KEY UPDATE points_per_level = ?',
            [guildId, points, points]
        );

        interaction.reply(`Die Punkte für das nächste Level wurden erfolgreich auf **${points}** gesetzt.`);
    }
};
