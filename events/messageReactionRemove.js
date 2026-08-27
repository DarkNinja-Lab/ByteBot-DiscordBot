const emoji = require('node-emoji');

const db = require('../db');
const permissions = require('../utils/permissions');

module.exports = {
    name: 'messageReactionRemove',
    once: false,

    async execute(reaction, user) {
        if (user?.bot) {
            return;
        }

        if (reaction?.partial) {
            const fetchedReaction = await reaction
                .fetch()
                .catch(() => null);

            if (!fetchedReaction) {
                return;
            }
        }

        const guild = reaction?.message?.guild;

        if (!guild) {
            return;
        }

        const emojiIdentifier = normalizeReactionEmoji(
            reaction.emoji
        );

        if (!emojiIdentifier) {
            return;
        }

        try {
            const rows = await db.query(
                `
                    SELECT role_id
                    FROM reaction_roles
                    WHERE guild_id = ?
                      AND message_id = ?
                      AND emoji = ?
                    LIMIT 1
                `,
                [
                    guild.id,
                    reaction.message.id,
                    emojiIdentifier,
                ]
            );

            if (!rows.length) {
                return;
            }

            const role = await guild.roles
                .fetch(rows[0].role_id)
                .catch(() => null);

            if (!role) {
                console.warn(
                    `⚠️ [WARN] Rolle mit ID ${rows[0].role_id} konnte nicht gefunden werden.`
                );

                return;
            }

            if (!permissions.canManageRole(guild, role)) {
                console.warn(
                    `⚠️ [WARN] Rolle "${role.name}" kann vom Bot nicht verwaltet werden.`
                );

                return;
            }

            const member = await permissions.fetchMember(
                guild,
                user.id
            );

            if (!member) {
                return;
            }

            if (!member.roles.cache.has(role.id)) {
                return;
            }

            await member.roles.remove(
                role,
                'Reaction Role entfernt'
            );

            console.log(
                `✅ [INFO] Rolle "${role.name}" wurde von ${member.user.tag} entfernt.`
            );
        } catch (error) {
            console.error(
                '❌ [ERROR] Fehler beim Entfernen einer Reaction Role:',
                error.message || error
            );
        }
    },
};

function normalizeReactionEmoji(reactionEmoji) {
    if (!reactionEmoji) {
        return null;
    }

    if (reactionEmoji.id) {
        return reactionEmoji.name || reactionEmoji.id;
    }

    const unicodeName = reactionEmoji.name;

    if (!unicodeName) {
        return null;
    }

    const foundEmoji = emoji.find(unicodeName);

    if (foundEmoji) {
        return foundEmoji.key;
    }

    return unicodeName;
}