import express from 'express';
import pokemonRouter from './routes/pokemon.mjs';
import userRouter from './routes/user.mjs'; 

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(express.static('public'));

app.use('/api', pokemonRouter);

app.use('/api/users', userRouter);

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});