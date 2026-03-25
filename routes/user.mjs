import express from 'express';
import pg from 'pg';
import bcrypt from 'bcrypt';
const { Pool } = pg;

const router = express.Router();
const SALT_ROUNDS = 12;

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
                consented BOOLEAN NOT NULL DEFAULT TRUE,
                score INTEGER DEFAULT 0,
                profile_pic TEXT DEFAULT 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png'
            );
        `);

        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name='users' AND column_name='consented') THEN
                    ALTER TABLE users ADD COLUMN consented BOOLEAN NOT NULL DEFAULT TRUE;
                END IF;
            END $$;
        `);

        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name='users' AND column_name='profile_pic') THEN
                    ALTER TABLE users ADD COLUMN profile_pic TEXT DEFAULT 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png';
                END IF;
            END $$;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS scores (
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL,
                score INTEGER NOT NULL,
                played_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log("Database initialisert: Tabellene users og scores er klare med alle kolonner.");
    } catch (err) {
        console.error("Kritisk feil ved initialisering av database:", err.message);
    }
}
initDb();


router.get('/profile', async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: "Mangler brukernavn" });

    try {
        const cleanUser = username.trim();
        
        const userRes = await pool.query('SELECT profile_pic FROM users WHERE username = $1', [cleanUser]);
        
        const scoreRes = await pool.query(
            'SELECT score, played_at FROM scores WHERE username = $1 ORDER BY score DESC LIMIT 3',
            [cleanUser]
        );

        res.json({ 
            profilePic: userRes.rows[0]?.profile_pic || null,
            topScores: scoreRes.rows 
        });
    } catch (err) {
        console.error("Databasefeil ved henting av profil:", err.message);
        res.status(500).json({ error: "Serverfeil ved henting av profil." });
    }
});

router.post('/update-pic', async (req, res) => {
    const { username, imageUrl } = req.body;
    
    if (!username || !imageUrl) {
        return res.status(400).json({ error: "Mangler brukernavn eller bilde-URL." });
    }

    try {
        await pool.query(
            'UPDATE users SET profile_pic = $1 WHERE username = $2', 
            [imageUrl, username.trim()]
        );
        res.json({ message: "Profilbilde oppdatert!" });
    } catch (err) {
        console.error("Databasefeil ved bildeoppdatering:", err.message);
        res.status(500).json({ error: "Serverfeil ved lagring av bilde." });
    }
});


router.post('/register', async (req, res) => {
    const { username, password, consent } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: "Brukernavn og passord kreves." });
    }

    const hasConsented = (consent === true || consent === "true");
    if (!hasConsented) {
        return res.status(400).json({ error: "Du må godta vilkårene (ToS) for å lage bruker." });
    }

    try {
        const id = Math.random().toString(16).slice(2);
        const cleanUser = username.trim();
        const hashedPassword = await bcrypt.hash(password.trim(), SALT_ROUNDS);

        await pool.query(
            'INSERT INTO users (id, username, password, consented) VALUES ($1, $2, $3, $4)',
            [id, cleanUser, hashedPassword, true]
        );
        
        res.status(201).json({ message: "Bruker opprettet!" });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: "Brukernavnet er tatt." });
        res.status(500).json({ error: "Serverfeil ved registrering." });
    }
});


router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Mangler info." });

    try {
        const cleanUser = username.trim();
        const result = await pool.query('SELECT username, password FROM users WHERE username = $1', [cleanUser]);

        if (result.rows.length === 0) return res.status(401).json({ error: "Feil brukernavn/passord." });

        const match = await bcrypt.compare(password.trim(), result.rows[0].password);
        if (!match) return res.status(401).json({ error: "Feil brukernavn/passord." });

        res.json({ message: "Logget inn!", user: { name: cleanUser } });
    } catch (err) {
        res.status(500).json({ error: "Serverfeil ved innlogging." });
    }
});


router.post('/score', async (req, res) => {
    const { username, score } = req.body;
    if (!username || score === undefined || score <= 0) return res.json({ message: "Ingen score lagret." });

    try {
        await pool.query('INSERT INTO scores (username, score) VALUES ($1, $2)', [username.trim(), score]);
        res.json({ message: "Score lagret!" });
    } catch (err) {
        res.status(500).json({ error: "Serverfeil ved lagring." });
    }
});


router.delete('/delete', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT password FROM users WHERE username = $1', [username.trim()]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Fant ikke bruker." });

        const match = await bcrypt.compare(password.trim(), result.rows[0].password);
        if (!match) return res.status(401).json({ error: "Feil passord." });

        await pool.query('DELETE FROM scores WHERE username = $1', [username.trim()]);
        await pool.query('DELETE FROM users WHERE username = $1', [username.trim()]);
        res.json({ message: "Bruker slettet." });
    } catch (err) {
        res.status(500).json({ error: "Serverfeil ved sletting." });
    }
});

export default router;