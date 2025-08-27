const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stoppt die Wiedergabe und leert die Warteschlange'),
    async execute(interaction) {
        if (global.player) {
            global.player.stop(true); // Stoppt die Wiedergabe
        }
        if (global.connection) {
            global.connection.destroy(); // Trennt die Verbindung
        }

        global.queue = []; // Leert die Warteschlange
        global.player = null;
        global.connection = null;

        await interaction.reply('🛑 Wiedergabe gestoppt und Warteschlange geleert.');
    },
};
