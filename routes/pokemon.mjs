import express from 'express';
import { cleanGuess } from '../middleware/CleanGuess.mjs'; 

const router = express.Router();

router.post('/guess', cleanGuess, (req, res) => {
    res.json({ 
        message: "Gjetting mottatt!", 
        cleanedData: req.body.guess 
    });
});

router.get('/status', (req, res) => {
    res.json({ message: "Serveren er online!" });
});

//-----------------------------------------------
router.post('/start', (req, res) => {
    res.json({ message: "Spillet har startet! En hemmelig Pokémon er valgt." });
});

router.get('/status', (req, res) => {
    res.json({ score: 0, attemptsLeft: 3, round: 1 });
});


router.get('/hint', (req, res) => {
    res.json({ hint: "Denne Pokémonen er av typen: Electric" });
});

//-----------------------------------------------
export default router;