const db = require('./db');

async function getConfig(key) {
    try {
        const [rows] = await db.query('SELECT value FROM config WHERE key_name = ?', [key]);
        if (rows.length === 0) {
            console.warn(`⚠️ [WARN] Konfigurationswert nicht gefunden: ${key}`);
            return null;
        }
        return rows[0].value;
    } catch (error) {
        console.error(`❌ [ERROR] Fehler beim Abrufen der Konfiguration (${key}):`, error);
        return null;
    }
}

async function setConfig(key, value) {
    try {
        await db.query(
            'INSERT INTO config (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
            [key, value]
        );
        console.log(`✅ [INFO] Konfiguration erfolgreich gespeichert: ${key} = ${value}`);
    } catch (error) {
        console.error(`❌ [ERROR] Fehler beim Speichern der Konfiguration (${key}):`, error);
    }
}

module.exports = { getConfig, setConfig };
