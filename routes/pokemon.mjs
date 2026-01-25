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

export default router;