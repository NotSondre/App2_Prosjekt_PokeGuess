import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pokemonRouter from './routes/pokemon.mjs';

const app = express();
const port = 3000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(express.static('public'));

app.use('/api', pokemonRouter);

app.listen(port, () => {
    console.log(`Server kjører på http://localhost:${port}`);
});
