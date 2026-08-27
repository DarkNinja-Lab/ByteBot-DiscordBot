const {
    Client,
    GatewayIntentBits,
    Collection,
    REST,
    Routes,
    SlashCommandBuilder,
} = require('discord.js');

const fs = require('fs');
const path = require('path');

require('dotenv').config();

const db = require('./db');
const logModule = require('./log');

const isDebug = process.argv.includes('--debug');

let shuttingDown = false;

global.queue = [];
global.player = null;
global.connection = null;

console.log('✅ [INFO] Globale Variablen initialisiert.');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
    ],
});

console.log(
    `🤖 [INFO] Bot-Client initialisiert. ` +
    `Debug-Modus: ${isDebug ? 'Aktiviert' : 'Deaktiviert'}`
);

if (
    !process.env.DISCORD_TOKEN ||
    !process.env.DISCORD_APPLICATION_ID
) {
    console.error(
        '❌ [ERROR] DISCORD_TOKEN oder DISCORD_APPLICATION_ID fehlt.'
    );

    process.exit(1);
}

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');

if (!fs.existsSync(commandsPath)) {
    console.error(
        '❌ [ERROR] Das Verzeichnis ./commands wurde nicht gefunden.'
    );

    process.exit(1);
}

console.log('📂 [INFO] Lade Befehle...');

const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    try {
        const command = require(path.join(commandsPath, file));

        if (
            !command.data ||
            !command.execute ||
            !(command.data instanceof SlashCommandBuilder)
        ) {
            console.warn(
                `⚠️ [WARN] Befehl ${file} ist nicht korrekt definiert.`
            );

            continue;
        }

        if (client.commands.has(command.data.name)) {
            console.warn(
                `⚠️ [WARN] Doppelte Command-Definition ignoriert: ${command.data.name}`
            );

            continue;
        }

        client.commands.set(command.data.name, command);

        console.log(
            `✔️ [DEBUG] Befehl erfolgreich geladen: ${command.data.name}`
        );
    } catch (error) {
        console.error(
            `❌ [ERROR] Fehler beim Laden des Befehls ${file}:`,
            error.message || error
        );
    }
}

console.log('📂 [INFO] Lade Utils...');

const utilsPath = path.join(__dirname, 'utils');
client.utils = {};

if (fs.existsSync(utilsPath)) {
    const utilsFiles = fs
        .readdirSync(utilsPath)
        .filter(file => file.endsWith('.js'));

    for (const file of utilsFiles) {
        try {
            const utilName = path.parse(file).name;

            client.utils[utilName] = require(
                path.join(utilsPath, file)
            );

            console.log(
                `✔️ [DEBUG] Utils-Modul erfolgreich geladen: ${utilName}`
            );
        } catch (error) {
            console.error(
                `❌ [ERROR] Fehler beim Laden des Utils-Moduls ${file}:`,
                error.message || error
            );
        }
    }
}

console.log('📂 [INFO] Lade Events...');

const eventsPath = path.join(__dirname, 'events');

const zentralVerarbeiteteEvents = new Set([
    'ready.js',
    'processExistingReactions.js',
]);

const registrierteEvents = new Set();

if (fs.existsSync(eventsPath)) {
    const eventFiles = fs
        .readdirSync(eventsPath)
        .filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        if (zentralVerarbeiteteEvents.has(file)) {
            console.log(
                `⏭️ [DEBUG] Event zentral verarbeitet: ${file}`
            );

            continue;
        }

        try {
            const event = require(path.join(eventsPath, file));

            if (!event.name || !event.execute) {
                console.warn(
                    `⚠️ [WARN] Event ${file} ist nicht korrekt definiert.`
                );

                continue;
            }

            if (registrierteEvents.has(event.name)) {
                console.warn(
                    `⚠️ [WARN] Doppelte Event-Registrierung verhindert: ${event.name}`
                );

                continue;
            }

            registrierteEvents.add(event.name);

            const handler = (...args) => {
                Promise.resolve(
                    event.execute(...args, db)
                ).catch(error => {
                    console.error(
                        `❌ [ERROR] Fehler im Event ${event.name}:`,
                        error.message || error
                    );
                });
            };

            if (event.once) {
                client.once(event.name, handler);
            } else {
                client.on(event.name, handler);
            }

            console.log(
                `✔️ [DEBUG] Event erfolgreich registriert: ${event.name}`
            );
        } catch (error) {
            console.error(
                `❌ [ERROR] Fehler beim Registrieren von ${file}:`,
                error.message || error
            );
        }
    }
}

client.once('clientReady', async () => {
    try {
        console.log(
            `🎉 [INFO] Bot erfolgreich eingeloggt als ${client.user.tag}`
        );

        console.log(
            `🌐 [INFO] Der Bot ist auf ` +
            `${client.guilds.cache.size} Servern aktiv.`
        );

        client.guilds.cache.forEach(guild => {
            console.log(
                `   - ${guild.name} (ID: ${guild.id})`
            );
        });

        console.log(
            '🧹 [INFO] Bereinige ehemalige Mitglieder...'
        );

        if (client.utils.cleanupDepartedMembers?.execute) {
            await client.utils.cleanupDepartedMembers.execute(client);
        }

        console.log(
            '🔄 [INFO] Synchronisiere Slash-Befehle...'
        );

        const commands = client.commands.map(command =>
            command.data.toJSON()
        );

        const rest = new REST({
            version: '10',
        }).setToken(process.env.DISCORD_TOKEN);

        await rest.put(
            Routes.applicationCommands(
                process.env.DISCORD_APPLICATION_ID
            ),
            {
                body: commands,
            }
        );

        console.log(
            '✅ [INFO] Slash-Befehle erfolgreich synchronisiert.'
        );

        console.log(
            '🔄 [INFO] Verarbeite bestehende Reaction Roles...'
        );

        const processExistingReactions = require(
            path.join(
                eventsPath,
                'processExistingReactions.js'
            )
        );

        if (processExistingReactions?.execute) {
            await processExistingReactions.execute(client, db);
        }

        console.log(
            '✅ [INFO] Bestehende Reaction Roles wurden verarbeitet.'
        );

        console.log(
            '✅ [INFO] ByteBot ist vollständig betriebsbereit.'
        );
    } catch (error) {
        console.error(
            '❌ [ERROR] Fehler im Startup-Ablauf:',
            error.message || error
        );
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const command = client.commands.get(
        interaction.commandName
    );

    if (!command) {
        console.warn(
            `⚠️ [WARN] Unbekannter Befehl: ${interaction.commandName}`
        );

        return;
    }

    try {
        await command.execute(interaction, db);
    } catch (error) {
        console.error(
            `❌ [ERROR] Fehler beim Befehl ${interaction.commandName}:`,
            error.message || error
        );

        const response = {
            content:
                '❌ Beim Ausführen des Befehls ist ein Fehler aufgetreten.',
            ephemeral: true,
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(response).catch(() => null);
        } else {
            await interaction.reply(response).catch(() => null);
        }
    }
});

if (typeof logModule === 'function') {
    logModule(client);
}

async function shutdown(signal) {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    console.log(
        `🛑 [INFO] ${signal} empfangen. Bot wird sauber beendet...`
    );

    try {
        global.queue.length = 0;

        if (global.connection) {
            global.connection.destroy?.();
            global.connection = null;
        }

        global.player?.stop?.();
        global.player = null;

        client.destroy();

        await db.close();

        console.log(
            '✅ [INFO] Bot wurde sauber heruntergefahren.'
        );

        process.exit(0);
    } catch (error) {
        console.error(
            '❌ [ERROR] Fehler beim Herunterfahren:',
            error.message || error
        );

        process.exit(1);
    }
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', error => {
    console.error(
        '❌ [ERROR] Nicht behandelte Promise-Ablehnung:',
        error
    );
});

process.on('uncaughtException', error => {
    console.error(
        '❌ [ERROR] Nicht abgefangene Ausnahme:',
        error
    );
});

console.log('🔄 [INFO] Starte Bot...');

db.testConnection()
    .then(() => client.login(process.env.DISCORD_TOKEN))
    .catch(error => {
        console.error(
            '❌ [ERROR] Bot konnte nicht gestartet werden:',
            error.message || error
        );

        process.exit(1);
    });