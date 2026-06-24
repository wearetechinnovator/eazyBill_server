const mongoose = require("mongoose");


const itemSchema = new mongoose.Schema({
  itemId: String,
  itemName: String,
  description: String,
  hsn: String,
  qun: String,
  selectedUnit: String,
  unit: Array,
  price: Number,
  discountPerAmount: Number,
  discountPerPercentage: String,
  tax: String,
  taxAmount: Number,
  amount: Number,
  expireDate: Date
}, { _id: false });

const additionalChargeSchema = new mongoose.Schema({
  particular: String,
  amount: Number
}, { _id: false });

const purchaseInvoiceSchema = new mongoose.Schema({
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
  purchaseInvoiceNumber: String,
  originalInvoiceNumber: String,
  invoiceDate: Date,
  validDate: Date,
  items: [itemSchema],
  discountType: String,
  discountAmount: Number,
  discountPercentage: String,
  additionalCharge: [additionalChargeSchema],
  paymentStatus: Boolean,
  paymentType: String,
  paymentAccount: String,
  paymentAmount: Number,
  finalAmount: Number,
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


module.exports = mongoose.model("purchaseinvoice", purchaseInvoiceSchema);
