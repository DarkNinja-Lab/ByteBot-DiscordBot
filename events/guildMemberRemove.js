const leaveMessages = [
    '👋 {username} hat den Server verlassen. Alles Gute!',
    '🚪 {username} ist raus. Danke für alles!',
    '😢 {username} hat uns verlassen. Bis bald!',
    '🖐 {username} hat den Server verlassen. Wir sehen uns!',
    '🚪 {username} geht, aber die Tür steht offen.',
    '📤 {username} hat den Server verlassen. Mach’s gut!',
    '👋 {username} ist raus. Danke, dass du dabei warst.',
    '💼 Auf Wiedersehen, {username}. Alles Gute!',
    '🛡 {username} hat sich abgemeldet. Bis zum nächsten Mal!',
    '⚡ {username} hat den Server verlassen. Pass auf dich auf.',
];

module.exports = {
    name: 'guildMemberRemove',
    once: false,

    execute: async (member, db) => {
        const guildId = member.guild.id;
        const userId = member.user.id;

        console.log(
            `⬅️ [DEBUG] Mitglied ${member.user.tag} (${userId}) hat den Server verlassen.`
        );

        // 1. Level-/XP-Daten des Benutzers löschen
        try {
            const result = await db.query(
                'DELETE FROM levels WHERE user_id = ? AND guild_id = ?',
                [userId, guildId]
            );

            const affectedRows = result?.affectedRows ?? result?.[0]?.affectedRows ?? 0;

            if (affectedRows > 0) {
                console.log(
                    `🗑️ [INFO] Level-Daten von ${member.user.tag} wurden gelöscht.`
                );
            } else {
                console.log(
                    `ℹ️ [INFO] Keine Level-Daten für ${member.user.tag} gefunden.`
                );
            }
        } catch (error) {
            console.error(
                `❌ [ERROR] Level-Daten von ${member.user.tag} konnten nicht gelöscht werden:`,
                error
            );
        }

        // 2. Alte Reaction-Role-Reaktionen des Benutzers entfernen
        try {
            const reactionRoles = await db.query(`
                SELECT message_id, channel_id, emoji
                FROM reaction_roles
                WHERE guild_id = ?
            `, [guildId]);

            for (const reactionRole of reactionRoles) {
                const {
                    message_id: messageId,
                    channel_id: channelId,
                    emoji: storedEmoji,
                } = reactionRole;

                if (!channelId || !messageId || !storedEmoji) {
                    continue;
                }

                const channel = await member.guild.channels
                    .fetch(channelId)
                    .catch(() => null);

                if (!channel || !channel.messages) {
                    continue;
                }

                const message = await channel.messages
                    .fetch(messageId)
                    .catch(() => null);

                if (!message) {
                    continue;
                }

                const reaction = findReaction(message, storedEmoji);

                if (!reaction) {
                    continue;
                }

                await reaction.users
                    .remove(userId)
                    .catch(() => null);

                console.log(
                    `🧹 [INFO] Alte Reaction von ${member.user.tag} entfernt: ${storedEmoji}`
                );
            }
        } catch (error) {
            console.error(
                `❌ [ERROR] Alte Reaktionen von ${member.user.tag} konnten nicht bereinigt werden:`,
                error
            );
        }

        // 3. Leave-Nachricht senden
        try {
            const result = await db.query(
                'SELECT welcome_channel_id FROM server_config WHERE guild_id = ?',
                [guildId]
            );

            // Funktioniert sowohl mit mysql2/promise als auch mit direktem Array
            const rows = Array.isArray(result?.[0]) ? result[0] : result;
            const welcomeChannelId = rows?.[0]?.welcome_channel_id;

            if (!welcomeChannelId) {
                console.warn('⚠️ Kein Welcome-/Leave-Channel gesetzt.');
                return;
            }

            const channel = await member.guild.channels
                .fetch(welcomeChannelId)
                .catch(() => null);

            if (!channel) {
                console.warn('⚠️ Welcome-/Leave-Channel existiert nicht mehr.');
                return;
            }

            const message = leaveMessages[
                Math.floor(Math.random() * leaveMessages.length)
            ].replace('{username}', member.user.tag);

            await channel.send({
                content: message,
            });

            console.log(
                `✅ Leave-Message für ${member.user.tag} in #${channel.name} gesendet.`
            );
        } catch (error) {
            console.error(
                '❌ [ERROR] Fehler bei der Leave-Message:',
                error
            );
        }
    },
};

/**
 * Sucht eine Reaction anhand von:
 * - Discord-Emoji-ID
 * - benutzerdefiniertem Emoji-Namen
 * - Unicode-Emoji
 * - node-emoji-Kürzel wie flag-de oder cat
 */
function findReaction(message, storedEmoji) {
    const identifier = String(storedEmoji).trim();

    // Direkte Suche über die Reaction-ID.
    // Bei Custom-Emojis entspricht diese normalerweise der Emoji-ID.
    const directReaction = message.reactions.cache.get(identifier);

    if (directReaction) {
        return directReaction;
    }

    const shortcode = identifier
        .replace(/^:/, '')
        .replace(/:$/, '');

    const unicodeEmoji = getUnicodeEmoji(shortcode);

    return message.reactions.cache.find(reaction => {
        const reactionName = reaction.emoji.name;

        if (!reactionName) {
            return false;
        }

        // Gespeichertes Unicode-Emoji
        if (reactionName === identifier) {
            return true;
        }

        // Gespeichertes node-emoji-Kürzel, z. B. cat -> 🐈
        if (!reaction.emoji.id && unicodeEmoji === reactionName) {
            return true;
        }

        // Custom-Emoji-Name
        if (reaction.emoji.id && reactionName === identifier) {
            return true;
        }

        // Kurzcode ohne Doppelpunkte
        if (reactionName === shortcode) {
            return true;
        }

        return false;
    });
}

/**
 * Kleine Zuordnung für die in deiner Datenbank vorhandenen Emojis.
 * Dadurch funktioniert die Bereinigung auch ohne zusätzliche Änderungen
 * an anderen Dateien.
 */
function getUnicodeEmoji(shortcode) {
    const emojis = {
        'flag-de': '🇩🇪',
        'flag-us': '🇺🇸',
        hammer_and_wrench: '🛠️',
        racing_car: '🏎️',
        cat: '🐈',
        space_engineers: '🚀',
        Assetto_Corsa: '🏎️',
        minecraft: '⛏️',
        overwatch: '🎮',
        't-rex': '🦖',
        gmod: '🎮',
    };

    return emojis[shortcode] || null;
}