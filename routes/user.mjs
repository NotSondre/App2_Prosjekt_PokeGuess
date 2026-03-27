import express from 'express';
import bcrypt from 'bcrypt';
import { db, initDb } from '../config/database.mjs';
const router = express.Router();
const SALT_ROUNDS = 12; 

initDb(); 

// --- 1. PROFIL & INFORMASJON ---
router.get('/profile', async (req, res, next) => {
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
        next(err);
    }
});

// --- 2. POENGSUM-HÅNDTERING (SCORE) ---
router.post('/score', async (req, res, next) => {
    const { username, score } = req.body;
    if (!username || score === undefined || score <= 0) return res.json({ message: "Ugyldig score." });

    try {
        await db.query('INSERT INTO scores (username, score) VALUES ($1, $2)', [username.trim(), score]);
        res.json({ success: true, message: "Score lagret!" });
    } catch (err) {
        next(err);
    }
});

router.delete('/score/:id', async (req, res, next) => {
    const { id } = req.params;
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: "Brukernavn mangler" });

    try {
        const result = await db.deleteScoreById(id, username);
        if (result.rowCount === 0) return res.status(404).json({ error: "Ingen score slettet" });
        res.json({ message: "Slettet" });
    } catch (err) {
        next(err);
    }
});

// --- 3. AUTENTISERING (LOGIN) ---
router.post('/login', async (req, res, next) => {
    const { username, password } = req.body;
    try {
        const user = await db.getUserByUsername(username);
        if (!user) return res.status(401).json({ error: "Feil bruker/passord" });

        const match = await bcrypt.compare(password.trim(), user.password);
        if (!match) return res.status(401).json({ error: "Feil bruker/passord" });

        res.json({ message: "OK", user: { name: user.username } });
    } catch (err) {
        next(err);
    }
});

// --- 4. BRUKERADMINISTRASJON (OPPDATERINGER) ---
router.post('/update-username', async (req, res, next) => {
    const { oldName, newName } = req.body;
    if (!oldName || !newName) return res.status(400).json({ error: "Mangler data" });

    try {
        await db.query('UPDATE users SET username = $1 WHERE username = $2', [newName.trim(), oldName.trim()]);
        await db.query('UPDATE scores SET username = $1 WHERE username = $2', [newName.trim(), oldName.trim()]);
        res.json({ message: "Brukernavn oppdatert" });
    } catch (err) {
        next(err);
    }
});

router.post('/update-pic', async (req, res, next) => {
    const { username, imageUrl } = req.body;
    if (!username || !imageUrl) return res.status(400).json({ error: "Mangler data" });

    try {
        await db.query('UPDATE users SET profile_pic = $1 WHERE username = $2', [imageUrl, username.trim()]);
        res.json({ message: "Bilde oppdatert" });
    } catch (err) {
        next(err);
    }
});

router.post('/update-password', async (req, res, next) => {
    const { username, oldPassword, newPassword } = req.body;
    if (!username || !oldPassword || !newPassword) return res.status(400).json({ error: "Mangler data" });

    try {
        const user = await db.getUserByUsername(username);
        if (!user) return res.status(404).json({ error: "Bruker ikke funnet" });

        const match = await bcrypt.compare(oldPassword.trim(), user.password);
        if (!match) return res.status(401).json({ error: "Feil gammelt passord" });

        const hashed = await bcrypt.hash(newPassword.trim(), SALT_ROUNDS);
        await db.query('UPDATE users SET password = $1 WHERE username = $2', [hashed, username.trim()]);
        res.json({ message: "Passord oppdatert" });
    } catch (err) {
        next(err);
    }
});

// --- 5. KONTOSLETTING ---
router.delete('/delete', async (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Mangler data" });

    try {
        const user = await db.getUserByUsername(username);
        if (!user) return res.status(404).json({ error: "Bruker ikke funnet" });

        const match = await bcrypt.compare(password.trim(), user.password);
        if (!match) return res.status(401).json({ error: "Feil passord" });

        await db.query('DELETE FROM scores WHERE username = $1', [username.trim()]);
        await db.query('DELETE FROM users WHERE username = $1', [username.trim()]);
        res.json({ message: "Konto slettet" });
    } catch (err) {
        next(err);
    }
});

export default router;