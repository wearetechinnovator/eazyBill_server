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
    purchaseBillId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'purchaseinvoice'
    },
    salesBillId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'salesinvoice'
    },
    settleQun: Number,
    settleUnit: String
}, { timestamps: true });

module.exports = new mongoose.model("item_settlement", itemSettlementSchema);