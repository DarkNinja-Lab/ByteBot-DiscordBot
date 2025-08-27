const { SlashCommandBuilder } = require('discord.js');
const db = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removereactionrole')
        .setDescription('Entfernt eine Reaction Role und bereinigt die Reaktionen.')
        .addStringOption(option =>
            option.setName('channel')
                .setDescription('Channel-ID, in dem sich die Nachricht befindet.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('messageid')
                .setDescription('Die ID der Nachricht, von der die Reaction Role entfernt werden soll.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('Das Emoji, das der zu entfernenden Reaction Role zugeordnet ist.')
                .setRequired(true)),

    async execute(interaction) {
        // Admin-Berechtigungsprüfung
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({
                content: '❌ Du hast keine Berechtigung, diesen Befehl auszuführen.',
                ephemeral: true,
            });
        }

        const channelId = interaction.options.getString('channel');
        const messageId = interaction.options.getString('messageid');
        let emoji = interaction.options.getString('emoji');

        // Extrahiere die Emoji-ID, falls es ein benutzerdefiniertes Emoji ist
        emoji = emoji.match(/\d+/)?.[0] || emoji;

        // Channel und Nachricht holen
        const channel = await interaction.guild.channels.fetch(channelId);
        if (!channel) return interaction.reply({ content: '❌ Channel nicht gefunden.', ephemeral: true });

        const message = await channel.messages.fetch(messageId).catch(() => null);
        if (!message) return interaction.reply({ content: '❌ Nachricht nicht gefunden.', ephemeral: true });

        // Datenbankeintrag löschen
        const sql = `
            DELETE FROM reaction_roles
            WHERE message_id = ? AND emoji = ?
        `;
        const result = await db.query(sql, [messageId, emoji]);

        if (result.affectedRows === 0) {
            return interaction.reply({
                content: `⚠️ Keine Reaction Role mit der Nachricht-ID \`${messageId}\` und dem Emoji \`${emoji}\` gefunden.`,
                ephemeral: true,
            });
        }

        // Reaktionen von der Nachricht entfernen
        const reaction = message.reactions.cache.get(emoji);
        if (reaction) {
            const users = await reaction.users.fetch();

            for (const user of users.values()) {
                if (user.bot) continue;

                // Entferne die Rolle von Benutzern, die reagiert haben
                const member = await interaction.guild.members.fetch(user.id).catch(() => null);
                if (member) {
                    const sqlRole = `SELECT role_id FROM reaction_roles WHERE message_id = ? AND emoji = ?`;
                    const roleRow = await db.query(sqlRole, [messageId, emoji]);
                    
                    if (roleRow.length > 0) {
                        const roleId = roleRow[0].role_id;
                        const role = interaction.guild.roles.cache.get(roleId);
                        if (role && member.roles.cache.has(roleId)) {
                            await member.roles.remove(role).catch(console.error);
                        }
                    }
                }
            }

            // Entferne die Reaktion von der Nachricht
            await reaction.remove().catch(console.error);
        }

        // Erfolgsmeldung
        interaction.reply({
            content: `✅ Die Reaction Role mit Emoji \`${emoji}\` wurde entfernt, und alle zugehörigen Reaktionen wurden bereinigt.`,
            ephemeral: true,
        });
    },
};
