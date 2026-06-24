const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
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
  transactionType: {
    type: String,
    enum: ['income', 'expense']
  },
  transactionNumber: Number,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'transaction_category',
  },
  transactionDate: Date,
  paymentMode: String,
  account: String,
  amount: Number,
  note: String,
  isDel: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })


module.exports = new mongoose.model("transaction", transactionSchema);
