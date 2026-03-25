import express from 'express';
import pg from 'pg';
import bcrypt from 'bcrypt';
const { Pool } = pg;

const router = express.Router();
const SALT_ROUNDS = 12;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- DATABASE INIT ---
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
            CREATE TABLE IF NOT EXISTS scores (
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL,
                score INTEGER NOT NULL,
                played_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("Database initialisert.");
    } catch (err) {
        console.error("DB Init feil:", err.message);
    }
}
initDb();

// --- PROFIL-RUTER ---

router.get('/profile', async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: "Mangler brukernavn" });
    
    try {
        const userRes = await pool.query('SELECT profile_pic FROM users WHERE username = $1', [username.trim()]);
        
        const scoreRes = await pool.query(
            'SELECT id, score, played_at FROM scores WHERE username = $1 ORDER BY score DESC LIMIT 5', 
            [username.trim()]
        );
        
        res.json({ 
            profilePic: userRes.rows[0]?.profile_pic || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png', 
            topScores: scoreRes.rows 
        });
    } catch (err) {
        res.status(500).json({ error: "Serverfeil ved henting av profil" });
    }
});

router.post('/score', async (req, res) => {
    const { username, score } = req.body;
    if (!username || score === undefined || score <= 0) return res.json({ message: "Ugyldig score." });

    try {
        await pool.query('INSERT INTO scores (username, score) VALUES ($1, $2)', [username.trim(), score]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Kunne ikke lagre score" });
    }
});

router.delete('/score/:id', async (req, res) => {
    const { id } = req.params;
    const { username } = req.query;

    if (!username) return res.status(400).json({ error: "Brukernavn mangler" });

    try {
        await pool.query('DELETE FROM scores WHERE id = $1 AND username = $2', [id, username.trim()]);
        res.json({ message: "Slettet" });
    } catch (err) {
        res.status(500).json({ error: "Feil ved sletting" });
    }
});

router.post('/update-pic', async (req, res) => {
    const { username, imageUrl } = req.body;
    try {
        await pool.query('UPDATE users SET profile_pic = $1 WHERE username = $2', [imageUrl, username.trim()]);
        res.json({ message: "Bilde oppdatert!" });
    } catch (err) {
        res.status(500).json({ error: "Kunne ikke lagre bilde" });
    }
});

router.post('/update-password', async (req, res) => {
    const { username, oldPassword, newPassword } = req.body;

    try {
        // Hent brukeren fra databasen
        const result = await pool.query('SELECT password FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Bruker ikke funnet" });

        // Sjekk om gammelt passord er korrekt
        const match = await bcrypt.compare(oldPassword, result.rows[0].password);
        if (!match) return res.status(401).json({ error: "Gammelt passord er feil" });

        // Hash det nye passordet og lagre
        const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await pool.query('UPDATE users SET password = $1 WHERE username = $2', [hashedNewPassword, username]);

        res.json({ message: "Passord oppdatert" });
    } catch (err) {
        res.status(500).json({ error: "Serverfeil ved oppdatering av passord" });
    }
});

router.post('/register', async (req, res) => {
    const { username, password, consent } = req.body;
    if (!username || !password || !consent) return res.status(400).json({ error: "Mangler info eller samtykke." });

    try {
        const cleanUser = username.trim();
        const hashedPassword = await bcrypt.hash(password.trim(), SALT_ROUNDS);
        const id = Math.random().toString(16).slice(2);

        await pool.query(
            'INSERT INTO users (id, username, password, consented) VALUES ($1, $2, $3, $4)',
            [id, cleanUser, hashedPassword, true]
        );
        res.status(201).json({ message: "Bruker opprettet" });
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: "Tatt!" });
        res.status(500).json({ error: "Serverfeil" });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT username, password FROM users WHERE username = $1', [username.trim()]);
        if (result.rows.length === 0) return res.status(401).json({ error: "Feil bruker/passord" });

        const match = await bcrypt.compare(password.trim(), result.rows[0].password);
        if (!match) return res.status(401).json({ error: "Feil bruker/passord" });

        res.json({ message: "OK", user: { name: result.rows[0].username } });
    } catch (err) {
        res.status(500).json({ error: "Feil ved innlogging" });
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