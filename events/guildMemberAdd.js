const welcomeMessages = [
  "👋 Willkommen auf unserem Server, {mention}! Schön, dass du da bist! 🎉",
  "Hey {mention}, herzlich willkommen! Wir hoffen, du hast eine tolle Zeit hier. 😊",
  "🎉 {mention} ist beigetreten! Mach es dir bequem und hab Spaß! 🎮",
  "Hallo {mention}! Willkommen in unserer Community! 🚀",
  "🥳 {mention}, herzlich willkommen! Schön, dass du dabei bist!",
];

module.exports = {
  name: "guildMemberAdd",
  once: false,
  execute: async (member, db) => {
    const guildId = member.guild.id;
    console.log(`➡️ [DEBUG] Neues Mitglied ${member.user.tag} auf ${guildId}`);

    try {
      const result = await db.query(
        "SELECT welcome_channel_id FROM server_config WHERE guild_id = ?",
        [guildId]
      );

      // mysql2/promise: [rows, fields] | andere libs: rows direkt
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

      const msg = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
        .replace("{mention}", `<@${member.user.id}>`);

      await channel.send({ content: msg });
      console.log(`✅ Welcome-Message für ${member.user.tag} in #${channel.name}`);
    } catch (err) {
      console.error("❌ Fehler bei Welcome-Message:", err);
    }
  },
};
