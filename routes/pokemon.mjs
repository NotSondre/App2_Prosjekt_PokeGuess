// --- 1. KONFIGURASJON & OPPSOPP ---
import express from 'express';
import { cleanGuess } from '../middleware/CleanGuess.mjs'; 

const router = express.Router();

let usedIds = []; 
const MAX_HISTORY = 20; 

// --- 2. RUTE: HENT POKÉMON ---
router.get('/pokemon', async (req, res, next) => {
    try {
        const region = req.query.region || 'all';
        
        const ranges = {
            kanto: [1, 151], johto: [152, 251], hoenn: [252, 386],
            sinnoh: [387, 493], unova: [494, 649], kalos: [650, 721],
            alola: [722, 809], galar: [810, 905], paldea: [906, 1025]
        };

        const [min, max] = ranges[region] || [1, 1025];
        
        let randomId;
        let attempts = 0;
        do {
            randomId = Math.floor(Math.random() * (max - min + 1)) + min;
            attempts++;
        } while (usedIds.includes(randomId) && attempts < 50);

        usedIds.push(randomId);
        if (usedIds.length > MAX_HISTORY) usedIds.shift();

        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        if (!response.ok) throw new Error("Kunne ikke hente data fra PokéAPI");

        const data = await response.json();
        const pokemonName = data.name.replace(/-/g, ' ').toLowerCase().trim(); 
        
        res.json({ 
            imageUrl: data.sprites.other['official-artwork'].front_default,
            id: randomId,
            name: pokemonName 
        });
    } catch (err) {
        next(err); 
    }
});

// --- 3. RUTE: SJEKK GJETING ---
router.post('/guess', cleanGuess, (req, res, next) => {
    try {
        const { guess, correctAnswer } = req.body; 
        
        if (!guess || !correctAnswer) return res.status(400).json({ error: "Mangler data" });

        const shortAnswer = correctAnswer.split(' ')[0];
        const isCorrect = guess === correctAnswer || guess === shortAnswer;

        res.json({ 
            success: isCorrect, 
            message: isCorrect ? `Riktig! Det er ${correctAnswer.toUpperCase()}!` : "Feil Pokémon, prøv igjen!" 
        });
    } catch (err) {
        next(err);
    }
});

export default router;