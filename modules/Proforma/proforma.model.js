const mongoose = require("mongoose");


const itemSchema = new mongoose.Schema({
  itemId: String,
  itemName: {
    type: String
  },
  description: {
    type: String,
  },
  hsn: {
    type: String,
  },
  qun: {
    type: String
  },
  selectedUnit: {
    type: String
  },
  unit: {
    type: Array
  },
  price: Number,
  discountPerAmount: Number,
  discountPerPercentage: {
    type: String,
  },
  tax: {
    type: String,
  },
  taxAmount: Number,
  amount: Number,
}, { _id: false });

const additionalChargeSchema = new mongoose.Schema({
  particular: {
    type: String,
  },
  amount:Number
}, { _id: false });

const proformaSchema = new mongoose.Schema({
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
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'party',
    required: true
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'account',
  },
  proformaNumber: String,
  estimateDate: Date,
  validDate: Date,
  poDate:{
    type: Date,
    default: null
  },
  poNumber: String,
  items: [itemSchema],
  discountType: String,
  discountAmount: Number,
  discountPercentage: String,
  additionalCharge: [additionalChargeSchema],
  note: String,
  terms: String,
  isDel: {
    type: Boolean,
    default: false
  },
  isTrash: {
    type: Boolean,
    default: false
  },
  autoRoundOff: {
    type: Boolean,
    default: false
  },
  roundOffAmount: Number,
  roundOffType: {
    type: String,
    enum: ['0', '1'] // 1 =`add` | 0 =`reduce`
  }
}, { timestamps: true });

module.exports = mongoose.model("proforma", proformaSchema);
