function CleanGuess(req, res, next) {
    if (req.body && req.body.guess) {
        let original = req.body.guess;

        let cleaned = original.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

        req.body.guess = cleaned;
        
        console.log(`Middleware vasket: "${original}" -> "${cleaned}"`);
    }

    next();
}

export default CleanGuess;