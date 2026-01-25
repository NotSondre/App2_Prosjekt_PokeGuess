import express from 'express';
import CleanGuess from '../middleware/CleanGuess.mjs';

const router = express.Router();

router.post('/guess', CleanGuess, (req, res) => {
    const sanitizedGuess = req.body.guess;
    
    res.json({
        status: "success",
        message: "Middlewaaren har rengjort gjettet",
        cleanedData: sanitizedGuess
    });
});

export default router;