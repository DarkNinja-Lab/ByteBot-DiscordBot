const levelSystem = require('../utils/levelSystem');

module.exports = {
    name: 'messageCreate',
    once: false,

    async execute(message) {
        if (!message?.guild) {
            return;
        }

        if (message.author?.bot) {
            return;
        }

        const content = String(message.content || '').trim();

        if (
            content.length <
            levelSystem.MIN_MESSAGE_LENGTH
        ) {
            return;
        }

        try {
            const xp = getRandomInteger(
                levelSystem.MIN_XP_PER_MESSAGE,
                levelSystem.MAX_XP_PER_MESSAGE
            );

            const result = await levelSystem.addXP(
                message.author.id,
                message.guild.id,
                xp,
                message.client
            );

            if (!result.awarded) {
                return;
            }

            console.log(
                `[LEVEL] ${message.author.tag} erhält ${result.amount} XP. ` +
                `Level: ${result.newLevel}, XP: ${result.xp}`
            );
        } catch (error) {
            console.error(
                '❌ [ERROR] Fehler im Levelsystem:',
                error.message || error
            );
        }
    },
};

function getRandomInteger(min, max) {
    const minimum = Math.ceil(min);
    const maximum = Math.floor(max);

    return Math.floor(
        Math.random() * (maximum - minimum + 1)
    ) + minimum;
}