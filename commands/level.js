const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const levelSystem = require('../utils/levelSystem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Zeigt dein aktuelles Level und deine XP an.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Der User, dessen Level du sehen möchtest. (Optional)')
        ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user; // Zeigt Level des angegebenen Users oder des ausführenden Users an
        const guildId = interaction.guild.id;

        // Benutzerdaten abrufen
        const userData = await levelSystem.getUserData(targetUser.id, guildId);
        const pointsPerLevel = await levelSystem.getLevelPoints(guildId); // Dynamische Punkte pro Level

        if (!userData) {
            return interaction.reply({
                content: `${targetUser.username} hat noch keine XP gesammelt.`,
                ephemeral: true
            });
        }

        // Fortschrittsberechnung
        const xpToNextLevel = pointsPerLevel; // Punkte zum nächsten Level
        const progressPercentage = Math.min(Math.round((userData.xp / xpToNextLevel) * 100), 100);
        const progressBar = createProgressBar(userData.xp, xpToNextLevel);

        // Embed erstellen
        const embed = new EmbedBuilder()
            .setColor('#1E90FF')
            .setTitle(`${targetUser.username}'s Level`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Level', value: `${userData.level}`, inline: true },
                { name: 'XP', value: `${userData.xp}/${xpToNextLevel}`, inline: true },
                { name: 'Fortschritt', value: `${progressBar} (${progressPercentage}%)` }
            )
            .setFooter({ text: 'Level-System', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        interaction.reply({ embeds: [embed] });
    }
};

// Fortschrittsbalken mit Emojis erstellen
function createProgressBar(current, total, length = 10) {
    const filledLength = Math.round((current / total) * length);
    const emptyLength = length - filledLength;

    const filledBlock = '🟩'; // Grüner Block
    const emptyBlock = '⬜'; // Weißer Block

    return filledBlock.repeat(filledLength) + emptyBlock.repeat(emptyLength);
}
