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

        if (region === 'gen1') { min = 1; max = 151; }
        else if (region === 'gen2') { min = 152; max = 251; }
        else if (region === 'gen3') { min = 252; max = 386; }
        else if (region === 'gen4') { min = 387; max = 493; }
        else if (region === 'gen5') { min = 494; max = 649; }
        else if (region === 'gen6') { min = 650; max = 721; }
        else if (region === 'gen7') { min = 722; max = 809; }
        else if (region === 'gen8') { min = 810; max = 905; }
        else if (region === 'gen9') { min = 906; max = 1025; }

        // --- NY LOGIKK FOR Å UNNGÅ REPETISJON ---
        let randomId;
        let attempts = 0;

        do {
            randomId = Math.floor(Math.random() * (max - min + 1)) + min;
            attempts++;
        } while (usedIds.includes(randomId) && attempts < 100);

        usedIds.push(randomId);
        
        if (usedIds.length > MAX_HISTORY) {
            usedIds.shift();
        }

        console.log(`Region: ${region || 'all'}. ID: ${randomId}. Historikk: ${usedIds}`);

        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        const data = await response.json();
        
        currentAnswer = data.name.replace(/-/g, ' ').toLowerCase().trim(); 
        
        res.json({ 
            imageUrl: data.sprites.other['official-artwork'].front_default,
            id: randomId,
            name: currentAnswer 
        });
    } catch (err) {
        res.status(500).json({ error: "Kunne ikke hente Pokémon" });
    }
});


export default router;