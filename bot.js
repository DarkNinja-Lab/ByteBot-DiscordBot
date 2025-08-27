const { Client, GatewayIntentBits, Collection, REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const db = require('./db'); // Importiere die ausgelagerte Datenbankverbindung
const logModule = require('./log'); // Importiere das Logging-Modul

// Debug-Modus prüfen
const isDebug = process.argv.includes('--debug');


// Globale Variablen initialisieren
global.queue = []; // Warteschlange
global.player = null; // Audio-Player
global.connection = null; // Voice-Connection

console.log('✅ [INFO] Globale Variablen initialisiert.');

// Bot-Client initialisieren
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates, // Voice-State-Updates erlauben
        GatewayIntentBits.GuildMembers, // Erforderlich für guildMemberAdd
        GatewayIntentBits.GuildMessageReactions,
    ],
});

console.log(`🤖 [INFO] Bot-Client initialisiert mit den richtigen Intents. Debug-Modus: ${isDebug ? 'Aktiviert' : 'Deaktiviert'}`);

// Überprüfe Umgebungsvariablen
if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_APPLICATION_ID) {
    console.error('❌ [ERROR] DISCORD_TOKEN oder DISCORD_APPLICATION_ID fehlt in der .env-Datei.');
    process.exit(1);
}

// Befehle vorbereiten
client.commands = new Collection();
if (!fs.existsSync('./commands')) {
    console.error('❌ [ERROR] Das Verzeichnis ./commands wurde nicht gefunden.');
    process.exit(1);
}

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Befehle laden
console.log('📂 [INFO] Lade Befehle...');
for (const file of commandFiles) {
    try {
        const command = require(`./commands/${file}`);
        if (!command.data || !command.execute) {
            console.warn(`⚠️ [WARN] Befehl ${file} ist nicht korrekt definiert.`);
            continue;
        }

        if (command.data instanceof SlashCommandBuilder) {
            client.commands.set(command.data.name, command);
            console.log(`✔️ [DEBUG] Befehl erfolgreich geladen: ${command.data.name}`);
        } else {
            console.warn(`⚠️ [WARN] Befehl ${file} hat keine gültige data-Struktur.`);
        }
    } catch (error) {
        console.error(`❌ [ERROR] Fehler beim Laden des Befehls ${file}:`, error.message || error);
    }
}

// Event-Handler vorbereiten
console.log('📂 [INFO] Lade Events...');
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    try {
        const event = require(`./events/${file}`);
        if (event.name && event.execute) {
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, db));
            } else {
                client.on(event.name, (...args) => event.execute(...args, db));
            }
            console.log(`✔️ [DEBUG] Event erfolgreich registriert: ${event.name}`);
        } else {
            console.warn(`⚠️ [WARN] Event ${file} ist nicht korrekt definiert.`);
        }
    } catch (error) {
        console.error(`❌ [ERROR] Fehler beim Registrieren des Events ${file}:`, error.message || error);
    }
}

// Utils-Module laden
console.log('📂 [INFO] Lade Utils...');
const utilsPath = path.join(__dirname, 'utils');
if (!fs.existsSync(utilsPath)) {
    console.error('❌ [ERROR] Der Ordner ./utils wurde nicht gefunden.');
    process.exit(1);
}

const utilsFiles = fs.readdirSync(utilsPath).filter(file => file.endsWith('.js'));
client.utils = {};

for (const file of utilsFiles) {
    try {
        const utilName = path.parse(file).name;
        client.utils[utilName] = require(`./utils/${file}`);
        console.log(`✔️ [DEBUG] Utils-Modul erfolgreich geladen: ${utilName}`);
    } catch (error) {
        console.error(`❌ [ERROR] Fehler beim Laden des Utils-Moduls ${file}:`, error.message || error);
    }
}

// Event: Bot bereit
client.once('ready', async () => {
    console.log(`🎉 [INFO] Bot erfolgreich eingeloggt als ${client.user.tag}`);
    console.log(`🌐 [INFO] Der Bot ist auf ${client.guilds.cache.size} Servern aktiv.`);

    client.guilds.cache.forEach(guild => {
        console.log(`   - ${guild.name} (ID: ${guild.id})`);
    });

    console.log('🔄 [INFO] Synchronisiere Slash-Befehle...');
    const commands = client.commands.map(command => command.data.toJSON());
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID),
            { body: commands }
        );
        console.log('✅ [INFO] Slash-Befehle erfolgreich synchronisiert.');
    } catch (error) {
        console.error('❌ [ERROR] Fehler beim Synchronisieren der Slash-Befehle:', error.message || error);
    }

    // Bestehende Reaktionen verarbeiten
    if (client.utils.processExistingReactions) {
        await client.utils.processExistingReactions(client, db);
    }
});

// Slash-Command-Handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) {
        console.log('➡️ [DEBUG] Keine gültige Command-Interaktion, überspringe...');
        return;
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.warn(`⚠️ [WARN] Unbekannter Befehl: ${interaction.commandName}`);
        return;
    }

    try {
        console.log(`🚀 [INFO] Führe Befehl aus: ${interaction.commandName}`);
        await command.execute(interaction, db);
    } catch (error) {
        console.error(`❌ [ERROR] Fehler beim Ausführen des Befehls ${interaction.commandName}:`, error.message || error);
        await interaction.reply({
            content: '❌ Es gab einen Fehler beim Ausführen dieses Befehls.',
            ephemeral: true,
        });
    }
});

// Logging-System initialisieren
if (logModule) {
    logModule(client, db);
}

// Bot starten
console.log('🔄 [INFO] Starte Bot...');
client.login(process.env.DISCORD_TOKEN)
    .then(() => {
        console.log('✅ [INFO] Bot erfolgreich eingeloggt.');
    })
    .catch(error => {
        console.error('❌ [ERROR] Fehler beim Einloggen des Bots:', error.message || error);
    });
