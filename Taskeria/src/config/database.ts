// src/config/database.ts

import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

// Carica le variabili d'ambiente dal file .env
dotenv.config();

/**
 * Classe che gestisce la connessione al database MySQL.
 * Implementa il pattern Singleton per garantire una singola istanza della pool di connessioni.
 */
class Database {
    private static instance: Database;
    private pool: Pool | null = null;

    private constructor() {
        // Il costruttore è privato per implementare il pattern Singleton
    }

    /**
     * Restituisce l'istanza del database, creandola se non esiste.
     * Questo garantisce che ci sia sempre una sola istanza della connessione al database.
     */
    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    /**
     * Inizializza la pool di connessioni se non esiste già.
     * Questa funzione è asincrona perché l'inizializzazione della pool potrebbe richiedere tempo.
     */
    private async initPool(): Promise<Pool> {
        if (!this.pool) {
            // Configura la pool di connessioni usando le variabili d'ambiente
            this.pool = mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'taskeria',
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                enableKeepAlive: true,
                keepAliveInitialDelay: 0
            });

            // Verifica la connessione tentando una query semplice
            try {
                const connection = await this.pool.getConnection();
                await connection.ping();
                connection.release();
                console.log('✅ Connessione al database stabilita con successo');
            } catch (error) {
                console.error('❌ Errore nella connessione al database:', error);
                throw error;
            }
        }
        return this.pool;
    }

    /**
     * Esegue una query sul database.
     * Questa è un'interfaccia semplificata per le query che non richiedono una transazione.
     */
    public async execute(sql: string, params?: any[]) {
        const pool = await this.initPool();
        return pool.execute(sql, params);
    }

    /**
     * Ottiene una connessione dal pool.
     * Utile quando si devono eseguire più query in una transazione.
     */
    public async getConnection(): Promise<PoolConnection> {
        const pool = await this.initPool();
        return pool.getConnection();
    }

    /**
     * Chiude tutte le connessioni nel pool.
     * Importante per una chiusura pulita dell'applicazione.
     */
    public async closePool(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            console.log('Database pool chiusa correttamente');
        }
    }

    /**
     * Helper per il logging degli errori del database
     */
    public logError(error: any, context: string) {
        console.error(`Errore database in ${context}:`, {
            message: error.message,
            code: error.code,
            state: error.sqlState,
            sql: error.sql
        });
    }
}

// Esporta un'istanza singola del database
export const db = Database.getInstance();

// Gestione della chiusura pulita dell'applicazione
process.on('SIGINT', async () => {
    await db.closePool();
    process.exit(0);
});