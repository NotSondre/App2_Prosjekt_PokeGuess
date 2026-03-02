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

async function initStatsDb() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS stats (
            username TEXT PRIMARY KEY,
            correct_guesses INTEGER DEFAULT 0,
            wrong_guesses INTEGER DEFAULT 0
        );
    `);
}
initStatsDb();

// Eksempel: Oppdater statistikk når brukeren gjetter [cite: 2026-01-19]
router.post('/guess', async (req, res) => {
    const { username, isCorrect } = req.body;

    try {
        if (isCorrect) {
            await pool.query(
                `INSERT INTO stats (username, correct_guesses) VALUES ($1, 1)
                 ON CONFLICT (username) DO UPDATE SET correct_guesses = stats.correct_guesses + 1`,
                [username]
            );
        } else {
            await pool.query(
                `INSERT INTO stats (username, wrong_guesses) VALUES ($1, 1)
                 ON CONFLICT (username) DO UPDATE SET wrong_guesses = stats.wrong_guesses + 1`,
                [username]
            );
        }
        res.json({ message: "Statistikk oppdatert i PostgreSQL!" });
    } catch (err) {
        console.error("Feil ved oppdatering av statistikk:", err);
        res.status(500).json({ error: "Kunne ikke lagre statistikk." });
    }
});

export default router;