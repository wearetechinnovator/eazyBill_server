const mongoose = require("mongoose");


const companySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  name: {
    type: String, 
    required: true,
  },
  phone: String,
  email: String,
  gst: String,
  pan: String,
  invoiceLogo: String,
  signature: String,
  address: String,
  country: String,
  state: String,
  city: String,
  pin: String,
  poInitial: String,
  purchaseInvoiceInitial: String,
  purchaseInvoiceNextCount: {
    type: String,
    default: "1"
  },
  invoiceInitial: String,
  proformaInitial: String,
  poNextCount: {
    type: String,
    default: "1"
  },
  invoiceNextCount: {
    type: String,
    default: "1"
  },
  proformaNextCount: {
    type: String,
    default: "1"
  },
  quotationInitial: String,
  creditNoteInitial: String,
  deliverChalanInitial: String,
  salesReturnInitial: String,
  quotationCount: {
    type: String,
    default: "1"
  },
  creditNoteCount: {
    type: String,
    default: "1"
  },
  salesReturnCount: {
    type: String,
    default: "1"
  },
  deliveryChalanCount: {
    type: String,
    default: "1"
  },
  salesReminder: String,
  purchaseReminder: String,
  logoFileName: String,
  signatureFileName: String,

}, {timestamps: true});

module.exports = mongoose.model("Company", companySchema);