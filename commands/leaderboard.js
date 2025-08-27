const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const levelSystem = require('../utils/levelSystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Zeigt die Level-Top-Liste'),
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const leaderboard = await levelSystem.getLeaderboard(guildId);

        if (leaderboard.length === 0) {
            return interaction.reply({
                content: 'Noch niemand hat XP gesammelt!',
                ephemeral: true
            });
        }

        // Emojis für die Top-3
        const rankEmojis = ['🥇', '🥈', '🥉'];

        // Füge Felder für das Embed hinzu
        const fields = leaderboard.map((user, index) => {
            const rankEmoji = rankEmojis[index] || `#${index + 1}`; // Emoji für Top 3, danach numerisch
            return {
                name: `${rankEmoji} Platz`,
                value: `<@${user.user_id}> - **Level ${user.level}** (${user.xp} XP)`,
                inline: false
            };
        });

        // Embed erstellen
        const embed = new EmbedBuilder()
            .setColor('#FFD700') // Gold für das Leaderboard
            .setTitle('🏆 Server Leaderboard')
            .addFields(fields)
            .setFooter({ text: `Angefordert von ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        interaction.reply({ embeds: [embed] });
    }
};
