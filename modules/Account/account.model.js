const mongoose = require("mongoose");

const accountSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  accountName: String,
  accountHolderName: String,
  openingBalance: Number,
  asOfDate: Date,
  isBankDetails: Boolean,
  accountNumber: Number,
  ifscCode: String,
  branchName: String,
  upiId: String,
  isDel: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });


module.exports = mongoose.model("account", accountSchema);