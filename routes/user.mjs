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
        console.log("Database initialisert: Tabellen 'users' er klar.");
    } catch (err) {
        console.error("Feil ved initialisering av database:", err.message);
    }
}
initDb();


router.post('/register', async (req, res) => {
    const { username, password, consent } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: "Brukernavn og passord kreves." });
    }

    if (consent !== true && consent !== "true") {
        return res.status(400).json({ error: "Du må godta vilkårene (ToS) for å lage bruker." });
    }

    try {
        const id = Math.random().toString(16).slice(2);
        
        // Vasker dataene
        const cleanUser = username.trim();
        const cleanPass = password.trim();
        const hasConsented = true; 

        await pool.query(
            'INSERT INTO users (id, username, password, consented) VALUES ($1, $2, $3, $4)',
            [id, cleanUser, cleanPass, hasConsented]
        );
        
        console.log(`Ny bruker opprettet: ${cleanUser}`);
        res.status(201).json({ message: "Bruker opprettet! Du kan nå logge inn.", user: { name: cleanUser } });

    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: "Brukernavnet er allerede tatt. Velg et annet." });
        }
        
        console.error(" Databasefeil ved registrering:", err.message);
        res.status(500).json({ error: "Serverfeil: Kunne ikke opprette bruker." });
    }
});


router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Brukernavn og passord kreves." });
    }

    try {
        const cleanUser = username.trim();
        const cleanPass = password.trim();

        const result = await pool.query(
            'SELECT username, score FROM users WHERE username = $1 AND password = $2',
            [cleanUser, cleanPass]
        );

        if (result.rows.length > 0) {
            console.log(`🔑 Bruker logget inn: ${cleanUser}`);
            res.json({ 
                message: "Logget inn!", 
                user: { 
                    name: result.rows[0].username,
                    score: result.rows[0].score 
                } 
            });
        } else {
            res.status(401).json({ error: "Feil brukernavn eller passord." });
        }
    } catch (err) {
        console.error("Databasefeil ved innlogging:", err.message);
        res.status(500).json({ error: "Serverfeil ved innlogging." });
    }
});


router.delete('/delete', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Mangler brukernavn eller passord for å slette." });
    }

    try {
        const result = await pool.query(
            'DELETE FROM users WHERE username = $1 AND password = $2',
            [username.trim(), password.trim()]
        );

        if (result.rowCount > 0) {
            console.log(`Bruker slettet: ${username}`);
            res.json({ message: "Bruker slettet fra databasen." });
        } else {
            res.status(404).json({ error: "Fant ikke brukeren eller feil passord." });
        }
    } catch (err) {
        console.error("Databasefeil ved sletting:", err.message);
        res.status(500).json({ error: "Serverfeil ved sletting." });
    }
});

export default router;