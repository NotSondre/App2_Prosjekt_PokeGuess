import express from 'express';
import { cleanGuess } from '../middleware/CleanGuess.mjs'; 

const router = express.Router();

let currentAnswer = ""; 
let usedIds = []; 
const MAX_HISTORY = 20; 

router.get('/pokemon', async (req, res) => {
    try {
        const region = req.query.region;
        
        let min = 1;
        let max = 1025;

        // Oppdatert for å matche data-region fra index.html
        if (region === 'kanto') { min = 1; max = 151; }
        else if (region === 'johto') { min = 152; max = 251; }
        else if (region === 'hoenn') { min = 252; max = 386; }
        else if (region === 'sinnoh') { min = 387; max = 493; }
        else if (region === 'unova') { min = 494; max = 649; }
        else if (region === 'kalos') { min = 650; max = 721; }
        else if (region === 'alola') { min = 722; max = 809; }
        else if (region === 'galar') { min = 810; max = 905; }
        else if (region === 'paldea') { min = 906; max = 1025; }

        let randomId;
        let attempts = 0;
        
        do {
            randomId = Math.floor(Math.random() * (max - min + 1)) + min;
            attempts++;
        } while (usedIds.includes(randomId) && attempts < 100);

        usedIds.push(randomId);
        if (usedIds.length > MAX_HISTORY) usedIds.shift();

        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        const data = await response.json();
        
        currentAnswer = data.name.replace(/-/g, ' ').toLowerCase().trim(); 
        
        console.log(`Region valgt: ${region || 'alle'} | Ny Pokémon: ${currentAnswer} (ID: ${randomId})`);

        res.json({ 
            imageUrl: data.sprites.other['official-artwork'].front_default,
            id: randomId,
            name: currentAnswer 
        });
    } catch (err) {
        console.error("Feil ved henting av Pokémon:", err.message);
        res.status(500).json({ error: "Kunne ikke hente Pokémon" });
    }
});

router.post('/guess', cleanGuess, (req, res) => {
    const { guess } = req.body;
    if (!guess) return res.status(400).json({ error: "Mangler gjetting" });

    const shortAnswer = currentAnswer.split(' ')[0];
    const isCorrect = guess === currentAnswer || guess === shortAnswer;

    if (isCorrect) {
        res.json({ 
            success: true, 
            message: `Riktig! Det er ${currentAnswer.toUpperCase()}!` 
        });
    } else {
        res.json({ 
            success: false, 
            message: "Feil Pokémon, prøv igjen!" 
        });
    }
});

export default router;