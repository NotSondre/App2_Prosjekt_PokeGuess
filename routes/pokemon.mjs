import express from 'express';
const router = express.Router();

// Enkel lagring av nåværende svar (for enkelthets skyld i dette eksempelet) [cite: 2026-01-19]
let currentAnswer = ""; 

router.get('/pokemon', async (req, res) => {
    try {
        const randomId = Math.floor(Math.random() * 151) + 1; // De originale 151 [cite: 2026-03-09]
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
        const data = await response.json();
        
        currentAnswer = data.name; 
        res.json({ imageUrl: data.sprites.other['official-artwork'].front_default });
    } catch (err) {
        res.status(500).json({ error: "Kunne ikke hente Pokémon" });
    }
});

router.post('/guess', (req, res) => {
    const { guess } = req.body;
    if (!guess) return res.status(400).json({ error: "Mangler gjetting" });

    if (guess.toLowerCase().trim() === currentAnswer.toLowerCase()) {
        res.json({ success: true, message: `Riktig! Det er ${currentAnswer.toUpperCase()}!` });
    } else {
        res.json({ success: false, message: "Feil Pokémon, prøv igjen!" });
    }
});

export default router;