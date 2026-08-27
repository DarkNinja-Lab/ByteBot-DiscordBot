const mysql = require('mysql2/promise');

require('dotenv').config();

const debugSql = process.env.DEBUG_SQL === 'true';

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'discord',
    port: Number(process.env.DB_PORT) || 3306,

    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0,

    connectTimeout: 10_000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});

let isClosed = false;

function formatSqlParams(params) {
    if (!Array.isArray(params)) {
        return [];
    }

    return params.map(value => {
        if (typeof value === 'string' && value.length > 100) {
            return `${value.slice(0, 100)}...`;
        }

        return value;
    });
}

async function testConnection() {
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.ping();

        console.log('✅ [INFO] Verbindung zur Datenbank erfolgreich.');
    } catch (error) {
        console.error(
            '❌ [ERROR] Datenbankverbindung fehlgeschlagen:',
            error.message || error
        );

        throw error;
    } finally {
        connection?.release();
    }
}

async function query(sql, params = []) {
    if (isClosed) {
        const error = new Error(
            'Die Datenbankverbindung wurde bereits geschlossen.'
        );

        error.code = 'DB_POOL_CLOSED';

        throw error;
    }

    const safeParams = formatSqlParams(params);

    if (debugSql) {
        console.log(
            `➡️ [DEBUG] SQL: ${sql.trim()} | Parameter: ${JSON.stringify(safeParams)}`
        );
    }

    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error(
            '❌ [ERROR] Fehler bei der SQL-Abfrage:',
            {
                code: error.code,
                errno: error.errno,
                sql: sql.trim(),
                params: safeParams,
                message: error.message || error,
            }
        );

        throw error;
    }
}

async function close() {
    if (isClosed) {
        return;
    }

    isClosed = true;

    try {
        await pool.end();
        console.log(
            '✅ [INFO] Alle Datenbankverbindungen wurden geschlossen.'
        );
    } catch (error) {
        console.error(
            '❌ [ERROR] Fehler beim Schließen des Datenbankpools:',
            error.message || error
        );
    }
}

module.exports = {
    query,
    pool,
    testConnection,
    close,
};