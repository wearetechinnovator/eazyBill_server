const mongoose = require("mongoose");

const partySchema = new mongoose.Schema({
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
  name: String,
  partyCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PartyCategory",
    defult: null
  },
  type: String,
  contactNumber: String,
  email: String,
  country: String,
  state: String,
  postalCode: String,
  billingAddress: String,
  pan: String,
  gst: String,
  billingCountry: String,
  billingState: String,
  shippingAddress: String,
  shippingCountry: String,
  shippingState: String,
  openingBalance: {
    type: String,
    default: 0
  },
  openingBalanceType:{
    type: String,
    enum: ["collect", "pay"],
  },
  creditLimit: {
    type: String,
    default: 0
  },
  creditPeriod: {
    type: String,
    default: 0
  },
  dob: {
    type: Date,
  },
  details: String,
  isDel: {
    type: Boolean,
    default: false
  },
  isTrash:{
    type: Boolean,
    default: false
  }

}, { timestamps: true });


const partyModel = new mongoose.model("party", partySchema);
module.exports = partyModel;
