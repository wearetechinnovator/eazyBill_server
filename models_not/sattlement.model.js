const mongoose = require("mongoose");


const sattlementSchema = new mongoose.Schema({
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
    type: {
        type: String,
        enum: ['pay_in', 'pay_out']
    },
    typeId: String, //Paymentin id --or-- Paymentout id;
    amount: Number,
    sattleInvoice: [String],
}, { timestamps: true })


const sattlementModel = new mongoose.model("sattlement", sattlementSchema);
module.exports = sattlementModel;