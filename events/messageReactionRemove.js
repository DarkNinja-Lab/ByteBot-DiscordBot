const db = require('../db');
const emoji = require('node-emoji');

module.exports = {
    name: 'messageReactionRemove',
    async execute(reaction, user) {
        if (user.bot) return;

        let emojiIdentifier;
        if (reaction.emoji.id) {
            emojiIdentifier = reaction.emoji.name; // Benutzerdefiniertes Emoji
        } else {
            const foundEmoji = emoji.find(reaction.emoji.name);
            if (foundEmoji) {
                emojiIdentifier = foundEmoji.key; // Standard-Emoji
            } else {
                console.error(`[ERROR] Emoji konnte nicht als Kurzcode konvertiert werden: ${reaction.emoji.name}`);
                return;
            }
        }

        const messageId = reaction.message.id;

        try {
            const sql = `SELECT * FROM reaction_roles WHERE message_id = ? AND emoji = ?`;
            const rows = await db.query(sql, [messageId, emojiIdentifier]);

            if (rows.length > 0) {
                const roleId = rows[0].role_id;
                const role = reaction.message.guild.roles.cache.get(roleId);
                if (!role) {
                    console.error(`[ERROR] Rolle mit ID ${roleId} nicht gefunden.`);
                    return;
                }

                const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
                if (!member) {
                    console.error(`[ERROR] Mitglied mit ID ${user.id} nicht gefunden.`);
                    return;
                }

                if (member.roles.cache.has(role.id)) {
                    await member.roles.remove(role);
                    console.log(`[INFO] Rolle "${role.name}" wurde von ${member.user.tag} entfernt.`);
                } else {
                    console.log(`[INFO] Mitglied ${member.user.tag} hat die Rolle "${role.name}" nicht.`);
                }
            } else {
                console.log(`[INFO] Keine passende Rolle für Emoji ${emojiIdentifier} gefunden.`);
            }
        } catch (error) {
            console.error(`[ERROR] Fehler beim Entfernen der Rolle:`, error);
        }
    },
};
