const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const port = 3000;

const personenRouter = require("./routes/personen");
const loginRouter = require("./login/loginRoute");

app.use(express.json());

app.use("/person", personenRouter);
app.use("/user", loginRouter);

app.get("/", (req, res) => {
  res.send("API läuft");
});

app.listen(port, () => {
  console.log(`Server läuft unter http://localhost:${port}`);
});
