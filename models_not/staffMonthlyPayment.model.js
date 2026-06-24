const mongoose = require("mongoose");


const staffMonthlyPaymentSchema = new mongoose.Schema({
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
        ref: 'staff'
    },
    month: Number, //Store as Index 0-11
    year: Number,
    amount: Number,
    payAmount: Number,
    paymentStatus: {
        type: String,
        enum: [ '1', '2'], // 1=`Full paid` | 2=`Partial paid`
        index: true
    },
}, { timestamps: true })

const staffMonthlyPaymentModel = new mongoose.model("staff_monthly_payment", staffMonthlyPaymentSchema);
module.exports = staffMonthlyPaymentModel;
