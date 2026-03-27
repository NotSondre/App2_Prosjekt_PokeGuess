// --- 1. IMPORTERING OG OPPSETT ---
import 'dotenv/config';
import express from "express";
import cors from "cors";
import PokemonRouter from "./routes/pokemon.mjs";
import UserRouter from "./routes/user.mjs";
import { errorHandler } from './middleware/errorHandler.mjs';

const app = express();
const port = process.env.PORT || 8080;

// --- 2. MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// --- 3. RUTER (ENDPOINTS) ---
app.use("/user", UserRouter);
app.use("/content", PokemonRouter);

// --- 4. SYSTEMOVERVÅKNING ---
app.get('/status', (req, res) => {
    res.json({ message: "Systemer er operative" });
});

// --- 5. SERVERSTART & FEILHÅNDTERING ---
app.listen(port, () => {
    console.log(`Server kjorer pa port ${port}`);
});

app.use(errorHandler);