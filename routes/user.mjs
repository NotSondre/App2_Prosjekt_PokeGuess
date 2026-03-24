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
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                consented BOOLEAN NOT NULL,
                score INTEGER DEFAULT 0
            );
        `);
        console.log("✅ Database initialisert: Tabellen 'users' er klar.");
    } catch (err) {
        console.error("❌ Feil ved initialisering av database:", err);
    }
}
initDb();


router.post('/register', async (req, res) => {
    const { username, password, consent } = req.body;
    
    if (!consent) {
        return res.status(400).json({ error: "Mangler samtykke (ToS)." });
    }

    try {
        const id = Math.random().toString(16).slice(2);
        await pool.query(
            'INSERT INTO users (id, username, password, consented) VALUES ($1, $2, $3, $4)',
            [id, username, password, consent]
        );
        
        res.status(201).json({ message: "Bruker opprettet!", user: { name: username } });
    } catch (err) {
        console.error("Databasefeil ved registrering:", err);
        res.status(500).json({ error: "Kunne ikke opprette bruker (kanskje navnet er tatt?)" });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Brukernavn og passord kreves." });
    }

    try {
        const result = await pool.query(
            'SELECT username FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );

        if (result.rows.length > 0) {
            res.json({ 
                message: "Logget inn!", 
                user: { name: result.rows[0].username } 
            });
        } else {
            res.status(401).json({ error: "Feil brukernavn eller passord." });
        }
    } catch (err) {
        console.error("Databasefeil ved innlogging:", err);
        res.status(500).json({ error: "Serverfeil ved innlogging." });
    }
});

router.delete('/delete', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query(
            'DELETE FROM users WHERE username = $1 AND password = $2',
            [username, password]
        );

        if (result.rowCount > 0) {
            res.json({ message: "Bruker slettet fra databasen." });
        } else {
            res.status(404).json({ error: "Bruker ikke funnet eller feil passord." });
        }
    } catch (err) {
        console.error("Databasefeil ved sletting:", err);
        res.status(500).json({ error: "Serverfeil ved sletting." });
    }
});

export default router;