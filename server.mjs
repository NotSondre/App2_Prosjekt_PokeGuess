import express from "express";
import ContentRouter from "./routes/ContentAPI.mjs";
import UserRouter from "./routes/UserAPI.mjs";

const port = process.env.PORT || 8080;
const app = express();

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/content", ContentRouter);
app.use("/user", UserRouter);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});