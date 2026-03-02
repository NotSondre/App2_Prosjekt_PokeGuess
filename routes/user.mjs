import express from 'express';
import pg from 'pg';
const { Pool } = pg;

const router = express.Router();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false 
    }
});

async function initDb() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            consented BOOLEAN NOT NULL
        );
    `);
}
initDb();

// Registrering av ny bruker i databasen [cite: 2026-01-19]
router.post('/register', async (req, res) => {
    const { username, password, consent } = req.body;
    
    if (!consent) {
        return res.status(400).json({ error: "Mangler samtykke (ToS)." });
    }

    try {
        const id = Math.random().toString(16).slice(2);
        // SQL-spørring for å sette inn brukeren [cite: 2026-01-19]
        await pool.query(
            'INSERT INTO users (id, username, password, consented) VALUES ($1, $2, $3, $4)',
            [id, username, password, consent]
        );
        
        res.status(201).json({ message: "Bruker opprettet i PostgreSQL!", user: { name: username } });
    } catch (err) {
        console.error("Databasefeil ved registrering:", err);
        res.status(500).json({ error: "Kunne ikke opprette bruker (kanskje navnet er tatt?)" });
    }
});

// Sletting av bruker fra databasen [cite: 2026-01-19]
router.delete('/delete', async (req, res) => {
    const { username, password } = req.body;

    try {
        // SQL-spørring for å slette basert på navn og passord [cite: 2026-01-19]
        const result = await pool.query(
            'DELETE FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );

        if (result.rowCount > 0) {
            res.json({ message: "Bruker slettet fra PostgreSQL." });
        } else {
            res.status(404).json({ error: "Bruker ikke funnet eller feil passord." });
        }
    } catch (err) {
        console.error("Databasefeil ved sletting:", err);
        res.status(500).json({ error: "Serverfeil ved sletting." });
    }
});

export default router;