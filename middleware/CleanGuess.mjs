import express from 'express';
const router = express.Router();

router.post('/guess', (req, res) => {
    const cleanedGuess = req.body.guess;
    
    res.json({ 
        message: "Gjetting mottatt!", 
        cleanedData: cleanedGuess 
    });
});

router.get('/status', (req, res) => {
    res.json({ message: "Serveren er online og snakker med frontend!" });
});

export default router;