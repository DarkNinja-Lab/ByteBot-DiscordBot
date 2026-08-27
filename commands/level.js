const {
    SlashCommandBuilder,
    EmbedBuilder,
} = require('discord.js');

const levelSystem = require('../utils/levelSystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Zeigt dein Level und deinen XP-Fortschritt an.')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription(
                    'Zeigt optional das Level eines anderen Benutzers an.'
                )
                .setRequired(false)
        ),

    async execute(interaction) {
        const targetUser =
            interaction.options.getUser('user') || interaction.user;

        const guildId = interaction.guild.id;

        const userData = await levelSystem.getUserData(
            targetUser.id,
            guildId
        );

        if (!userData) {
            const emptyEmbed = new EmbedBuilder()
                .setColor(0xf59e0b)
                .setAuthor({
                    name: 'LEVELSYSTEM',
                    iconURL: targetUser.displayAvatarURL({
                        extension: 'png',
                        size: 256,
                    }),
                })
                .setTitle('Noch kein Level vorhanden')
                .setDescription(
                    `<@${targetUser.id}> hat noch keine XP gesammelt.\n\n` +
                    'Schreibe aktiv im Server, um dein erstes Level zu erreichen.'
                )
                .setThumbnail(
                    targetUser.displayAvatarURL({
                        extension: 'png',
                        size: 256,
                    })
                )
                .setFooter({
                    text: `Angefordert von ${interaction.user.username}`,
                })
                .setTimestamp();

            return interaction.reply({
                embeds: [emptyEmbed],
            });
        }

        const baseXP = await levelSystem.getLevelPoints(guildId);

        const xpForNextLevel = levelSystem.getRequiredXP(
            userData.level,
            baseXP
        );

        const progressPercentage = Math.min(
            100,
            Math.round((userData.xp / xpForNextLevel) * 100)
        );

        const progressBar = createProgressBar(
            userData.xp,
            xpForNextLevel
        );

        const rank = await levelSystem.getUserRank(
            targetUser.id,
            guildId
        );

        const avatarURL = targetUser.displayAvatarURL({
            extension: 'png',
            size: 256,
        });

        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setAuthor({
                name: 'LEVELPROFIL',
                iconURL: avatarURL,
            })
            .setTitle(`${targetUser.username}`)
            .setDescription(
                `Hier ist der aktuelle Fortschritt von <@${targetUser.id}>.`
            )
            .setThumbnail(avatarURL)
            .addFields(
                {
                    name: '🏅 Level',
                    value: `**${userData.level}**`,
                    inline: true,
                },
                {
                    name: '🏆 Server-Rang',
                    value: rank ? `**#${rank}**` : '**Nicht platziert**',
                    inline: true,
                },
                {
                    name: '⭐ XP',
                    value: `**${userData.xp} / ${xpForNextLevel}**`,
                    inline: true,
                },
                {
                    name: '📊 Fortschritt',
                    value:
                        `${progressBar}\n` +
                        `**${progressPercentage}%** bis Level ${userData.level + 1}`,
                    inline: false,
                }
            )
            .setFooter({
                text: `${interaction.guild.name} • Levelsystem`,
                iconURL: interaction.client.user.displayAvatarURL(),
            })
            .setTimestamp();

        return interaction.reply({
            embeds: [embed],
        });
    },
};

function createProgressBar(current, total, length = 12) {
    const safeCurrent = Math.max(0, Number(current) || 0);
    const safeTotal = Math.max(1, Number(total) || 1);

    const filledLength = Math.min(
        length,
        Math.round((safeCurrent / safeTotal) * length)
    );

    const emptyLength = Math.max(0, length - filledLength);

    return (
        '🟦'.repeat(filledLength) +
        '⬛'.repeat(emptyLength)
    );
}