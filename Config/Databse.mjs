import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Initialiser tabeller
export async function initDb() {
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
        console.log("Database klar.");
    } catch (err) {
        console.error("DB Init feil:", err.message);
    }
}

// Hjelpefunksjoner (Models)
export const db = {
    async query(text, params) {
        return await pool.query(text, params);
    },
    
    async getUserByUsername(username) {
        const res = await pool.query('SELECT * FROM users WHERE username = $1', [username.trim()]);
        return res.rows[0];
    },

    async getTopScores(username) {
        const res = await pool.query(
            'SELECT id, score, played_at FROM scores WHERE username = $1 ORDER BY score DESC LIMIT 5', 
            [username.trim()]
        );
        return res.rows;
    },

    async deleteScoreById(id, username) {
        return await pool.query('DELETE FROM scores WHERE id = $1 AND username = $2', [id, username.trim()]);
    }
    // Her kan du legge til flere spesialiserte funksjoner etter hvert
};