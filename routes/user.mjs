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
        await pool.query('DROP TABLE IF EXISTS users CASCADE;');

        await pool.query(`
            CREATE TABLE users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                consented BOOLEAN NOT NULL DEFAULT TRUE,
                score INTEGER DEFAULT 0
            );
        `);
        console.log("Database initialisert: Tabellen users er nyopprettet.");
    } catch (err) {
        console.error("Kritisk feil ved initialisering:", err);
    }
}

initDb();

router.post('/register', async (req, res) => {
    const { username, password, consent } = req.body;
    
    console.log("Registeringsforsok mottatt for:", username);

    if (!username || !password) {
        return res.status(400).json({ error: "Brukernavn og passord kreves." });
    }

    const hasConsented = (consent === true || consent === "true");

    try {
        const id = Math.random().toString(16).slice(2);
        const cleanUser = username.trim();
        const cleanPass = password.trim();

        await pool.query(
            'INSERT INTO users (id, username, password, consented) VALUES ($1, $2, $3, $4)',
            [id, cleanUser, cleanPass, true]
        );
        
        console.log("Bruker opprettet i DB:", cleanUser);
        res.status(201).json({ 
            message: "Bruker opprettet!", 
            user: { name: cleanUser } 
        });

    } catch (err) {
        console.error("FULL DATABASEFEIL:", err);
        
        if (err.code === '23505') {
            return res.status(400).json({ error: "Brukernavnet er allerede tatt." });
        }
        
        res.status(500).json({ error: "Serverfeil: Sjekk Render-loggen for detaljer." });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT username, score FROM users WHERE username = $1 AND password = $2',
            [username.trim(), password.trim()]
        );

        if (result.rows.length > 0) {
            res.json({ message: "Logget inn!", user: { name: result.rows[0].username, score: result.rows[0].score } });
        } else {
            res.status(401).json({ error: "Feil brukernavn eller passord." });
        }
    } catch (err) {
        console.error("Innloggingsfeil:", err);
        res.status(500).json({ error: "Serverfeil ved innlogging." });
    }
});

router.delete('/delete', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query(
            'DELETE FROM users WHERE username = $1 AND password = $2',
            [username.trim(), password.trim()]
        );
        res.json({ message: "Bruker slettet." });
    } catch (err) {
        res.status(500).json({ error: "Kunne ikke slette." });
    }
});

export default router;