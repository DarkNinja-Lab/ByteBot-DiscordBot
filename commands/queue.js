const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Zeigt die aktuelle Warteschlange an'),
    async execute(interaction) {
        if (!global.queue || global.queue.length === 0) {
            const emptyEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('📝 Warteschlange ist leer')
                .setDescription('Es befinden sich derzeit keine Songs in der Warteschlange. Füge Songs mit `/play` hinzu!');
            return interaction.reply({ embeds: [emptyEmbed] });
        }

        // Begrenze die Anzeige auf die ersten 10 Songs
        const displayQueue = global.queue.slice(0, 10).map((song, index) => {
            return `**${index + 1}.** ${song.title}`;
        });

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('🎶 Aktuelle Warteschlange')
            .setDescription(displayQueue.join('\n'))
            .setFooter({
                text: global.queue.length > 10
                    ? `Und ${global.queue.length - 10} weitere Songs...`
                    : 'Das ist die vollständige Warteschlange!',
            });

        await interaction.reply({ embeds: [embed] });
    },
};
