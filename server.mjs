import express from "express";
import PokemonRouter from "./routes/pokemon.mjs";
import UserRouter from "./routes/user.mjs";

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json()); 
app.use(express.static('public'));

app.use("/user", UserRouter);
app.use("/content", PokemonRouter);

app.get('/status', (req, res) => {
    res.json({ message: "Systemer er operative" });
});

app.listen(port, () => {
    console.log(`Server kjører på port ${port}`);
});