import express from 'express';
import bcrypt from 'bcrypt';
import { db, initDb } from '../config/database.mjs';
const router = express.Router();
const SALT_ROUNDS = 12;

initDb(); // Kjører init én gang

// --- PROFIL ---
router.get('/profile', async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: "Mangler brukernavn" });
    
    try {
        const user = await db.getUserByUsername(username);
        const topScores = await db.getTopScores(username);
        
        res.json({ 
            profilePic: user?.profile_pic || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png', 
            topScores 
        });
    } catch (err) {
        res.status(500).json({ error: "Serverfeil ved henting av profil" });
    }
});

// --- SCORE ---
router.post('/score', async (req, res) => {
    const { username, score } = req.body;
    if (!username || score === undefined || score <= 0) return res.json({ message: "Ugyldig score." });

    try {
        await db.query('INSERT INTO scores (username, score) VALUES ($1, $2)', [username.trim(), score]);
        res.json({ success: true, message: "Score lagret!" });
    } catch (err) {
        res.status(500).json({ error: "Kunne ikke lagre score" });
    }
});

router.delete('/score/:id', async (req, res) => {
    const { id } = req.params;
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: "Brukernavn mangler" });

    try {
        const result = await db.deleteScoreById(id, username);
        if (result.rowCount === 0) return res.status(404).json({ error: "Ingen score slettet" });
        res.json({ message: "Slettet" });
    } catch (err) {
        res.status(500).json({ error: "Feil ved sletting" });
    }
});

// --- AUTH ---
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await db.getUserByUsername(username);
        if (!user) return res.status(401).json({ error: "Feil bruker/passord" });

        const match = await bcrypt.compare(password.trim(), user.password);
        if (!match) return res.status(401).json({ error: "Feil bruker/passord" });

        res.json({ message: "OK", user: { name: user.username } });
    } catch (err) {
        res.status(500).json({ error: "Feil ved innlogging" });
    }
});


export default router;