const emoji = require('node-emoji');

module.exports = {
    name: 'ready',
    once: true,

    execute: async (client, db) => {
        console.log('[INFO] Scanne bestehende Reaktionen...');

        try {
            const rows = await db.query('SELECT * FROM reaction_roles');

            for (const row of rows) {
                const {
                    guild_id,
                    channel_id,
                    message_id,
                    emoji: emojiCode,
                    role_id,
                } = row;

                const guild = client.guilds.cache.get(guild_id);

                if (!guild) {
                    console.warn(
                        `[WARN] Guild mit ID ${guild_id} konnte nicht gefunden werden.`
                    );
                    continue;
                }

                const channel = await guild.channels.fetch(channel_id).catch(() => null);

                if (!channel) {
                    console.warn(
                        `[WARN] Kanal mit ID ${channel_id} konnte nicht gefunden werden.`
                    );
                    continue;
                }

                const message = await channel.messages
                    .fetch(message_id)
                    .catch(() => null);

                if (!message) {
                    console.warn(
                        `[WARN] Nachricht mit ID ${message_id} konnte nicht gefunden werden.`
                    );
                    continue;
                }

                const reactionEmoji = findeReaktion(message, emojiCode);

                if (!reactionEmoji) {
                    console.warn(
                        `[WARN] Reaktion mit Emoji "${emojiCode}" konnte nicht gefunden werden.`
                    );
                    continue;
                }

                const role = guild.roles.cache.get(role_id);

                if (!role) {
                    console.warn(
                        `[WARN] Rolle mit ID ${role_id} konnte nicht gefunden werden.`
                    );
                    continue;
                }

                const users = await reactionEmoji.users.fetch();

                for (const user of users.values()) {
                    if (user.bot) {
                        continue;
                    }

                    const member = await guild.members
                        .fetch(user.id)
                        .catch(() => null);

                    if (!member) {
                        console.warn(
                            `[WARN] Mitglied mit ID ${user.id} konnte nicht gefunden werden.`
                        );
                        continue;
                    }

                    if (member.roles.cache.has(role.id)) {
                        continue;
                    }

                    try {
                        await member.roles.add(role);

                        console.log(
                            `[INFO] Rolle "${role.name}" wurde ${member.user.tag} zugewiesen.`
                        );
                    } catch (error) {
                        console.error(
                            `[ERROR] Fehler beim Hinzufügen der Rolle "${role.name}" an ${member.user.tag}:`,
                            error
                        );
                    }
                }
            }
        } catch (error) {
            console.error(
                '[ERROR] Fehler beim Verarbeiten der bestehenden Reaktionen:',
                error
            );
        }
    },
};

/**
 * Sucht eine Reaction unabhängig davon,
 * ob in der Datenbank ein Unicode-Emoji,
 * ein node-emoji-Kürzel, ein benutzerdefinierter Emoji-Name
 * oder eine Emoji-ID gespeichert ist.
 */
function findeReaktion(message, gespeichertesEmoji) {
    if (!gespeichertesEmoji) {
        return null;
    }

    const gespeicherterWert = String(gespeichertesEmoji).trim();

    // 1. Direkte Suche nach einer benutzerdefinierten Emoji-ID
    const direkteReaction = message.reactions.cache.get(gespeicherterWert);

    if (direkteReaction) {
        return direkteReaction;
    }

    // 2. node-emoji-Kürzel auflösen, zum Beispiel:
    // flag-de -> 🇩🇪
    // hammer_and_wrench -> 🛠️
    const shortcode = gespeicherterWert
        .replace(/^:/, '')
        .replace(/:$/, '');

    const unicodeEmoji = emoji.get(shortcode);

    return message.reactions.cache.find(reaction => {
        const reactionName = reaction.emoji.name;

        if (!reactionName) {
            return false;
        }

        // Unicode-Emoji vergleichen
        if (!reaction.emoji.id && unicodeEmoji === reactionName) {
            return true;
        }

        // Gespeicherten Emoji-Namen vergleichen
        if (reactionName === gespeicherterWert) {
            return true;
        }

        // Gespeicherten Namen ohne Doppelpunkte vergleichen
        if (reactionName === shortcode) {
            return true;
        }

        // Benutzerdefiniertes Emoji:
        // Der Datenbankwert kann der Name sein.
        if (reaction.emoji.id && reactionName === gespeicherterWert) {
            return true;
        }

        return false;
    });
}