const mongoose = require('mongoose');

const PaymentOutSchema = mongoose.Schema({
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
  paymentOutNumber: String,
  paymentOutDate: Date,
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

module.exports = mongoose.models.paymentout || mongoose.model('paymentout', PaymentOutSchema);
