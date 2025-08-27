const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, Colors } = require('discord.js');
const db = require('../db'); // Verbindung zu MariaDB

// Map zum Verfolgen der letzten Zählungen pro Guild
const userMessageTracker = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('counting')
        .setDescription('Befehle für das Counting-Game')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set_looser_role')
                .setDescription('Setzt die Rolle für den Looser')
                .addRoleOption(option =>
                    option.setName('role').setDescription('Die Rolle für den Looser').setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set_winner_role')
                .setDescription('Setzt die Rolle für den Gewinner')
                .addRoleOption(option =>
                    option.setName('role').setDescription('Die Rolle für den Gewinner').setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('reset').setDescription('Setzt das Counting-Spiel zurück')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set_channel')
                .setDescription('Setzt den Counting-Kanal')
                .addChannelOption(option =>
                    option.setName('channel').setDescription('Der Kanal für Counting').setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            console.log(`[DEBUG] Ausführen des Subcommands: ${subcommand}`);

            if (subcommand === 'set_looser_role') {
                const role = interaction.options.getRole('role');
                console.log(`[DEBUG] Looser-Rolle festlegen: ${role.id}`);
                await db.query('UPDATE settings SET looser_role_id = ? WHERE guild_id = ?', [role.id, interaction.guildId]);
                return interaction.reply(`Die Looser-Rolle wurde erfolgreich auf ${role} gesetzt.`);
            }

            if (subcommand === 'set_winner_role') {
                const role = interaction.options.getRole('role');
                console.log(`[DEBUG] Winner-Rolle festlegen: ${role.id}`);
                await db.query('UPDATE settings SET winner_role_id = ? WHERE guild_id = ?', [role.id, interaction.guildId]);
                return interaction.reply(`Die Gewinner-Rolle wurde erfolgreich auf ${role} gesetzt.`);
            }

            if (subcommand === 'reset') {
                console.log(`[DEBUG] Reset des Countings für Guild ID: ${interaction.guildId}`);
                await db.query('UPDATE settings SET count = 0 WHERE guild_id = ?', [interaction.guildId]);
                userMessageTracker.delete(interaction.guildId); // Tracker zurücksetzen
                return interaction.reply('Das Counting-Spiel wurde zurückgesetzt.');
            }

            if (subcommand === 'set_channel') {
                const channel = interaction.options.getChannel('channel');
                console.log(`[DEBUG] Counting-Kanal setzen: ${channel.id}`);
                await db.query('UPDATE settings SET counting_channel_id = ? WHERE guild_id = ?', [channel.id, interaction.guildId]);
                return interaction.reply(`Der Counting-Kanal wurde erfolgreich auf ${channel} gesetzt.`);
            }
        } catch (error) {
            console.error('[ERROR] Fehler beim Ausführen des Subcommands:', error);
            return interaction.reply('Fehler beim Ausführen des Befehls.');
        }
    },

    async countingHandler(message) {
        try {
            console.log(`[DEBUG] Nachricht empfangen von ${message.author.username}: ${message.content}`);

            // Abrufen der Einstellungen aus der Datenbank
            const [rows] = await db.query('SELECT * FROM settings WHERE guild_id = ?', [message.guild.id]);

            // Debugging: Überprüfen der Struktur von rows
            console.log(`[DEBUG] Abfrageergebnisse (Rohdaten) für Guild ID ${message.guild.id}:`, rows);
            console.log(`[DEBUG] Typ von rows:`, typeof rows, Array.isArray(rows));

            // Sicherstellen, dass rows gültig ist und Daten enthält
            let settings;
            if (Array.isArray(rows)) {
                if (rows.length === 0) {
                    console.error(`[ERROR] Keine Einstellungen für Guild ID ${message.guild.id} gefunden.`);
                    await message.reply('⚠️ Das Counting-Spiel ist nicht konfiguriert. Bitte setze es mit `/counting set_channel` auf.');
                    return;
                }
                settings = rows[0];
            } else if (typeof rows === 'object') {
                settings = rows; // Falls rows direkt ein Objekt ist
            } else {
                console.error(`[ERROR] Unerwartete Struktur von rows für Guild ID ${message.guild.id}:`, rows);
                await message.reply('⚠️ Ein unerwarteter Fehler ist aufgetreten. Bitte kontaktiere einen Administrator.');
                return;
            }

            // Debugging: Überprüfen der extrahierten Einstellungen
            console.log(`[DEBUG] Extrahierte Einstellungen:`, settings);

            if (!settings || !settings.counting_channel_id) {
                console.error(`[ERROR] Einstellungen ungültig oder Counting-Kanal nicht definiert für Guild ID ${message.guild.id}.`);
                await message.reply('⚠️ Der Counting-Kanal ist nicht definiert. Bitte konfiguriere das Spiel neu.');
                return;
            }

            const { counting_channel_id, count, looser_role_id } = settings;

            console.log(`[DEBUG] Counting Channel ID: ${counting_channel_id}, Aktueller Zähler: ${count}, Looser Role ID: ${looser_role_id}`);


            // Kanalprüfung: Ignoriere Nachrichten außerhalb des festgelegten Kanals
            if (message.channel.id !== counting_channel_id) {
                console.log(`[DEBUG] Nachricht aus nicht definiertem Kanal ignoriert: ${message.channel.id}`);
                return;
            }

            const nextCount = count + 1;
            console.log(`[DEBUG] Erwartete nächste Zahl: ${nextCount}`);

            // Benutzerprüfung: Verhindern, dass ein Benutzer mehr als 2 Mal hintereinander zählt
            const userCounts = userMessageTracker.get(message.guild.id) || { lastUser: null, consecutiveCount: 0 };

            if (userCounts.lastUser === message.author.id) {
                userCounts.consecutiveCount += 1;
            } else {
                userCounts.lastUser = message.author.id;
                userCounts.consecutiveCount = 1;
            }

            userMessageTracker.set(message.guild.id, userCounts);

            if (userCounts.consecutiveCount > 2) {
                console.log(`[DEBUG] Benutzer ${message.author.username} hat das Limit überschritten.`);
                await message.reply('⚠️ Du kannst nur zweimal hintereinander zählen! Lass jemand anderen zählen.');
                return;
            }

            // Überprüfen, ob die Nachricht die nächste erwartete Zahl ist
            if (parseInt(message.content) !== nextCount) {
                console.log(`[DEBUG] Falsche Zahl erhalten: ${message.content}, Erwartet: ${nextCount}`);
                const looserRole = message.guild.roles.cache.get(looser_role_id);

                const embed = new EmbedBuilder()
                    .setTitle('Oh neeeein!')
                    .setDescription(`${message.author} hat sich Verzählt! Das Spiel beginnt von vorne.`)
                    .setColor(Colors.Red);

                // Looser-Rolle zuweisen, falls vorhanden
                if (looserRole) {
                    const member = message.guild.members.cache.get(message.author.id);
                    if (member) {
                        console.log(`[DEBUG] Looser-Rolle hinzufügen zu ${message.author.username}`);
                        await member.roles.add(looserRole).catch(error => {
                            console.error('[ERROR] Fehler beim Hinzufügen der Looser-Rolle:', error);
                        });
                    } else {
                        console.error(`[ERROR] Mitglied ${message.author.username} konnte nicht gefunden werden.`);
                    }
                }

                await message.channel.send({ embeds: [embed] });

                // Zähler zurücksetzen und Map leeren
                console.log(`[DEBUG] Zähler wird zurückgesetzt.`);
                await db.query('UPDATE settings SET count = 0 WHERE guild_id = ?', [message.guild.id]);
                userMessageTracker.delete(message.guild.id);
                console.log(`[DEBUG] Zähler erfolgreich auf 0 zurückgesetzt.`);
            } else {
                // Zähler aktualisieren
                console.log(`[DEBUG] Zahl korrekt: ${nextCount}`);
                await db.query('UPDATE settings SET count = ? WHERE guild_id = ?', [nextCount, message.guild.id]);
                console.log(`[DEBUG] Zähler erfolgreich aktualisiert auf ${nextCount}.`);
                await message.react('✅');
            }
        } catch (error) {
            console.error('[ERROR] Fehler im Counting-Handler:', error);
        }
    },
};
