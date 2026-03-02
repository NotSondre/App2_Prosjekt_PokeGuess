import express from "express";
import ContentRouter from "./routes/pokemon.mjs";
import UserRouter from "./routes/user.mjs";

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json()); 
app.use(express.static('public'));

app.use("/user", UserRouter);
app.use("/content", ContentRouter);

app.listen(port, () => {
    console.log(`Server kjører på port ${port}`);
});