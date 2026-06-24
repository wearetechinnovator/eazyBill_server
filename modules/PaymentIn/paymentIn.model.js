const mongoose = require('mongoose');

const PaymentInSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'party',
    required: true
  },
  paymentInNumber: String,
  paymentInDate: Date,
  paymentMode: String,
  account: String,
  amount: Number,
  invoiceId: String,
  sattleInvoice: [Object],
  tdsRate: Number,
  isDel: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.models.paymentin || mongoose.model('paymentin', PaymentInSchema);
