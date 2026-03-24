import express from 'express';
import { cleanGuess } from '../middleware/CleanGuess.mjs'; 

const router = express.Router();

let currentAnswer = ""; 

router.get('/pokemon', async (req, res) => {
    try {
        // Hent region fra URL-en (f.eks. /content/pokemon?region=hoenn)
        const region = req.query.region;
        
        let min = 1;
        let max = 1025;

        // Logikk for å sette grensene basert på valgt region
        if (region === 'kanto') { max = 151; }
        else if (region === 'johto') { min = 152; max = 251; }
        else if (region === 'hoenn') { min = 252; max = 386; }
        else if (region === 'sinnoh') { min = 387; max = 493; }
        else if (region === 'unova') { min = 494; max = 649; }
        else if (region === 'kalos') { min = 650; max = 721; }
        else if (region === 'alola') { min = 722; max = 809; }
        else if (region === 'galar') { min = 810; max = 898; }
        else if (region === 'hisui') { min = 899; max = 905; }
        else if (region === 'paldea') { min = 906; max = 1025; }
        const randomId = Math.floor(Math.random() * (max - min + 1)) + min;
        
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        const data = await response.json();
        
        currentAnswer = data.name.split('-')[0].toLowerCase(); 
        
        res.json({ 
            imageUrl: data.sprites.other['official-artwork'].front_default,
            id: randomId 
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