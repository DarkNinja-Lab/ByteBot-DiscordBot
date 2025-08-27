const emoji = require('node-emoji'); // Emoji-Bibliothek importieren

module.exports = {
    name: 'ready',
    once: true,
    execute: async (client, db) => {
        console.log(`[INFO] Scanne bestehende Reaktionen...`);

        try {
            const sql = `SELECT * FROM reaction_roles`;
            const rows = await db.query(sql);

            for (const row of rows) {
                const { guild_id, channel_id, message_id, emoji: emojiCode, role_id } = row;

                const guild = client.guilds.cache.get(guild_id);
                if (!guild) {
                    console.warn(`[WARN] Guild mit ID ${guild_id} konnte nicht gefunden werden.`);
                    continue;
                }

                const channel = guild.channels.cache.get(channel_id);
                if (!channel) {
                    console.warn(`[WARN] Kanal mit ID ${channel_id} konnte nicht gefunden werden.`);
                    continue;
                }

                const message = await channel.messages.fetch(message_id).catch(() => null);
                if (!message) {
                    console.warn(`[WARN] Nachricht mit ID ${message_id} konnte nicht gefunden werden.`);
                    continue;
                }

                // Emoji suchen
                let reactionEmoji;
                if (emojiCode.startsWith(':') && emojiCode.endsWith(':')) {
                    // Kurzcode-Emoji verarbeiten
                    const emojiName = emojiCode.slice(1, -1); // Entferne die Doppelpunkte
                    reactionEmoji = message.reactions.cache.find(r =>
                        r.emoji.name === emojiName && !r.emoji.id
                    );
                } else {
                    // Benutzerdefiniertes Emoji (ID)
                    reactionEmoji = message.reactions.cache.get(emojiCode);
                }

                if (!reactionEmoji) {
                    console.warn(`[WARN] Reaktion mit Emoji "${emojiCode}" konnte nicht gefunden werden.`);
                    continue;
                }

                // Benutzer sammeln, die reagiert haben
                const users = await reactionEmoji.users.fetch();
                for (const user of users.values()) {
                    if (user.bot) continue;

                    const member = await guild.members.fetch(user.id).catch(() => null);
                    if (!member) {
                        console.warn(`[WARN] Mitglied mit ID ${user.id} konnte nicht gefunden werden.`);
                        continue;
                    }

                    const role = guild.roles.cache.get(role_id);
                    if (!role) {
                        console.warn(`[WARN] Rolle mit ID ${role_id} konnte nicht gefunden werden.`);
                        continue;
                    }

                    // Rolle hinzufügen, wenn der Benutzer sie noch nicht hat
                    if (!member.roles.cache.has(role.id)) {
                        await member.roles.add(role).catch(err => {
                            console.error(`[ERROR] Fehler beim Hinzufügen der Rolle "${role.name}" an ${member.user.tag}:`, err);
                        });
                        console.log(`[INFO] Rolle "${role.name}" wurde ${member.user.tag} zugewiesen.`);
                    }
                }
            }
        } catch (error) {
            console.error(`[ERROR] Fehler beim Verarbeiten der bestehenden Reaktionen:`, error);
        }
    },
};
