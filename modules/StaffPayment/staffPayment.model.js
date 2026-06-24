const mongoose = require("mongoose");

const staffPaymentSchema = new mongoose.Schema({
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
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "staff",
        required: true
    },
    paymentType: {
        type: String,
        index: true
    },
    paymentDate: {
        type: Date,
        index: true
    },
    transactionId: String,
    paymentAmount: Number,
    paymentMode: String,
    paymentAccount: String,
    paymentRemark: String,
    isDel: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true })

const staffPaymentModel = new mongoose.model("staff_payment", staffPaymentSchema);
module.exports = staffPaymentModel;