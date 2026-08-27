const {
    Events,
    EmbedBuilder,
    AuditLogEvent,
} = require('discord.js');

module.exports = client => {
    const logChannelCache = new Map();

    async function getLogChannel(guild) {
        if (!guild) {
            return null;
        }

        const cachedChannelId = logChannelCache.get(guild.id);

        if (cachedChannelId) {
            const cachedChannel = await client.channels
                .fetch(cachedChannelId)
                .catch(() => null);

            if (cachedChannel?.isTextBased()) {
                return cachedChannel;
            }

            logChannelCache.delete(guild.id);
        }

        try {
            const db = require('./db');

            const rows = await db.query(
                `
                    SELECT log_channel_id
                    FROM config
                    WHERE guild_id = ?
                    LIMIT 1
                `,
                [guild.id]
            );

            const channelId = rows?.[0]?.log_channel_id;

            if (!channelId) {
                return null;
            }

            const channel = await client.channels
                .fetch(channelId)
                .catch(() => null);

            if (!channel?.isTextBased()) {
                return null;
            }

            logChannelCache.set(guild.id, channel.id);

            return channel;
        } catch (error) {
            console.error(
                '❌ [ERROR] Log-Kanal konnte nicht geladen werden:',
                error.message || error
            );

            return null;
        }
    }

    async function sendLog(guild, embed) {
        if (!guild || !embed) {
            return;
        }

        try {
            const channel = await getLogChannel(guild);

            if (!channel) {
                return;
            }

            await channel.send({
                embeds: [embed],
            });
        } catch (error) {
            console.error(
                '❌ [ERROR] Log-Nachricht konnte nicht gesendet werden:',
                error.message || error
            );
        }
    }

    function createEmbed(guild, color, title) {
        return new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setFooter({
                text: guild?.name
                    ? `${guild.name} • ByteBot-Logs`
                    : 'ByteBot-Logs',
            })
            .setTimestamp();
    }

    function shorten(value, maxLength = 900) {
        const text = String(value || '').trim();

        if (!text) {
            return '*Kein Inhalt*';
        }

        if (text.length <= maxLength) {
            return text;
        }

        return `${text.slice(0, maxLength - 3)}...`;
    }

    function messageLink(message) {
        if (
            !message?.guild?.id ||
            !message?.channel?.id ||
            !message?.id
        ) {
            return null;
        }

        return `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`;
    }

    client.on(Events.MessageDelete, async message => {
        if (!message?.guild) {
            return;
        }

        const embed = createEmbed(
            message.guild,
            0xef4444,
            '🗑️ Nachricht gelöscht'
        ).addFields(
            {
                name: '👤 Benutzer',
                value:
                    `${message.author?.tag || 'Unbekannt'}\n` +
                    `ID: \`${message.author?.id || 'unbekannt'}\``,
                inline: false,
            },
            {
                name: '💬 Inhalt',
                value: shorten(message.content),
                inline: false,
            }
        );

        const link = messageLink(message);

        if (link) {
            embed.setURL(link);
        }

        await sendLog(message.guild, embed);
    });

    client.on(
        Events.MessageUpdate,
        async (oldMessage, newMessage) => {
            if (
                !oldMessage?.guild ||
                !newMessage?.guild ||
                oldMessage.partial ||
                newMessage.partial ||
                oldMessage.content === newMessage.content
            ) {
                return;
            }

            const embed = createEmbed(
                newMessage.guild,
                0xf59e0b,
                '✏️ Nachricht bearbeitet'
            ).addFields(
                {
                    name: '👤 Benutzer',
                    value:
                        `${oldMessage.author?.tag || 'Unbekannt'}\n` +
                        `ID: \`${oldMessage.author?.id || 'unbekannt'}\``,
                    inline: false,
                },
                {
                    name: '⬅️ Vorher',
                    value: shorten(oldMessage.content),
                    inline: false,
                },
                {
                    name: '➡️ Nachher',
                    value: shorten(newMessage.content),
                    inline: false,
                }
            );

            const link = messageLink(newMessage);

            if (link) {
                embed.setURL(link);
            }

            await sendLog(newMessage.guild, embed);
        }
    );

    client.on(Events.GuildMemberAdd, async member => {
        if (!member?.guild || !member?.user) {
            return;
        }

        const embed = createEmbed(
            member.guild,
            0x22c55e,
            '👋 Neues Mitglied beigetreten'
        )
            .setThumbnail(
                member.user.displayAvatarURL({
                    extension: 'png',
                    size: 256,
                })
            )
            .addFields(
                {
                    name: '👤 Benutzer',
                    value:
                        `${member.user.tag}\n` +
                        `ID: \`${member.user.id}\``,
                    inline: false,
                },
                {
                    name: '👥 Mitglieder',
                    value: `${member.guild.memberCount || 'unbekannt'}`,
                    inline: true,
                }
            );

        await sendLog(member.guild, embed);
    });

    client.on(
        Events.GuildMemberUpdate,
        async (oldMember, newMember) => {
            if (!oldMember?.guild || !newMember?.user) {
                return;
            }

            if (oldMember.nickname === newMember.nickname) {
                return;
            }

            const embed = createEmbed(
                newMember.guild,
                0xf59e0b,
                '✏️ Nickname geändert'
            ).addFields(
                {
                    name: '👤 Benutzer',
                    value:
                        `${newMember.user.tag}\n` +
                        `ID: \`${newMember.user.id}\``,
                    inline: false,
                },
                {
                    name: '⬅️ Vorher',
                    value: oldMember.nickname || '*Keiner*',
                    inline: true,
                },
                {
                    name: '➡️ Nachher',
                    value: newMember.nickname || '*Keiner*',
                    inline: true,
                }
            );

            await sendLog(newMember.guild, embed);
        }
    );

    client.on(
        Events.VoiceStateUpdate,
        async (oldState, newState) => {
            const member = newState?.member || oldState?.member;

            if (!member?.guild || !member?.user) {
                return;
            }

            if (oldState.selfMute === newState.selfMute) {
                return;
            }

            const embed = createEmbed(
                member.guild,
                0x3b82f6,
                '🎙️ Mikrofonstatus geändert'
            ).addFields({
                name: '👤 Benutzer',
                value:
                    `${member.user.tag}\n` +
                    `ID: \`${member.user.id}\``,
                inline: false,
            });

            await sendLog(member.guild, embed);
        }
    );

    client.on(Events.GuildEmojiCreate, async emoji => {
        if (!emoji?.guild) {
            return;
        }

        const embed = createEmbed(
            emoji.guild,
            0xa855f7,
            '😊 Emoji erstellt'
        ).addFields(
            {
                name: 'Emoji',
                value: emoji.toString(),
                inline: true,
            },
            {
                name: 'Name',
                value: `\`${emoji.name || 'unbekannt'}\``,
                inline: true,
            },
            {
                name: 'ID',
                value: `\`${emoji.id}\``,
                inline: true,
            }
        );

        await sendLog(emoji.guild, embed);
    });

    client.on(Events.GuildEmojiDelete, async emoji => {
        if (!emoji?.guild) {
            return;
        }

        const embed = createEmbed(
            emoji.guild,
            0x7f1d1d,
            '🗑️ Emoji gelöscht'
        ).addFields(
            {
                name: 'Name',
                value: `\`${emoji.name || 'unbekannt'}\``,
                inline: true,
            },
            {
                name: 'ID',
                value: `\`${emoji.id}\``,
                inline: true,
            }
        );

        await sendLog(emoji.guild, embed);
    });

    client.on(Events.GuildMemberRemove, async member => {
        if (!member?.guild || !member?.user) {
            return;
        }

        try {
            const auditLogs = await member.guild.fetchAuditLogs({
                type: AuditLogEvent.MemberKick,
                limit: 5,
            });

            const kickEntry = auditLogs.entries.find(entry => {
                if (String(entry?.target?.id) !== String(member.id)) {
                    return false;
                }

                return (
                    Date.now() - entry.createdTimestamp < 15_000
                );
            });

            if (kickEntry) {
                const embed = createEmbed(
                    member.guild,
                    0xf97316,
                    '👢 Mitglied gekickt'
                ).addFields(
                    {
                        name: '👤 Benutzer',
                        value:
                            `${member.user.tag}\n` +
                            `ID: \`${member.user.id}\``,
                        inline: false,
                    },
                    {
                        name: '🛡️ Ausgeführt von',
                        value:
                            kickEntry.executor?.tag ||
                            '*Unbekannt*',
                        inline: true,
                    }
                );

                await sendLog(member.guild, embed);
                return;
            }
        } catch (error) {
            console.warn(
                '⚠️ [WARN] Audit-Logs konnten nicht geprüft werden:',
                error.message || error
            );
        }

        const embed = createEmbed(
            member.guild,
            0xfacc15,
            '🚪 Mitglied hat den Server verlassen'
        ).addFields({
            name: '👤 Benutzer',
            value:
                `${member.user.tag}\n` +
                `ID: \`${member.user.id}\``,
            inline: false,
        });

        await sendLog(member.guild, embed);
    });

    client.on(Events.GuildBanAdd, async ban => {
        if (!ban?.guild || !ban?.user) {
            return;
        }

        const embed = createEmbed(
            ban.guild,
            0xdc2626,
            '⛔ Benutzer gebannt'
        ).addFields({
            name: '👤 Benutzer',
            value:
                `${ban.user.tag}\n` +
                `ID: \`${ban.user.id}\``,
            inline: false,
        });

        await sendLog(ban.guild, embed);
    });

    client.on(Events.GuildBanRemove, async ban => {
        if (!ban?.guild || !ban?.user) {
            return;
        }

        const embed = createEmbed(
            ban.guild,
            0x16a34a,
            '✅ Benutzer entbannt'
        ).addFields({
            name: '👤 Benutzer',
            value:
                `${ban.user.tag}\n` +
                `ID: \`${ban.user.id}\``,
            inline: false,
        });

        await sendLog(ban.guild, embed);
    });

    console.log(
        '✅ [INFO] Logging-System erfolgreich initialisiert.'
    );
};