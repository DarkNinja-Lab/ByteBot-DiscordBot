const mysql = require('mysql2/promise');
require('dotenv').config();

// Erstelle den Verbindungspool für MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'bot_database',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,  // Timeout von 10 Sekunden
});

// Teste die Verbindung beim Start
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ [INFO] Verbindung zur Datenbank erfolgreich.');
        connection.release();  // Verbindung nach Test freigeben
    } catch (error) {
        console.error('❌ [ERROR] Fehler bei der Verbindung zur Datenbank:', error.message || error);
        process.exit(1);  // Bot stoppen, wenn keine Verbindung möglich ist
    }
})();

// Exportiere Methoden zur Abfrage und zum Pool
module.exports = {
    /**
     * Führt eine SQL-Abfrage aus.
     * @param {string} sql - Die SQL-Abfrage.
     * @param {Array} params - Parameter für die SQL-Abfrage.
     * @returns {Promise<[]>} - Ergebnisse der Abfrage.
     */
    query: async (sql, params) => {
        try {
            console.log(`➡️ [DEBUG] Führe Abfrage aus: ${sql} mit Parametern: ${JSON.stringify(params)}`);
            const [rows] = await pool.execute(sql, params);
            return rows;
        } catch (error) {
            console.error('❌ [ERROR] Fehler bei der SQL-Abfrage:', {
                sql,
                params,
                error: error.message || error,
            });
            throw error;  // Fehler weiter werfen
        }
    },

    /**
     * Liefert den Connection Pool für erweiterte Abfragen.
     * @returns {mysql.Pool} - Der MariaDB Connection Pool.
     */
    pool: pool,

    /**
     * Schließt alle offenen Verbindungen zum Pool.
     */
    close: async () => {
        try {
            await pool.end();
            console.log('✅ [INFO] Alle Verbindungen zum Pool wurden geschlossen.');
        } catch (error) {
            console.error('❌ [ERROR] Fehler beim Schließen des Pools:', error.message || error);
        }
    }
};
