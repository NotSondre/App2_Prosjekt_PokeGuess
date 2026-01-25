export const cleanGuess = (req, res, next) => {
  
    if (req.body && req.body.guess) {
    
        req.body.guess = req.body.guess.trim().toLowerCase();
    }
    next();
};