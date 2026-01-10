# 🎉 Discord Bot

Ein vielseitiger **Discord Bot**, der verschiedene Funktionen bietet, um deinen Server lebendig und interaktiv zu halten. Von **Willkommensnachrichten** bis hin zu **Reaktionsrollen** und **mini Games** – dieser Bot sorgt dafür, dass deine Community sich willkommen und engagiert fühlt.

---

## 🚀 Aktuelle Features

- **Willkommensnachrichten**: Sende eine zufällige Nachricht, wenn ein neues Mitglied beitritt.
- **Reaktionsrollen**: Vergib Rollen basierend auf Reaktionen auf bestimmte Nachrichten.
- **Hilfe Menüs**: Bietet eine übersichtliche Anleitung für alle verfügbaren Befehle und Funktionen.
- **Musik Bot**: Spielt Musik direkt auf dem Server ab und bietet Features wie Queue, Skip, Stop.
- **Reward System**: Belohnt Mitglieder für ihre Aktivität mit Punkten, Rängen oder anderen Anreizen.
- **Clear Messages**: rmöglicht das schnelle Löschen von Nachrichten, um Chats sauber zu halten.
- **Server Logging**: Protokolliert wichtige Ereignisse und Aktivitäten auf dem Server für Übersicht und Sicherheit.
- **Server Feedback**: Ermöglicht es Mitgliedern, Feedback zu geben, um den Server zu verbessern.


## 🚀 Geplante Features
- **mini Games**: Count 1 - Unendlich mit Leaderboard bzw ShameTag.
- **Bump Reminder**: Bump Reminder für Disboard.
- **Moderation**: Automatische Moderation (z. B. für Spam, Links oder toxische Sprache), Befehle zum Stummschalten, Kicken, Bannen und Verwarnen.

---

## 🛠️ Installation

### Voraussetzungen

- Node.js (>= 16.x)
- Eine Discord-Bot-Token
- Eine MySQL-Datenbank (oder eine kompatible SQL-Datenbank)

---
### Schritte zur Installation

1. **Repository klonen:** ```git clone https://github.com/DarkNinja-Lab/Happy-Manager.git```

2. **Ins Verzeichniss** ```cd Happy-Manager```

3. **Abhängigkeiten installieren**: ```npm install```

4. Umgebungsvariablen einrichten: Erstelle eine .env-Datei im Projektordner und füge dein Bot-Token sowie andere Konfigurationen hinzu:

```
# Discord Bot Credentials
DISCORD_TOKEN=CHANGEMENOW
DISCORD_APPLICATION_ID=CHANGEMENOW

# Dashboard Configuration
DISCORD_CLIENT_ID=CHANGEMENOW
DISCORD_CLIENT_SECRET=CHANGEMENOW
DISCORD_CALLBACK_URL=http://localhost/auth/callback
PORT=80

# Session Secret for Dashboard
SESSION_SECRET=CHANGEMENOW

# Database Configuration
DB_HOST=CHANGEMENOW
DB_USER=CHANGEMENOW
DB_PASS=CHANGEMENOW
DB_NAME=discord
DB_PORT=3306

```

5. Bot starten: ```npm start```
---
### 🤖 Befehle

- ```!reactionrole:``` Erstellt eine Nachricht, auf die Benutzer mit Emojis reagieren können, um eine Rolle zu erhalten.
- ```!setWelcomeChannel:``` Setze den Kanal, in dem neue Mitglieder begrüßt werden.
---

### 🛠️ Unterstützte Events

- guildMemberAdd: Begrüßt neue Mitglieder im Server.
- messageCreate: Reagiert auf Nachrichten mit vordefinierten Antworten.
- messageReactionAdd: Weist Rollen basierend auf Emoji-Reaktionen zu.
- messageReactionRemove: Entfernt Rollen, wenn Reaktionen entfernt werden.
- ready: Der Bot ist bereit und läuft.
- processExistingReactions: Verarbeitet bestehende Reaktionen beim Start des Bots.

---
### 💡 Weiterführende Links

- [Discord Developers](https://discord.com/developers/applications)
- [Node.js](https://nodejs.org)
- [MySQL](https://www.mysql.com/de/)
