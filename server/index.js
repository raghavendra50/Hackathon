const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

dotenv.config({
  path: ".env",
});

const app = express();
app.use([bodyParser.json(), cors()]);

app.get("/", function (req, res) {
  res.send("Backend setup");
});

app.listen(process.env.PORT, () => {
  console.log(`Listening on PORT: ${process.env.PORT}`);
});
