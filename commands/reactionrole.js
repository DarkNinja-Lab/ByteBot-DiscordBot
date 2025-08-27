const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emoji = require('node-emoji'); // Emoji-Bibliothek importieren
const db = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Fügt eine Reaction Role zu einer Nachricht hinzu.')
        .addStringOption(option =>
            option.setName('channel')
                .setDescription('Channel-ID, in dem sich die Nachricht befindet.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('messageid')
                .setDescription('ID der Nachricht, zu der die Reaktion hinzugefügt wird.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('Emoji für die Rolle.')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Die Rolle, die bei der Reaktion hinzugefügt wird.')
                .setRequired(true)),

    async execute(interaction) {
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({
                content: '❌ Du hast keine Berechtigung, diesen Befehl auszuführen.',
                ephemeral: true,
            });
        }

        const channelId = interaction.options.getString('channel');
        const messageId = interaction.options.getString('messageid');
        const rawEmoji = interaction.options.getString('emoji');
        const role = interaction.options.getRole('role');

        let emojiIdentifier;
        if (rawEmoji.match(/<a?:\w+:\d+>/)) {
            // Benutzerdefiniertes Emoji
            const match = rawEmoji.match(/<a?:(\w+):\d+>/);
            emojiIdentifier = match[1]; // Extrahiere den Emoji-Namen
        } else {
            // Standard-Emoji
            const foundEmoji = emoji.find(rawEmoji);
            if (foundEmoji) {
                emojiIdentifier = foundEmoji.key; // Speichere als Kurzcode wie "desktop"
            } else {
                return interaction.reply({
                    content: '❌ Ungültiges Emoji angegeben.',
                    ephemeral: true,
                });
            }
        }

        const channel = await interaction.guild.channels.fetch(channelId);
        if (!channel) return interaction.reply({ content: '❌ Channel nicht gefunden.', ephemeral: true });

        const message = await channel.messages.fetch(messageId).catch(() => null);
        if (!message) return interaction.reply({ content: '❌ Nachricht nicht gefunden.', ephemeral: true });

        try {
            await message.react(rawEmoji);
        } catch (err) {
            console.error(`[ERROR] Fehler beim Hinzufügen der Reaktion: ${err}`);
            return interaction.reply({ content: '❌ Fehler beim Hinzufügen der Reaktion.', ephemeral: true });
        }

        const sql = `
            INSERT INTO reaction_roles (guild_id, message_id, emoji, role_id, channel_id)
            VALUES (?, ?, ?, ?, ?)
        `;
        await db.query(sql, [
            interaction.guild.id,
            messageId,
            emojiIdentifier,
            role.id,
            channelId,
        ]);

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Reaction Role hinzugefügt!')
            .setDescription(`Die Reaction Role wurde erfolgreich hinzugefügt!`)
            .addFields(
                { name: 'Emoji:', value: emojiIdentifier, inline: true },
                { name: 'Rolle:', value: role.name, inline: true },
                { name: 'Channel:', value: `<#${channelId}>`, inline: true },
                { name: 'Nachricht-ID:', value: messageId, inline: true }
            )
            .setTimestamp();

        interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
