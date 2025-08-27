const { Events, EmbedBuilder } = require('discord.js');

module.exports = (client, db) => {
  // Funktion: Log-Nachricht senden
  async function sendLog(guildId, embed) {
    try {
      // Hole den Log-Kanal aus der Datenbank
      const rows = await db.query('SELECT log_channel_id FROM config WHERE guild_id = ?', [guildId]);
      if (rows.length === 0) return; // Kein Log-Kanal gesetzt

      const logChannelId = rows[0].log_channel_id;
      const logChannel = await client.channels.fetch(logChannelId);
      if (logChannel) logChannel.send({ embeds: [embed] }); // Nachricht in den Log-Kanal senden
    } catch (error) {
      console.error('Fehler beim Senden der Log-Nachricht:', error);
    }
  }

  // 1. Nachricht gelöscht
  client.on(Events.MessageDelete, async (message) => {
    if (message.partial) return;
    const embed = new EmbedBuilder()
      .setColor('#FF6347')
      .setTitle('🗑️ Nachricht gelöscht')
      .setDescription(`**Benutzer**: ${message.author.tag}\n**Inhalt**: "${message.content}"`)
      .setTimestamp()
      .setFooter({ text: 'Bot Log' });

    await sendLog(message.guild.id, embed);
  });

  // 2. Nachricht bearbeitet
  client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (oldMessage.partial || newMessage.partial || oldMessage.content === newMessage.content) return;
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('✏️ Nachricht bearbeitet')
      .setDescription(`**Benutzer**: ${oldMessage.author.tag}\n**Vorher**: "${oldMessage.content}"\n**Nachher**: "${newMessage.content}"`)
      .setTimestamp()
      .setFooter({ text: 'Bot Log' });

    await sendLog(oldMessage.guild.id, embed);
  });

  // 3. Neuer Benutzer beitritt
  client.on(Events.GuildMemberAdd, async (member) => {
    const embed = new EmbedBuilder()
      .setColor('#32CD32')
      .setTitle('👋 Neuer Benutzer beigetreten')
      .setDescription(`**Benutzer**: ${member.user.tag}`)
      .setTimestamp()
      .setFooter({ text: 'Bot Log' });

    await sendLog(member.guild.id, embed);
  });

  // 4. Benutzername geändert (Nickname)
  client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    if (oldMember.nickname !== newMember.nickname) {
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('✏️ Benutzername geändert')
        .setDescription(`**Benutzer**: ${oldMember.user.tag}\n**Vorheriger Nickname**: ${oldMember.nickname || 'Keiner'}\n**Neuer Nickname**: ${newMember.nickname || 'Keiner'}`)
        .setTimestamp()
        .setFooter({ text: 'Bot Log' });

      await sendLog(oldMember.guild.id, embed);
    }
  });

  // 5. Benutzer stumm geschaltet/entstummt (VoiceStateUpdate)
  client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    if (oldState.selfMute !== newState.selfMute) {
      const embed = new EmbedBuilder()
        .setColor('#FF6347')
        .setTitle('🔊 Stummschaltung geändert')
        .setDescription(`**Benutzer**: ${newState.member.user.tag}\n**Stumm geschaltet**: ${newState.selfMute ? 'Ja' : 'Nein'}`)
        .setTimestamp()
        .setFooter({ text: 'Bot Log' });

      await sendLog(newState.guild.id, embed);
    }
  });

  // 6. Emoji hinzugefügt
  client.on(Events.EmojiCreate, async (emoji) => {
    const embed = new EmbedBuilder()
      .setColor('#8A2BE2')
      .setTitle('😊 Neuer Emoji hinzugefügt')
      .setDescription(`**Emoji**: ${emoji.name}\n**Emoji ID**: ${emoji.id}`)
      .setTimestamp()
      .setFooter({ text: 'Bot Log' });

    await sendLog(emoji.guild.id, embed);
  });

  // 7. Emoji gelöscht
  client.on(Events.EmojiDelete, async (emoji) => {
    const embed = new EmbedBuilder()
      .setColor('#8B0000')
      .setTitle('❌ Emoji gelöscht')
      .setDescription(`**Emoji**: ${emoji.name}\n**Emoji ID**: ${emoji.id}`)
      .setTimestamp()
      .setFooter({ text: 'Bot Log' });

    await sendLog(emoji.guild.id, embed);
  });

  // 8. Reaktion hinzugefügt
  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (reaction.partial) await reaction.fetch();
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('👍 Reaktion hinzugefügt')
      .setDescription(`**Benutzer**: ${user.tag}\n**Nachricht**: "${reaction.message.content}"\n**Reaktion**: ${reaction.emoji.name}`)
      .setTimestamp()
      .setFooter({ text: 'Bot Log' });

    await sendLog(reaction.message.guild.id, embed);
  });

  // 9. Reaktion entfernt
  client.on(Events.MessageReactionRemove, async (reaction, user) => {
    if (reaction.partial) await reaction.fetch();
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('👎 Reaktion entfernt')
      .setDescription(`**Benutzer**: ${user.tag}\n**Nachricht**: "${reaction.message.content}"\n**Reaktion**: ${reaction.emoji.name}`)
      .setTimestamp()
      .setFooter({ text: 'Bot Log' });

    await sendLog(reaction.message.guild.id, embed);
  });

  // 10. Benutzer verlässt den Server oder wird gekickt
  client.on(Events.GuildMemberRemove, async (member) => {
    try {
      const auditLogs = await member.guild.fetchAuditLogs({ type: 'MEMBER_KICK', limit: 1 });
      const kickLog = auditLogs.entries.find(entry => entry.target.id === member.id);

      if (kickLog) {
        const embedKick = new EmbedBuilder()
          .setColor('#FFA500')
          .setTitle('❌ Benutzer gekickt')
          .setDescription(`**Benutzer**: ${member.user.tag}\n**Von**: ${kickLog.executor.tag}`)
          .setTimestamp()
          .setFooter({ text: 'Bot Log' });

        await sendLog(member.guild.id, embedKick);
      } else {
        const embedLeave = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('🚪 Benutzer hat den Server verlassen')
          .setDescription(`**Benutzer**: ${member.user.tag}`)
          .setTimestamp()
          .setFooter({ text: 'Bot Log' });

        await sendLog(member.guild.id, embedLeave);
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Audit-Logs:', error);
    }
  });

  // 11. Benutzer gebannt
  client.on(Events.GuildBanAdd, async (ban) => {
    const embed = new EmbedBuilder()
      .setColor('#DC143C')
      .setTitle('⛔ Benutzer gebannt')
      .setDescription(`**Benutzer**: ${ban.user.tag}`)
      .setTimestamp()
      .setFooter({ text: 'Bot Log' });

    await sendLog(ban.guild.id, embed);
  });

  // 12. Benutzer entbannt
  client.on(Events.GuildBanRemove, async (ban) => {
    const embed = new EmbedBuilder()
      .setColor('#32CD32')
      .setTitle('✅ Benutzer entbannt')
      .setDescription(`**Benutzer**: ${ban.user.tag}`)
      .setTimestamp()
      .setFooter({ text: 'Bot Log' });

    await sendLog(ban.guild.id, embed);
  });
};
