# Basisimage
FROM node:20-alpine

# Python installieren (für yt-dlp-exec)
RUN apk add --no-cache python3 py3-pip

# Arbeitsverzeichnis im Container
WORKDIR /app

# package.json und package-lock.json kopieren
COPY package*.json ./

# Abhängigkeiten installieren
RUN npm install

# Restliche Files reinkopieren
COPY . .

# Bot starten
CMD ["node", "bot.js"]
