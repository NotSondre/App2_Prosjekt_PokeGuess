// ---------- Database-oppsett ----------
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ---------- Oppstart og tabeller ----------
export async function initDb() {
    try {
        await pool.query(`DROP TABLE IF EXISTS users CASCADE;`);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
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
        console.log("Database klar med SERIAL ID.");
    } catch (err) {
        console.error("DB Init feil:", err.message);
    }
}

// ---------- Database-operasjoner ----------
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

    // Sletter en spesifikk poengsum fra historikken
    async deleteScoreById(id, username) {
        return await pool.query('DELETE FROM scores WHERE id = $1 AND username = $2', [id, username.trim()]);
    }
};