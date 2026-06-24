const path = require('path');
const cors = require("cors");
const express = require("express");
const router = require("./routes/main.route");
const app = express();


app.use(cors());
app.use(express.json({ limit: '300mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'barcodes')));
app.use("/api/v1", router);


app.get("/ping", (req, res) => res.send({ msg: "PONG" }));



module.exports = app