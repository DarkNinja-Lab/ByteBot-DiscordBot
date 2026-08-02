const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const emoji = require('node-emoji');
const db = require('../db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removereactionrole')
        .setDescription('Entfernt eine Reaction Role und bereinigt die Reaktionen(Admin-Only).')
        .addStringOption(option =>
            option.setName('channel')
                .setDescription('Channel-ID, in dem sich die Nachricht befindet.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('messageid')
                .setDescription('Die ID der Nachricht, von der die Reaction Role entfernt werden soll.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('Das Emoji, das der zu entfernenden Reaction Role zugeordnet ist.')
                .setRequired(true)),

    async execute(interaction) {
        // Admin-Berechtigungsprüfung
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: '❌ Du hast keine Berechtigung, diesen Befehl auszuführen.',
                ephemeral: true,
            });
        }

        const channelId = interaction.options.getString('channel');
        const messageId = interaction.options.getString('messageid');
        const rawEmoji = interaction.options.getString('emoji');
        const emojiIdentifier = normalizeEmojiInput(rawEmoji);
        if (!emojiIdentifier) {
            return interaction.reply({
                content: '❌ Ungültiges Emoji angegeben.',
                ephemeral: true,
            });
        }

        // Channel und Nachricht holen
        const channel = await interaction.guild.channels.fetch(channelId);
        if (!channel) return interaction.reply({ content: '❌ Channel nicht gefunden.', ephemeral: true });

        const message = await channel.messages.fetch(messageId).catch(() => null);
        if (!message) return interaction.reply({ content: '❌ Nachricht nicht gefunden.', ephemeral: true });

        const existingRows = await db.query(
            'SELECT role_id FROM reaction_roles WHERE message_id = ? AND emoji = ? AND guild_id = ?',
            [messageId, emojiIdentifier, interaction.guild.id]
        );

        if (existingRows.length === 0) {
            return interaction.reply({
                content: `⚠️ Keine Reaction Role mit der Nachricht-ID \`${messageId}\` und dem Emoji \`${emojiIdentifier}\` gefunden.`,
                ephemeral: true,
            });
        }

        const roleId = existingRows[0].role_id;

        // Reaktionen von der Nachricht entfernen
        const reaction = findReactionByIdentifier(message, emojiIdentifier);
        if (reaction) {
            const users = await reaction.users.fetch();

            for (const user of users.values()) {
                if (user.bot) continue;

                // Entferne die Rolle von Benutzern, die reagiert haben
                const member = await interaction.guild.members.fetch(user.id).catch(() => null);
                if (member) {
                    const role = interaction.guild.roles.cache.get(roleId);
                    if (role && member.roles.cache.has(roleId)) {
                        await member.roles.remove(role).catch(console.error);
                    }
                }
            }

            // Entferne die Reaktion von der Nachricht
            await reaction.remove().catch(console.error);
        }

        await db.query(
            'DELETE FROM reaction_roles WHERE message_id = ? AND emoji = ? AND guild_id = ?',
            [messageId, emojiIdentifier, interaction.guild.id]
        );

        // Erfolgsmeldung
        interaction.reply({
            content: `✅ Die Reaction Role mit Emoji \`${emojiIdentifier}\` wurde entfernt, und alle zugehörigen Reaktionen wurden bereinigt.`,
            ephemeral: true,
        });
    },
};

function normalizeEmojiInput(rawEmoji) {
    const customMatch = rawEmoji.match(/^<a?:(\w+):\d+>$/);
    if (customMatch) return customMatch[1];

    const foundEmoji = emoji.find(rawEmoji);
    if (foundEmoji) return foundEmoji.key;

    const shortcode = rawEmoji.replace(/^:/, '').replace(/:$/, '');
    if (emoji.get(shortcode)) return shortcode;

    return null;
}

function findReactionByIdentifier(message, emojiIdentifier) {
    const unicodeEmoji = emoji.get(emojiIdentifier);
    return message.reactions.cache.find(reaction =>
        reaction.emoji.name === emojiIdentifier ||
        (!!unicodeEmoji && !reaction.emoji.id && reaction.emoji.name === unicodeEmoji)
    );
}
