const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdlp = require('yt-dlp-exec');
const path = require('path');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Spielt ein Lied von YouTube ab')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('Die URL des YouTube-Videos')
                .setRequired(true)),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('❌ Fehler')
                .setDescription('Du musst in einem Sprachkanal sein, um Musik abzuspielen!');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const songUrl = interaction.options.getString('url');
        const downloadsDir = path.resolve(__dirname, '../downloads');

        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir);
        }

        const loadingEmbed = new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('🎶 Song wird geladen...')
            .setDescription('Bitte einen Moment Geduld, wir bereiten alles vor. 🎵');

        await interaction.reply({ embeds: [loadingEmbed] });

        try {
            const songInfo = await ytdlp(songUrl, {
                dumpSingleJson: true,
                noPlaylist: true,
            });

            const title = songInfo.title || 'Unbekannter Titel';
            const filePath = path.join(downloadsDir, `${title.replace(/[\/\\?%*:|"<>]/g, '')}.mp3`);

            global.queue.push({
                title,
                url: songUrl,
                filePath,
            });

            if (!global.player || global.player.state.status === AudioPlayerStatus.Idle) {
                await playNext(interaction, voiceChannel);
            } else {
                const addedToQueueEmbed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('📥 Zur Warteschlange hinzugefügt')
                    .setDescription(`**${title}** wurde zur Warteschlange hinzugefügt. ✅`);
                await interaction.editReply({ embeds: [addedToQueueEmbed] });
            }
        } catch (error) {
            console.error('❌ Fehler beim Abrufen des Song-Titels:', error);

            const errorEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('❌ Fehler beim Abrufen')
                .setDescription('Es gab ein Problem beim Abrufen der Informationen zum Song. Überprüfe die URL und versuche es erneut.');
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};

async function playNext(interaction, voiceChannel) {
    if (global.queue.length === 0) {
        if (global.connection) global.connection.destroy();
        global.player = null;
        global.connection = null;
        console.log('🎵 Die Warteschlange ist leer.');

        const emptyQueueEmbed = new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('🛑 Warteschlange beendet')
            .setDescription('Alle Songs wurden abgespielt. Füge neue Songs mit `/play` hinzu!');
        await interaction.editReply({ embeds: [emptyQueueEmbed] });
        return;
    }

    const song = global.queue.shift();
    console.log(`🔽 Lade herunter: ${song.url}`);
    try {
        await ytdlp(song.url, {
            output: song.filePath,
            format: 'bestaudio',
            extractAudio: true,
            audioFormat: 'mp3',
        });

        console.log(`✅ Download abgeschlossen: ${song.filePath}`);

        if (!global.connection) {
            global.connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });
        }

        global.player = createAudioPlayer();

        const resource = createAudioResource(song.filePath);
        global.player.play(resource);
        global.connection.subscribe(global.player);

        const nowPlayingEmbed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('🎵 Jetzt läuft')
            .setDescription(`**${song.title}** wird jetzt abgespielt.`)
            .setFooter({ text: 'Viel Spaß beim Zuhören! 🎶' });

        await interaction.editReply({ embeds: [nowPlayingEmbed] });

        global.player.on(AudioPlayerStatus.Idle, async () => {
            console.log('🎵 Song beendet, nächster Song wird gespielt...');
            await playNext(interaction, voiceChannel);
        });

        global.player.on('error', error => {
            console.error('❌ Fehler beim Abspielen:', error);
        });
    } catch (error) {
        console.error('❌ Fehler beim Herunterladen oder Abspielen:', error);

        const errorEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ Fehler beim Abspielen')
            .setDescription('Es gab ein Problem beim Herunterladen oder Abspielen des Songs. Überspringe zum nächsten Song oder versuche es erneut.');
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}
