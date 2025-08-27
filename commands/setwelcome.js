const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setwelcomechannel')
        .setDescription('Setzt den Kanal für Willkommensnachrichten.')
        .addChannelOption(option =>
            option
                .setName('kanal')
                .setDescription('Der Kanal, in dem Willkommensnachrichten gesendet werden sollen.')
                .setRequired(true)
        ),
    async execute(interaction, db) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: '❌ Du hast keine Berechtigung, diesen Befehl auszuführen.',
                ephemeral: true,
            });
        }

        const channel = interaction.options.getChannel('kanal');
        const guildId = interaction.guild.id;

        if (channel.type !== 0 && channel.type !== 5) { // Nur Text- oder Ankündigungskanäle
            return interaction.reply({
                content: '❌ Bitte wähle einen gültigen Textkanal aus.',
                ephemeral: true,
            });
        }

        try {
            await db.query(
                'INSERT INTO server_config (guild_id, welcome_channel_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE welcome_channel_id = ?',
                [guildId, channel.id, channel.id]
            );

            interaction.reply(`✅ Der Willkommenskanal wurde erfolgreich auf **#${channel.name}** gesetzt.`);
        } catch (error) {
            console.error('❌ [ERROR] Fehler beim Setzen des Willkommenskanals:', error);
            interaction.reply({
                content: '❌ Es gab einen Fehler beim Speichern des Willkommenskanals.',
                ephemeral: true,
            });
        }
    },
};
