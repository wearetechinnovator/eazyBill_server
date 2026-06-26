const mongoose = require("mongoose");

const itemSettlementSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'item'
    },
    settlement: [],
    salesBillId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'salesinvoice'
    },
    returnBillId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "salesreturn",
        default: null
    },
}, { timestamps: true });

module.exports = new mongoose.model("item_settlement", itemSettlementSchema);
