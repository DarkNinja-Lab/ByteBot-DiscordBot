const {
    SlashCommandBuilder,
    EmbedBuilder,
} = require('discord.js');

const levelSystem = require('../utils/levelSystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Zeigt die besten Mitglieder des Servers an.'),

    async execute(interaction) {
        const guildId = interaction.guild.id;

        const leaderboard = await levelSystem.getLeaderboard(
            guildId
        );

        if (!leaderboard || leaderboard.length === 0) {
            const emptyEmbed = new EmbedBuilder()
                .setColor(0xf59e0b)
                .setTitle('🏆 Server-Leaderboard')
                .setDescription(
                    'Aktuell hat noch niemand XP gesammelt.'
                )
                .setFooter({
                    text: `${interaction.guild.name} • Levelsystem`,
                })
                .setTimestamp();

            return interaction.reply({
                embeds: [emptyEmbed],
            });
        }

        const rankEmojis = ['🥇', '🥈', '🥉'];

        const leaderboardText = leaderboard
            .map((entry, index) => {
                const position = index + 1;
                const rankIcon =
                    rankEmojis[index] || `\`#${position}\``;

                return (
                    `${rankIcon} <@${entry.user_id}>\n` +
                    `> **Level ${entry.level}** • ${entry.xp} XP`
                );
            })
            .join('\n\n');

        const ownEntry = leaderboard.find(
            entry =>
                String(entry.user_id) ===
                String(interaction.user.id)
        );

        const embed = new EmbedBuilder()
            .setColor(0xf1c40f)
            .setAuthor({
                name: 'SERVER-LEADERBOARD',
                iconURL: interaction.guild.iconURL({
                    extension: 'png',
                    size: 256,
                }) || undefined,
            })
            .setTitle('🏆 Die aktivsten Mitglieder')
            .setDescription(
                'Hier siehst du die Top 10 des Servers.\n\n' +
                leaderboardText
            )
            .addFields({
                name: '📌 Dein aktueller Stand',
                value: ownEntry
                    ? `Du bist in den Top 10 auf **Level ${ownEntry.level}** mit **${ownEntry.xp} XP**.`
                    : 'Du bist aktuell noch nicht in den Top 10.',
                inline: false,
            })
            .setFooter({
                text: `${interaction.guild.name} • Aktualisiert`,
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed],
        });
    },
};