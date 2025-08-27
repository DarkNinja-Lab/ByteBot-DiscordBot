const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xp-setlevelreward')
        .setDescription('Setzt eine Belohnung für ein bestimmtes Level (Admin-Only)')
        .addIntegerOption(option => option.setName('level').setDescription('Das Level').setRequired(true))
        .addStringOption(option => option.setName('reward').setDescription('Die Belohnung').setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) return interaction.reply('Du hast keine Berechtigung!');

        const level = interaction.options.getInteger('level');
        const reward = interaction.options.getString('reward');

        // Implementiere die Logik zum Speichern der Belohnungen in der Datenbank
        interaction.reply(`Belohnung "${reward}" für Level ${level} wurde gesetzt.`);
    }
};
