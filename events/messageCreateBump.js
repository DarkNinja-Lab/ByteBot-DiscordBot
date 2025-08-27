const db = require('../db'); // Verbindung zur Datenbank

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        // Überprüfe, ob die Nachricht vom Disboard-Bot stammt
        if (message.author.id === '302050872383242240') { // Disboard-Bot-ID
            if (message.embeds.length > 0) {
                const embed = message.embeds[0];

                if (embed.title === 'DISBOARD: Die öffentliche Serverliste' &&
                    embed.description?.includes('Bump erfolgreich!')) {
                    
                    const guildId = message.guild.id;

                    try {
                        // Aktualisiere den Zeitstempel des letzten Bumps in der Datenbank
                        await db.query(`
                            UPDATE bump_reminders
                            SET last_bump = NOW()
                            WHERE guild_id = ?
                        `, [guildId]);

                        console.log(`✅ Letzter Bump-Zeitpunkt für Guild ${guildId} wurde aktualisiert.`);

                        // Hole Reminder-Einstellungen aus der Datenbank
                        const result = await db.query(`
                            SELECT channel_id, role_id
                            FROM bump_reminders
                            WHERE guild_id = ?
                        `, [guildId]);

                        // Überprüfe, ob die Abfrage ein Ergebnis geliefert hat
                        if (!result || result.length === 0) {
                            console.log(`⚠️ Keine Reminder-Einstellungen für Guild ${guildId} gefunden.`);
                            return;
                        }

                        const { channel_id, role_id } = result[0];

                        // Logge die abgerufenen Werte
                        console.log(`📋 Guild ID: ${guildId}`);
                        console.log(`📋 Kanal ID: ${channel_id}`);
                        console.log(`📋 Rollen ID: ${role_id}`);

                        // Überprüfe, ob die Kanal- und Rollen-IDs gültig sind
                        if (!channel_id || !role_id) {
                            console.log(`⚠️ Ungültige Kanal- oder Rollen-ID für Guild ${guildId}: channel_id=${channel_id}, role_id=${role_id}`);
                            return;
                        }

                        // Sende eine Nachricht, dass der Timer gestartet wurde
                        let channel;
                        try {
                            channel = await client.channels.fetch(channel_id);
                            if (!channel) {
                                console.log(`⚠️ Kanal mit ID ${channel_id} konnte nicht gefunden werden.`);
                                return;
                            }
                        } catch (error) {
                            console.error(`❌ Fehler beim Abrufen des Kanals mit ID ${channel_id}:`, error);
                            return;
                        }

                        await channel.send({
                            embeds: [{
                                title: '⏰ Bump-Timer gestartet!',
                                description: 'Ich erinnere euch in **2 Stunden** ⏳, den Server erneut zu bumpen! 🚀',
                                color: 0x00bfff, // Blau
                                footer: { text: '🤖 Disboard Bump Reminder' },
                            }],
                        });
                        console.log(`🔔 Benachrichtigung über gestarteten Timer an Kanal ${channel_id} gesendet.`);

                        // Starte den Timer (2 Stunden)
                        setTimeout(async () => {
                            try {
                                const role = await message.guild.roles.fetch(role_id);
                                if (!role) {
                                    console.log(`⚠️ Rolle mit ID ${role_id} konnte nicht gefunden werden.`);
                                    return;
                                }

                                if (channel) {
                                    await channel.send({
                                        content: `⏰ ${role}, es ist Zeit, den Server erneut zu bumpen! 🚀 Verwende \`/bump\` mit dem Disboard-Bot. 💬`,
                                        embeds: [{
                                            title: '🔔 Bump-Reminder!',
                                            description: '❗ Vergiss nicht, den Server zu bumpen! ✅',
                                            color: 0x00ff00, // Grün
                                            footer: { text: '🤖 Disboard Bump Reminder' },
                                        }],
                                    });
                                    console.log(`✅ Bump-Reminder für Guild ${guildId} gesendet.`);
                                } else {
                                    console.log(`⚠️ Kanal für Guild ${guildId} nicht gefunden.`);
                                }
                            } catch (error) {
                                console.error(`❌ Fehler beim Senden des Bump-Reminders für Guild ${guildId}:`, error);
                            }
                        }, 2 * 60 * 60 * 1000); // 2 Stunden in Millisekunden

                        console.log(`🕒 Bump-Timer für Guild ${guildId} gestartet.`);
                    } catch (error) {
                        console.error(`❌ Fehler beim Aktualisieren des letzten Bump-Zeitpunkts für Guild ${guildId}:`, error);
                        console.log(`➡️ Details:
                        - Guild ID: ${guildId}
                        - Channel ID: ${channel_id || 'Nicht definiert'}
                        - Role ID: ${role_id || 'Nicht definiert'}`);
                    }
                }
            }
        }
    },
};
