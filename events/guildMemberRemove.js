const leaveMessages = [
  "👋 {username} hat den Server verlassen. Alles Gute!",
  "🚪 {username} ist raus. Danke für deinen Input!",
  "😢 {username} hat uns verlassen. Bis zum nächsten Projekt!",
];

module.exports = {
  name: "guildMemberRemove",
  once: false,
  execute: async (member, db) => {
    const guildId = member.guild.id;
    console.log(`⬅️ [DEBUG] Mitglied ${member.user.tag} hat ${guildId} verlassen`);

    try {
      const result = await db.query(
        "SELECT welcome_channel_id FROM server_config WHERE guild_id = ?",
        [guildId]
      );

      // mysql2/promise => [rows, fields] | andere Libs => rows direkt
      const rows = Array.isArray(result[0]) ? result[0] : result;
      const welcome_channel_id = rows?.[0]?.welcome_channel_id;

      console.log("➡️ [DEBUG] Query Result:", rows);

      if (!welcome_channel_id) {
        return console.warn("⚠️ Kein Welcome-Channel gesetzt.");
      }

      const channel = await member.guild.channels
        .fetch(welcome_channel_id)
        .catch(() => null);

      if (!channel) {
        return console.warn("⚠️ Welcome-Channel existiert nicht mehr.");
      }

      const msg = leaveMessages[Math.floor(Math.random() * leaveMessages.length)]
        .replace("{username}", member.user.tag);

      await channel.send({ content: msg });
      console.log(`✅ Leave-Message für ${member.user.tag} in #${channel.name}`);
    } catch (err) {
      console.error("❌ Fehler bei Leave-Message:", err);
    }
  },
};
