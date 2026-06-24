const mongoose = require("mongoose");

const transactionCategorySchema = new mongoose.Schema({
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
  categoryName:String,
  isDel:{
    type:Boolean,
    default: false
  }
}, { timestamps: true })


module.exports = new mongoose.model("transaction_category", transactionCategorySchema);