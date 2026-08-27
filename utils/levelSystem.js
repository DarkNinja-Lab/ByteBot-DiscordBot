const {
    EmbedBuilder,
} = require('discord.js');

const db = require('../db');

const MIN_XP_PER_MESSAGE = 8;
const MAX_XP_PER_MESSAGE = 15;
const MESSAGE_COOLDOWN_MS = 60 * 1000;
const MIN_MESSAGE_LENGTH = 3;

const xpCooldowns = new Map();
const userQueues = new Map();

async function withUserLock(key, callback) {
    const previousJob = userQueues.get(key) || Promise.resolve();

    let releaseCurrentJob;

    const currentJob = new Promise(resolve => {
        releaseCurrentJob = resolve;
    });

    userQueues.set(
        key,
        previousJob
            .catch(() => null)
            .then(() => currentJob)
    );

    await previousJob.catch(() => null);

    try {
        return await callback();
    } finally {
        releaseCurrentJob();

        if (userQueues.get(key) === currentJob) {
            userQueues.delete(key);
        }
    }
}

async function getUserData(userId, guildId) {
    const rows = await db.query(
        `
            SELECT id, user_id, guild_id, xp, level
            FROM levels
            WHERE user_id = ?
              AND guild_id = ?
            LIMIT 1
        `,
        [userId, guildId]
    );

    if (!rows?.length) {
        return null;
    }

    return {
        ...rows[0],
        xp: Number(rows[0].xp) || 0,
        level: Number(rows[0].level) || 0,
        isNew: false,
    };
}

async function ensureUserData(userId, guildId) {
    await db.query(
        `
            INSERT INTO levels (
                user_id,
                guild_id,
                xp,
                level
            )
            VALUES (?, ?, 0, 0)
            ON DUPLICATE KEY UPDATE
                user_id = VALUES(user_id),
                guild_id = VALUES(guild_id)
        `,
        [userId, guildId]
    );

    return getUserData(userId, guildId);
}

async function getLevelPoints(guildId) {
    const rows = await db.query(
        `
            SELECT points_per_level
            FROM level_settings
            WHERE guild_id = ?
            LIMIT 1
        `,
        [guildId]
    );

    const value = Number(rows?.[0]?.points_per_level);

    return Number.isFinite(value) && value > 0
        ? value
        : 100;
}

function getRequiredXP(level, baseXP = 100) {
    const safeLevel = Math.max(0, Number(level) || 0);
    const safeBaseXP = Math.max(1, Number(baseXP) || 100);

    return safeBaseXP + safeLevel * 25;
}

async function addXP(userId, guildId, amount, client) {
    const lockKey = `${guildId}:${userId}`;

    return withUserLock(lockKey, async () => {
        const now = Date.now();
        const lastAward = xpCooldowns.get(lockKey) || 0;

        if (now - lastAward < MESSAGE_COOLDOWN_MS) {
            return {
                awarded: false,
                amount: 0,
                levelUp: false,
                reason: 'cooldown',
            };
        }

        const safeAmount = Math.max(0, Number(amount) || 0);

        if (!safeAmount) {
            return {
                awarded: false,
                amount: 0,
                levelUp: false,
                reason: 'invalid_amount',
            };
        }

        const userData = await ensureUserData(userId, guildId);

        if (!userData) {
            throw new Error(
                'Leveldaten konnten nicht erstellt oder geladen werden.'
            );
        }

        const baseXP = await getLevelPoints(guildId);

        const oldLevel = Number(userData.level) || 0;
        let newLevel = oldLevel;
        let newXP = Number(userData.xp) || 0;

        newXP += safeAmount;

        while (
            newXP >= getRequiredXP(newLevel, baseXP)
        ) {
            newXP -= getRequiredXP(newLevel, baseXP);
            newLevel++;
        }

        await db.query(
            `
                UPDATE levels
                SET xp = ?,
                    level = ?
                WHERE user_id = ?
                  AND guild_id = ?
            `,
            [newXP, newLevel, userId, guildId]
        );

        xpCooldowns.set(lockKey, now);

        const levelUp = newLevel > oldLevel;

        if (levelUp && client) {
            await sendLevelUpMessage(
                client,
                guildId,
                userId,
                oldLevel,
                newLevel,
                newXP,
                baseXP
            );
        }

        return {
            awarded: true,
            amount: safeAmount,
            levelUp,
            oldLevel,
            newLevel,
            xp: newXP,
            xpForNextLevel: getRequiredXP(newLevel, baseXP),
        };
    });
}

async function resetUserLevel(userId, guildId) {
    await db.query(
        `
            UPDATE levels
            SET xp = 0,
                level = 0
            WHERE user_id = ?
              AND guild_id = ?
        `,
        [userId, guildId]
    );

    xpCooldowns.delete(`${guildId}:${userId}`);
}

async function deleteUserData(userId, guildId) {
    await db.query(
        `
            DELETE FROM levels
            WHERE user_id = ?
              AND guild_id = ?
        `,
        [userId, guildId]
    );

    xpCooldowns.delete(`${guildId}:${userId}`);
}

async function getLeaderboard(guildId) {
    return db.query(
        `
            SELECT user_id, guild_id, xp, level
            FROM levels
            WHERE guild_id = ?
            ORDER BY level DESC, xp DESC
            LIMIT 10
        `,
        [guildId]
    );
}

async function getUserRank(userId, guildId) {
    const rows = await db.query(
        `
            SELECT user_id
            FROM levels
            WHERE guild_id = ?
            ORDER BY level DESC, xp DESC
        `,
        [guildId]
    );

    const index = rows.findIndex(
        row => String(row.user_id) === String(userId)
    );

    return index === -1 ? null : index + 1;
}

async function sendLevelUpMessage(
    client,
    guildId,
    userId,
    oldLevel,
    newLevel,
    currentXP,
    baseXP
) {
    try {
        const rows = await db.query(
            `
                SELECT channel_id
                FROM levelup_channels
                WHERE guild_id = ?
                LIMIT 1
            `,
            [guildId]
        );

        const channelId = rows?.[0]?.channel_id;

        if (!channelId) {
            return;
        }

        const channel = await client.channels
            .fetch(channelId)
            .catch(() => null);

        if (!channel?.isTextBased()) {
            return;
        }

        const member = await channel.guild.members
            .fetch(userId)
            .catch(() => null);

        const avatarURL = member?.user?.displayAvatarURL({
            extension: 'png',
            size: 256,
        });

        const requiredXP = getRequiredXP(newLevel, baseXP);

        const embed = new EmbedBuilder()
            .setColor(0x8b5cf6)
            .setTitle('✨ Level-Up erreicht!')
            .setDescription(
                `Glückwunsch <@${userId}>!\n` +
                `Du hast **Level ${newLevel}** erreicht.`
            )
            .addFields(
                {
                    name: '🏅 Neues Level',
                    value: `**Level ${newLevel}**`,
                    inline: true,
                },
                {
                    name: '⭐ Aktuelle XP',
                    value: `**${currentXP} / ${requiredXP} XP**`,
                    inline: true,
                },
                {
                    name: '📈 Fortschritt',
                    value: `**+${newLevel - oldLevel} Level**`,
                    inline: true,
                }
            )
            .setFooter({
                text: 'ByteBot • Levelsystem',
            })
            .setTimestamp();

        if (avatarURL) {
            embed.setThumbnail(avatarURL);
        }

        await channel.send({
            content: `<@${userId}>`,
            embeds: [embed],
            allowedMentions: {
                users: [userId],
            },
        });
    } catch (error) {
        console.error(
            '❌ [ERROR] Level-Up-Nachricht konnte nicht gesendet werden:',
            error.message || error
        );
    }
}

module.exports = {
    MIN_XP_PER_MESSAGE,
    MAX_XP_PER_MESSAGE,
    MESSAGE_COOLDOWN_MS,
    MIN_MESSAGE_LENGTH,
    getUserData,
    ensureUserData,
    addXP,
    getLevelPoints,
    getRequiredXP,
    resetUserLevel,
    deleteUserData,
    getLeaderboard,
    getUserRank,
};