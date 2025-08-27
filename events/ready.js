const db = require('../db'); // Verbindung zu deiner MariaDB

module.exports = {
    name: 'ready',
    once: true,
    execute: async (client) => {
        console.log(`🎉 [INFO] Bot erfolgreich eingeloggt als ${client.user.tag}`);
        console.log(`🌐 [INFO] Der Bot ist auf ${client.guilds.cache.size} Servern aktiv.`);
        client.guilds.cache.forEach(guild => {
            console.log(`   - ${guild.name} (ID: ${guild.id})`);
        });
    },
};
