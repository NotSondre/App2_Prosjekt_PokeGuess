import 'dotenv/config';
import express from "express";
import cors from "cors";
import PokemonRouter from "./routes/pokemon.mjs";
import UserRouter from "./routes/user.mjs";

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json()); 
app.use(express.static('public'));

// Ruter
app.use("/user", UserRouter);
app.use("/content", PokemonRouter);

// Status-sjekk
app.get('/status', (req, res) => {
    res.json({ message: "Systemer er operative" });
});

// Start server
app.listen(port, () => {
    console.log(`Server kjorer pa port ${port}`);
});