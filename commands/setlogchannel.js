const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlogchannel')
    .setDescription('Setzt oder zeigt den Log-Kanal für Serveraktivitäten.')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Der Kanal, in dem Logs gepostet werden sollen.')
        .setRequired(false) // Optional, um den aktuellen Log-Kanal anzuzeigen
    ),

  async execute(interaction, db) {
    // Überprüfen, ob der Benutzer Admin-Berechtigungen hat
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: '❌ Du benötigst Administratorrechte, um diesen Befehl zu verwenden.',
        ephemeral: true,
      });
    }

    const channel = interaction.options.getChannel('channel');

    // Kein Kanal angegeben -> Aktuellen Log-Kanal anzeigen
    if (!channel) {
      try {
        const [rows] = await db.query(
          'SELECT log_channel_id FROM config WHERE guild_id = ?',
          [interaction.guild.id]
        );

        if (rows.length === 0) {
          return interaction.reply({
            content: '❌ Es wurde kein Log-Kanal für diesen Server konfiguriert.',
            ephemeral: true,
          });
        }

        const logChannel = interaction.guild.channels.cache.get(rows[0].log_channel_id);
        if (logChannel) {
          return interaction.reply({
            content: `📢 Der aktuelle Log-Kanal ist: **${logChannel.name}**`,
            ephemeral: true,
          });
        } else {
          return interaction.reply({
            content: '❌ Der gespeicherte Log-Kanal existiert nicht mehr oder ist nicht zugänglich.',
            ephemeral: true,
          });
        }
      } catch (error) {
        console.error('❌ Fehler beim Abrufen des Log-Kanals:', error);
        return interaction.reply({
          content: '❌ Es gab einen Fehler beim Abrufen des Log-Kanals.',
          ephemeral: true,
        });
      }
    }

    // Kanaltyp überprüfen (nur Text- oder Ankündigungskanäle erlauben)
    if (![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(channel.type)) {
      return interaction.reply({
        content: '❌ Bitte wähle einen gültigen Textkanal oder Ankündigungskanal aus!',
        ephemeral: true,
      });
    }

    // Berechtigungen überprüfen
    const botPermissions = channel.permissionsFor(interaction.guild.members.me);
    if (!botPermissions || !botPermissions.has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({
        content: `❌ Der Bot hat keine Berechtigung, in den Kanal **${channel.name}** zu schreiben.`,
        ephemeral: true,
      });
    }

    // Log-Kanal in der Datenbank speichern
    try {
      await db.query(
        'INSERT INTO config (guild_id, log_channel_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE log_channel_id = ?',
        [interaction.guild.id, channel.id, channel.id]
      );

      return interaction.reply(`✅ Log-Kanal erfolgreich auf **${channel.name}** gesetzt.`);
    } catch (error) {
      console.error('❌ Fehler beim Speichern des Log-Kanals:', error);
      return interaction.reply({
        content: '❌ Es gab einen Fehler beim Speichern des Log-Kanals.',
        ephemeral: true,
      });
    }
  },
};
