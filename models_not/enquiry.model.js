const mongoose = require("mongoose");

const enquirySchema = mongoose.Schema({
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
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'party',
    required: true,
  },
  contactPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'party_contact',
    required: true,
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'item',
    required: true,
  },
  qty: Number,
  deliveryDate: Date,
  enqNo: String,
  message: String,
  isDel: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model("enquiry", enquirySchema);