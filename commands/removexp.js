const { SlashCommandBuilder } = require('discord.js');
const levelSystem = require('../utils/levelSystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xp-remove')
        .setDescription('Setzt die XP eines Users zurück (Admin-Only)')
        .addUserOption(option => option.setName('user').setDescription('Wähle den User').setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) return interaction.reply('Du hast keine Berechtigung!');

        const user = interaction.options.getUser('user');
        const guildId = interaction.guild.id;

        await levelSystem.resetUserLevel(user.id, guildId);
        interaction.reply(`Level und XP von ${user.username} wurden zurückgesetzt.`);
    }
};
