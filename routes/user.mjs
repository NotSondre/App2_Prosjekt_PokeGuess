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
                score INTEGER DEFAULT 0
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

        // Tabell for individuelle spilløkter
        await pool.query(`
            CREATE TABLE IF NOT EXISTS scores (
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL,
                score INTEGER NOT NULL,
                played_at TIMESTAMP DEFAULT NOW()
            );
        `);

        console.log("Database initialisert: Tabellene users og scores er klare.");
    } catch (err) {
        console.error("Kritisk feil ved initialisering av database:", err.message);
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
    if (!hasConsented) {
        return res.status(400).json({ error: "Du ma godta vilkarene (ToS) for a lage bruker." });
    }

    try {
        const id = Math.random().toString(16).slice(2);
        const cleanUser = username.trim();
        const cleanPass = password.trim();

        const hashedPassword = await bcrypt.hash(cleanPass, SALT_ROUNDS);

        await pool.query(
            'INSERT INTO users (id, username, password, consented) VALUES ($1, $2, $3, $4)',
            [id, cleanUser, hashedPassword, true]
        );
        
        console.log("Bruker opprettet i DB:", cleanUser);
        res.status(201).json({ 
            message: "Bruker opprettet! Du kan na logge inn.", 
            user: { name: cleanUser } 
        });

    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: "Brukernavnet er allerede tatt." });
        }
        console.error("Databasefeil ved registrering:", err.message, err.stack);
        res.status(500).json({ error: "Serverfeil: Kunne ikke opprette bruker i databasen." });
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
            'SELECT username, password, score FROM users WHERE username = $1',
            [cleanUser]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Feil brukernavn eller passord." });
        }

        const passwordMatch = await bcrypt.compare(cleanPass, result.rows[0].password);
        if (!passwordMatch) {
            return res.status(401).json({ error: "Feil brukernavn eller passord." });
        }

        console.log("Logget inn:", cleanUser);
        res.json({ 
            message: "Logget inn!", 
            user: { 
                name: result.rows[0].username,
                score: result.rows[0].score 
            } 
        });

    } catch (err) {
        console.error("Databasefeil ved innlogging:", err.message);
        res.status(500).json({ error: "Serverfeil ved innlogging." });
    }
});

router.delete('/delete', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Mangler brukernavn eller passord." });
    }

    try {
        const cleanUser = username.trim();
        const cleanPass = password.trim();

        const result = await pool.query(
            'SELECT password FROM users WHERE username = $1',
            [cleanUser]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Fant ikke brukeren eller feil passord." });
        }

        const passwordMatch = await bcrypt.compare(cleanPass, result.rows[0].password);
        if (!passwordMatch) {
            return res.status(401).json({ error: "Fant ikke brukeren eller feil passord." });
        }

        await pool.query('DELETE FROM scores WHERE username = $1', [cleanUser]);
        await pool.query('DELETE FROM users WHERE username = $1', [cleanUser]);

        console.log("Slettet bruker:", username);
        res.json({ message: "Bruker slettet fra databasen." });

    } catch (err) {
        console.error("Databasefeil ved sletting:", err.message);
        res.status(500).json({ error: "Serverfeil ved sletting." });
    }
});

// Lagrer en spilløkt når brukeren er ferdig (score > 0)
router.post('/score', async (req, res) => {
    const { username, score } = req.body;

    if (!username || score === undefined) {
        return res.status(400).json({ error: "Mangler brukernavn eller poengsum." });
    }

    if (score <= 0) {
        return res.json({ message: "Score på 0 lagres ikke." });
    }

    try {
        await pool.query(
            'INSERT INTO scores (username, score) VALUES ($1, $2)',
            [username.trim(), score]
        );
        res.json({ message: "Score lagret!" });
    } catch (err) {
        console.error("Databasefeil ved score-lagring:", err.message);
        res.status(500).json({ error: "Serverfeil ved score-lagring." });
    }
});

// Henter brukerens topp 3 scorer
router.get('/profile', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: "Mangler brukernavn." });
    }

    try {
        const result = await pool.query(
            'SELECT score, played_at FROM scores WHERE username = $1 ORDER BY score DESC LIMIT 3',
            [username.trim()]
        );
        res.json({ topScores: result.rows });
    } catch (err) {
        console.error("Databasefeil ved henting av profil:", err.message);
        res.status(500).json({ error: "Serverfeil ved henting av profil." });
    }
});

export default router;
