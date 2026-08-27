const db = require('../db');

module.exports = {
    async execute(client) {
        console.log(
            '[INFO] Starte Bereinigung ehemaliger Mitglieder...'
        );

        let deletedLevelEntries = 0;
        let removedReactions = 0;
        let invalidRoles = 0;

        for (const guild of client.guilds.cache.values()) {
            try {
                console.log(
                    `[INFO] Prüfe Server "${guild.name}"...`
                );

                await guild.members.fetch();

                const levelRows = await db.query(
                    `
                        SELECT id, user_id
                        FROM levels
                        WHERE guild_id = ?
                    `,
                    [guild.id]
                );

                for (const row of levelRows) {
                    if (guild.members.cache.has(row.user_id)) {
                        continue;
                    }

                    await db.query(
                        `
                            DELETE FROM levels
                            WHERE id = ?
                              AND guild_id = ?
                        `,
                        [row.id, guild.id]
                    );

                    deletedLevelEntries++;
                }

                const reactionRoles = await db.query(
                    `
                        SELECT message_id, channel_id, emoji, role_id
                        FROM reaction_roles
                        WHERE guild_id = ?
                    `,
                    [guild.id]
                );

                for (const reactionRole of reactionRoles) {
                    const role = await guild.roles
                        .fetch(reactionRole.role_id)
                        .catch(() => null);

                    if (!role) {
                        invalidRoles++;
                    }

                    const channel = await guild.channels
                        .fetch(reactionRole.channel_id)
                        .catch(() => null);

                    if (!channel?.messages) {
                        continue;
                    }

                    const message = await channel.messages
                        .fetch(reactionRole.message_id)
                        .catch(() => null);

                    if (!message) {
                        continue;
                    }

                    const reaction = findReaction(
                        message,
                        reactionRole.emoji
                    );

                    if (!reaction) {
                        continue;
                    }

                    const users = await reaction.users
                        .fetch()
                        .catch(() => null);

                    if (!users) {
                        continue;
                    }

                    for (const user of users.values()) {
                        if (user.bot) {
                            continue;
                        }

                        if (guild.members.cache.has(user.id)) {
                            continue;
                        }

                        await reaction.users
                            .remove(user.id)
                            .catch(() => null);

                        removedReactions++;
                    }
                }
            } catch (error) {
                console.error(
                    `❌ [ERROR] Bereinigung für "${guild.name}" fehlgeschlagen:`,
                    error.message || error
                );
            }
        }

        console.log(
            `[INFO] Bereinigung abgeschlossen: ` +
            `${deletedLevelEntries} Level-Einträge gelöscht, ` +
            `${removedReactions} alte Reaktionen entfernt, ` +
            `${invalidRoles} ungültige Rollen gefunden.`
        );
    },
};

function findReaction(message, storedEmoji) {
    const identifier = String(storedEmoji || '').trim();

    if (!identifier) {
        return null;
    }

    const directReaction = message.reactions.cache.get(identifier);

    if (directReaction) {
        return directReaction;
    }

    return message.reactions.cache.find(reaction => {
        return (
            reaction.emoji.name === identifier ||
            reaction.emoji.name === convertShortcode(identifier)
        );
    });
}

function convertShortcode(value) {
    const shortcodeMap = {
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

    return shortcodeMap[value] || value;
}