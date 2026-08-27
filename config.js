const db = require('./db');

async function getLogChannelId(guildId) {
    if (!guildId) {
        return null;
    }

    try {
        const rows = await db.query(
            `
                SELECT log_channel_id
                FROM config
                WHERE guild_id = ?
                LIMIT 1
            `,
            [guildId]
        );

        return rows?.[0]?.log_channel_id || null;
    } catch (error) {
        console.error(
            '❌ [ERROR] Log-Kanal konnte nicht geladen werden:',
            error.message || error
        );

        return null;
    }
}

async function setLogChannelId(guildId, channelId) {
    if (!guildId || !channelId) {
        throw new Error(
            'guildId und channelId sind erforderlich.'
        );
    }

    await db.query(
        `
            INSERT INTO config (
                guild_id,
                log_channel_id
            )
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE
                log_channel_id = VALUES(log_channel_id)
        `,
        [guildId, channelId]
    );

    console.log(
        `✅ [INFO] Log-Kanal für Server ${guildId} gespeichert.`
    );
}

async function clearLogChannelId(guildId) {
    if (!guildId) {
        return;
    }

    await db.query(
        `
            UPDATE config
            SET log_channel_id = NULL
            WHERE guild_id = ?
        `,
        [guildId]
    );
}

module.exports = {
    getLogChannelId,
    setLogChannelId,
    clearLogChannelId,
};