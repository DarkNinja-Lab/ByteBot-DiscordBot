const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hilfe-admin')
        .setDescription('📋 Zeigt eine Liste aller verfügbaren Admin Befehle.'),

    async execute(interaction) {
        console.log(`✅ [DEBUG] /hilfeadmin command executed by ${interaction.user.tag}`);

        // Berechtigungsprüfung: Nur Administratoren
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            console.log(`⚠️ [DEBUG] User ${interaction.user.tag} lacks admin permissions.`);
            await interaction.reply({
                content: '🚫 **Du hast keine Berechtigung, diesen Befehl auszuführen.** Nur Administratoren können diesen Befehl nutzen!',
                ephemeral: true,
            });
            return;
        }

        console.log(`🛠️ [DEBUG] User ${interaction.user.tag} has admin permissions.`);

        // Erstellung des Embed-Builders für die Admin-Hilfe
        const embed = new EmbedBuilder()
            .setTitle('⚙️ Admin Hilfe & Befehle')
            .setDescription('Hier findest du eine Übersicht aller verfügbaren Admin-Befehle für den Bot.')
            .setColor('Red')
            .setTimestamp()
            .setFooter({
                text: interaction.guild.name,
                iconURL: interaction.guild.iconURL({ dynamic: true }),
            });

        // Admin Befehle hinzufügen
        embed.addFields(
            {
                name: '📌 **Admin Befehle**',
                value:
                    '🛠️ **/setlogchannel <#Kanal>** - Setzt den Kanal, in dem Logs gepostet werden.',
            },
            {
                name: 'ℹ️ **Hinweis**',
                value: 'Verwende die Befehle mit Vorsicht, da sie globale Änderungen an deinem Server durchführen können!',
            }
        );
        

        console.log(`📤 [DEBUG] Sending admin help embed to ${interaction.user.tag}`);
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
