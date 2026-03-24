import express from 'express';
import { cleanGuess } from '../middleware/CleanGuess.mjs'; 

const router = express.Router();

let currentAnswer = ""; 

router.get('/pokemon', async (req, res) => {
    try {
        const randomId = Math.floor(Math.random() * 1025) + 1;
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        const data = await response.json();
        
        currentAnswer = data.name.split('-')[0].toLowerCase(); 
        
        res.json({ 
            imageUrl: data.sprites.other['official-artwork'].front_default,
            id: randomId // Nyttig for debugging
        });
    } catch (err) {
        res.status(500).json({ error: "Kunne ikke hente Pokémon" });
    }
});

router.post('/guess', cleanGuess, (req, res) => {
    const { guess } = req.body;

    if (!guess) return res.status(400).json({ error: "Mangler gjetting" });

    if (guess === currentAnswer) {
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