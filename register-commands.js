const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('fs');

// Alle Befehle laden
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

// Discord REST API-Setup
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Starte die Registrierung der Slash-Befehle...');

        // Befehle global registrieren
        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID),
            { body: commands }
        );

        console.log('Erfolgreich alle Slash-Befehle registriert!');
    } catch (error) {
        console.error('Fehler beim Registrieren der Befehle:', error);
    }
})();
