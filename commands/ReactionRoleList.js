const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listreactionroles')
        .setDescription('Zeigt alle gespeicherten Reaction Roles an.'),

    async execute(interaction) {
        // Admin-Berechtigungsprüfung
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({
                content: '❌ Du hast keine Berechtigung, diesen Befehl auszuführen.',
                ephemeral: true,
            });
        }

        // Reaction Roles aus der Datenbank abrufen
        const sql = `
            SELECT message_id, emoji, role_id, channel_id
            FROM reaction_roles
            WHERE guild_id = ?
        `;
        const rows = await db.query(sql, [interaction.guild.id]);

        // Wenn keine Reaction Roles gefunden wurden
        if (rows.length === 0) {
            return interaction.reply({
                content: '⚠️ Es wurden keine Reaction Roles gefunden.',
                ephemeral: true,
            });
        }

        // Erstelle eine Übersicht der Reaction Roles
        const embed = new EmbedBuilder()
            .setColor(0x3498db) // Blau für Informationen
            .setTitle('📋 Übersicht der Reaction Roles')
            .setDescription('Hier sind alle gespeicherten Reaction Roles:')
            .setTimestamp()
            .setFooter({ text: `Angefordert von ${interaction.user.tag}` });

        // Details zu jeder Reaction Role hinzufügen
        rows.forEach(row => {
            const role = interaction.guild.roles.cache.get(row.role_id);
            const channel = interaction.guild.channels.cache.get(row.channel_id);
            embed.addFields({
                name: `Nachricht-ID: ${row.message_id}`,
                value: `- **Emoji:** ${row.emoji}\n- **Rolle:** ${role ? role.name : '❌ (nicht gefunden)'}\n- **Kanal:** ${channel ? `<#${channel.id}>` : '❌ (nicht gefunden)'}`,
            });
        });

        // Sende die Übersicht
        interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
