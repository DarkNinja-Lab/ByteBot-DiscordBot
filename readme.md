<div align="center">

# 🤖 ByteBot

### Ein vielseitiger Discord-Bot für deinen Server

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![MariaDB](https://img.shields.io/badge/MariaDB-MySQL-003545?style=for-the-badge&logo=mariadb&logoColor=white)](https://mariadb.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE.md)

<br>

Ein Discord-Bot mit Levelsystem, Reaction Roles, Musik, Feedback,
Willkommensnachrichten und Server-Logging.

</div>

---

## 📋 Inhaltsverzeichnis

- [✨ Funktionen](#-funktionen)
- [🛠️ Voraussetzungen](#️-voraussetzungen)
- [🚀 Installation](#-installation)
- [🐳 Docker](#-docker)
- [⚙️ Umgebungsvariablen](#️-umgebungsvariablen)
- [📜 Befehle](#-befehle)
- [⭐ Levelsystem](#-levelsystem)
- [🎭 Reaction Roles](#-reaction-roles)
- [📝 Logging](#-logging)
- [📁 Projektstruktur](#-projektstruktur)
- [🗃️ Datenbank](#️-datenbank)
- [🐛 Fehlerbehebung](#-fehlerbehebung)
- [📄 Lizenz](#-lizenz)

---

## ✨ Funktionen

- 👋 Willkommensnachrichten für neue Mitglieder
- 🧹 Bereinigung ehemaliger Mitglieder
- 🎭 Reaction Roles mit Standard- und benutzerdefinierten Emojis
- ⭐ Levelsystem mit XP und Cooldown
- 🏆 Leaderboard und Server-Rang
- ✨ Moderne Level-Up-Nachrichten
- 🎵 Musik mit Warteschlange
- ⏭️ Skip- und Stop-Funktionen
- 🧹 Nachrichten löschen
- 💬 Feedback-System
- 📝 Server-Logging
- 🔐 Zentrale Berechtigungsprüfungen
- 🛡️ Prüfung der Rollen-Hierarchie
- 🗃️ MariaDB-/MySQL-Unterstützung
- 🐳 Docker-Unterstützung
- 🔄 Sauberes Herunterfahren bei Docker und Unraid

---

## 🛠️ Voraussetzungen

- **Node.js 20 oder höher**
- **MariaDB oder MySQL**
- Ein Discord-Bot mit Token
- Eine Discord Application ID
- Optional: Docker und Docker Compose

Für den Bot müssen folgende Discord-Intents aktiviert sein:

- `Guilds`
- `GuildMessages`
- `MessageContent`
- `GuildVoiceStates`
- `GuildMembers`
- `GuildMessageReactions`

---

## 🚀 Installation

Repository klonen:

```bash
git clone https://github.com/DarkNinja-Lab/ByteBot-DiscordBot.git
cd ByteBot-DiscordBot
```

Abhängigkeiten installieren:

```bash
npm install
```

Datenbank importieren:

```bash
mysql -u DEIN_DB_USER -p discord < import.sql
```

Bot starten:

```bash
npm start
```

---

## 🐳 Docker

Container bauen und starten:

```bash
docker compose up -d --build
```

Logs anzeigen:

```bash
docker compose logs -f
```

Container stoppen:

```bash
docker compose down
```

Nach Änderungen neu bauen:

```bash
docker compose down
docker compose up -d --build --force-recreate
```

Beim Herunterfahren reagiert der Bot auf:

```text
SIGINT
SIGTERM
```

Dabei werden unter anderem:

- Discord-Verbindungen geschlossen
- Voice-Verbindungen beendet
- Warteschlangen geleert
- Datenbankverbindungen geschlossen

---

## ⚙️ Umgebungsvariablen

Erstelle im Projektverzeichnis eine Datei namens `.env`:

```env
# Discord
DISCORD_TOKEN=DEIN_DISCORD_BOT_TOKEN
DISCORD_APPLICATION_ID=DEINE_DISCORD_APPLICATION_ID

# Datenbank
DB_HOST=localhost
DB_USER=DEIN_DB_BENUTZER
DB_PASS=DEIN_DB_PASSWORT
DB_NAME=discord
DB_PORT=3306

# Optionale Einstellungen
DB_CONNECTION_LIMIT=10
DEBUG_SQL=false
```

### 🔍 SQL-Debugging

Im normalen Betrieb:

```env
DEBUG_SQL=false
```

Für die Fehlersuche:

```env
DEBUG_SQL=true
```

Danach den Container neu erstellen:

```bash
docker compose down
docker compose up -d --build --force-recreate
```

Die `.env`-Datei darf nicht veröffentlicht oder in Git gespeichert werden.

---

## 📜 Befehle

Die Hilfe im Discord kann mit folgendem Befehl geöffnet werden:

```text
/hilfe
```

Aktuell vorhandene Befehle:

```text
/clearmessages
/feedback-send
/feedback-setoutput
/hilfe
/leaderboard
/level
/play
/queue
/reactionrole
/removereactionrole
/xp-remove
/xp-setlevelpoints
/xp-setlevelreward
/xp-setlevelupchannel
/setlogchannel
/setwelcomechannel
/skip
/stop
```

Je nach Befehl werden unterschiedliche Berechtigungen benötigt.

---

## ⭐ Levelsystem

Benutzer erhalten XP durch normale Nachrichten auf dem Server.

Dabei gelten folgende Regeln:

- 🤖 Bot-Nachrichten werden ignoriert
- ✍️ Sehr kurze Nachrichten geben keine XP
- 🎲 Die XP-Menge wird zufällig bestimmt
- ⏱️ Ein Cooldown verhindert XP-Spam
- 📈 Höhere Level benötigen mehr XP
- 🔒 Pro Benutzer und Server gibt es nur einen Level-Datensatz
- 🧹 Leveldaten ehemaliger Mitglieder werden entfernt
- 🛡️ Gleichzeitige XP-Verarbeitung wird abgesichert

Level anzeigen:

```text
/level
```

Level eines anderen Benutzers anzeigen:

```text
/level user:@Benutzer
```

Leaderboard anzeigen:

```text
/leaderboard
```

Die Leveldaten werden in der Tabelle `levels` gespeichert.

Wichtig ist der eindeutige Datenbankindex:

```sql
UNIQUE KEY unique_user_guild (user_id, guild_id)
```

---

## 🎭 Reaction Roles

Mit Reaction Roles können Benutzer sich über Reaktionen selbst Rollen geben.

Der Bot prüft vor jeder Vergabe:

- Existiert die Rolle noch?
- Ist die Rolle keine verwaltete Rolle?
- Kann der Bot die Rolle verwalten?
- Steht die Bot-Rolle über der Zielrolle?
- Ist der Benutzer noch Mitglied des Servers?
- Besitzt der Benutzer die Rolle bereits?

Die Bot-Rolle muss in den Servereinstellungen über allen Reaction-Role-Rollen stehen.

Reaction Roles werden in dieser Tabelle gespeichert:

```text
reaction_roles
```

Beim Start prüft der Bot außerdem bestehende Reaction Roles und bereinigt alte Reaktionen ehemaliger Mitglieder.

---

## 📝 Logging

Über diesen Befehl kann ein Log-Kanal festgelegt werden:

```text
/setlogchannel
```

Der Bot kann unter anderem folgende Ereignisse protokollieren:

- 🗑️ Gelöschte Nachrichten
- ✏️ Bearbeitete Nachrichten
- 👋 Neue Mitglieder
- 🚪 Mitglieder, die den Server verlassen
- 👢 Gekickte Mitglieder
- ⛔ Banns
- ✅ Entbannungen
- 📝 Nickname-Änderungen
- 🎙️ Änderungen am Voice-Status
- 😊 Erstellte Emojis
- 🗑️ Gelöschte Emojis

Das Logging ist von der eigentlichen Bot-Logik getrennt.

Dadurch verarbeitet `log.js` keine Reaction Roles und vergibt keine Rollen doppelt.

---

## 📁 Projektstruktur

```text
.
├── bot.js
├── db.js
├── config.js
├── log.js
├── import.sql
├── package.json
├── Dockerfile
│
├── commands/
│   ├── clear.js
│   ├── feedback.js
│   ├── help.js
│   ├── leaderboard.js
│   ├── level.js
│   ├── play.js
│   ├── queue.js
│   ├── reactionrole.js
│   ├── removexp.js
│   ├── setfeedback.js
│   ├── setlevelpoints.js
│   ├── setlevelreward.js
│   ├── setlevelupchannel.js
│   ├── setlogchannel.js
│   ├── setwelcome.js
│   ├── skip.js
│   └── stop.js
│
├── events/
│   ├── guildMemberAdd.js
│   ├── guildMemberRemove.js
│   ├── messageCreate.js
│   ├── messageReactionAdd.js
│   ├── messageReactionRemove.js
│   └── processExistingReactions.js
│
└── utils/
    ├── cleanupDepartedMembers.js
    ├── levelSystem.js
    └── permissions.js
```

### Wichtige Dateien

| Datei | Aufgabe |
|---|---|
| `bot.js` | Startet den Bot und lädt Befehle und Events |
| `db.js` | Verbindung zu MariaDB/MySQL |
| `config.js` | Serverbezogene Konfiguration |
| `log.js` | Server-Logging |
| `utils/levelSystem.js` | XP, Level und Leaderboard |
| `utils/permissions.js` | Zentrale Berechtigungsprüfungen |
| `utils/cleanupDepartedMembers.js` | Bereinigung ehemaliger Mitglieder |
| `import.sql` | Datenbankstruktur |

---

## 🗃️ Datenbank

Die Datenbankstruktur befindet sich in:

```text
import.sql
```

Wichtige Tabellen:

```text
config
levels
level_settings
levelup_channels
reaction_roles
server_config
feedback_settings
```

Für die `levels`-Tabelle sollte dieser Unique-Key vorhanden sein:

```sql
UNIQUE KEY unique_user_guild (user_id, guild_id)
```

Für ein Datenbank-Backup:

```bash
mysqldump -u DEIN_DB_USER -p discord > bytebot_backup.sql
```

---

## 🐛 Fehlerbehebung

Container-Logs anzeigen:

```bash
docker compose logs --tail=200 bytebot-discordbot
```

Wenn eine Reaction Role nicht funktioniert, prüfe:

1. Existiert die Rolle noch?
2. Steht die Bot-Rolle über der Zielrolle?
3. Hat der Bot `Rollen verwalten`?
4. Stimmen Nachrichten-ID, Kanal-ID und Rollen-ID?
5. Ist das Emoji korrekt gespeichert?

Wenn keine XP gespeichert werden, prüfe:

```sql
SELECT
    user_id,
    guild_id,
    xp,
    level
FROM levels
ORDER BY level DESC, xp DESC;
```

Unique-Index prüfen:

```sql
SHOW INDEX FROM levels;
```

Bei Datenbankproblemen kann vorübergehend aktiviert werden:

```env
DEBUG_SQL=true
```

---

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz.

Die Lizenz befindet sich in:

```text
LICENSE.md
```

---

## 🔗 Links

- [Discord Developer Portal](https://discord.com/developers/applications)
- [discord.js](https://discord.js.org/)
- [Node.js](https://nodejs.org/)
- [MariaDB](https://mariadb.org/)
- [Docker](https://www.docker.com/)

---

<div align="center">

⭐
