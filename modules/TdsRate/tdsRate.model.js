const mongoose = require("mongoose");

const tdsRateSchema = new mongoose.Schema({
    title: String,
    rate: Number,
}, { timestamps: true });

module.exports = new mongoose.model("tds_rate", tdsRateSchema);