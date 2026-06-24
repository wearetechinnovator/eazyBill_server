const mongoose = require('mongoose');

const ladgerSchema = new mongoose.Schema({
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
  partyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true
  },
  date: Date,
  voucher: {
    type: String,
    enum: ['sales', 'sales_return', 'credit_note',
      'purchase', 'purchase_return', 'debit_note', 'pay_in', 'pay_out',
      'opening_balance'
    ]
  },
  voucherModel: String,
  voucherId: {
   type: mongoose.Schema.Types.ObjectId,
   refPath: 'voucherModel',
   default: null
  },
  credit: {
    type: Number,
    default: 0
  },
  debit: {
    type: Number,
    default: 0
  },
}, { timestamps: true });


const ladgerModel = new mongoose.model("ladger", ladgerSchema);
module.exports = ladgerModel;
