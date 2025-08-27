const levelSystem = require('../utils/levelSystem');

const DISBOARD_ID = "302050872383242240"; // die echte Bot-ID einsetzen
const BUMP_CHANNEL_ID = "1410370045087055882"; // Channel für Reminder

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (!message.guild) return; // DM ignorieren
        if (message.author.bot && message.author.id !== DISBOARD_ID) return; // andere Bots ignorieren

        // --- 1. Level-System ---
        try {
            const guildId = message.guild.id;
            const userId = message.author.id;

            const result = await levelSystem.addXP(userId, guildId, 10, message.client); // 10 XP pro Nachricht
            if (result.levelUp) {
                console.log(`${message.author.username} hat Level ${result.newLevel} erreicht.`);
                const levelUpMessage = `🎉 ${message.author} hat Level ${result.newLevel} erreicht!`;
                await message.channel.send(levelUpMessage);
            }
        } catch (error) {
            console.error('[ERROR] Fehler im Level-System:', error);
        }

        // --- 2. DISBOARD Bump Listener ---
        if (message.author.id === DISBOARD_ID) {
            if (message.content.includes("/bump") || message.content.includes("Bump done")) {
                const bumpChannel = message.guild.channels.cache.get(BUMP_CHANNEL_ID);
                if (!bumpChannel) return;

                // Timer starten für 2 Stunden
                setTimeout(() => {
                    bumpChannel.send("🚀 Du kannst jetzt wieder bumpen!");
                }, 2 * 60 * 60 * 1000);

                console.log(`⏰ Bump-Timer gestartet für ${message.guild.name}`);
            }
        }
    },
};
