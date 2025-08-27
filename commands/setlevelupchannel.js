const { SlashCommandBuilder } = require('discord.js');
const db = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xp-setlevelupchannel')
        .setDescription('Legt den Kanal für Level-Up-Benachrichtigungen fest (Admin-Only).')
        .addChannelOption(option =>
            option.setName('kanal')
                .setDescription('Der Kanal für Level-Up-Benachrichtigungen.')
                .setRequired(true)
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ content: 'Du hast keine Berechtigung, diesen Befehl zu verwenden.', ephemeral: true });
        }

        const channel = interaction.options.getChannel('kanal');
        const guildId = interaction.guild.id;

        await db.query(
            'INSERT INTO levelup_channels (guild_id, channel_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE channel_id = ?',
            [guildId, channel.id, channel.id]
        );

        interaction.reply(`Der Level-Up-Kanal wurde erfolgreich auf ${channel} gesetzt.`);
    }
};
