const db = require('../db');

module.exports = {
    // Ruft die Benutzer-Daten ab oder erstellt einen neuen Eintrag
    async getUserData(userId, guildId) {
        const result = await db.query('SELECT * FROM levels WHERE user_id = ? AND guild_id = ?', [userId, guildId]);
        if (result.length === 0) {
            await db.query('INSERT INTO levels (user_id, guild_id) VALUES (?, ?)', [userId, guildId]);
            return { xp: 0, level: 0, isNew: true }; // Neuer Benutzer
        }
        return { ...result[0], isNew: false };
    },

    // Fügt einem Benutzer XP hinzu und prüft, ob ein Level-Up erfolgt oder ob es der erste Punkt ist
    async addXP(userId, guildId, amount, client) {
        const userData = await this.getUserData(userId, guildId);
        const isNew = userData.isNew;
        const levelPoints = await this.getLevelPoints(guildId); // Dynamische Punkte pro Level
        const newXP = userData.xp + amount;
        let newLevel = userData.level;

        // Benutzer zum ersten Mal Punkte erhalten
        if (isNew) {
            // Level-Up-Kanal abrufen
            const result = await db.query('SELECT channel_id FROM levelup_channels WHERE guild_id = ?', [guildId]);
            const channelId = result[0]?.channel_id;

            if (channelId) {
                const channel = await client.channels.fetch(channelId).catch(() => null);
                if (channel) {
                    channel.send(`🎉 Willkommen <@${userId}>! Du hast gerade deinen ersten Punkt verdient. Viel Spaß beim Leveln! 🚀`);
                }
            }
        }

        // Überprüfen, ob ein Level-Up erfolgt
        if (newXP >= levelPoints) {
            newLevel += 1;
            await db.query('UPDATE levels SET xp = ?, level = ? WHERE user_id = ? AND guild_id = ?', [newXP - levelPoints, newLevel, userId, guildId]);

            // Level-Up-Kanal abrufen
            const result = await db.query('SELECT channel_id FROM levelup_channels WHERE guild_id = ?', [guildId]);
            const channelId = result[0]?.channel_id;

            if (channelId) {
                const channel = await client.channels.fetch(channelId).catch(() => null);
                if (channel) {
                    channel.send(`🎉 <@${userId}> hat Level ${newLevel} erreicht! Herzlichen Glückwunsch!`);
                }
            }

            return { levelUp: true, newLevel };
        } else {
            await db.query('UPDATE levels SET xp = ? WHERE user_id = ? AND guild_id = ?', [newXP, userId, guildId]);
            return { levelUp: false };
        }
    },

    // Ruft die Punkte ab, die für das nächste Level benötigt werden
    async getLevelPoints(guildId) {
        const result = await db.query('SELECT points_per_level FROM level_settings WHERE guild_id = ?', [guildId]);
        return result[0]?.points_per_level || 100; // Standard: 100 Punkte pro Level
    },

    // Setzt das Level und die XP eines Benutzers zurück
    async resetUserLevel(userId, guildId) {
        await db.query('UPDATE levels SET xp = 0, level = 0 WHERE user_id = ? AND guild_id = ?', [userId, guildId]);
    },

    // Gibt die Top 10 Benutzer des Servers zurück
    async getLeaderboard(guildId) {
        return await db.query('SELECT * FROM levels WHERE guild_id = ? ORDER BY level DESC, xp DESC LIMIT 10', [guildId]);
    }
};
