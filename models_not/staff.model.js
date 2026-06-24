const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
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
    staffName: String,
    mobileNumber: String,
    email: String,
    dob: Date,
    joiningDate: String,
    salaryPayOutType: String,
    salary: String,
    salaryCycle: String,
    openingBalance: String,
    openingBalanceType: String,
    isDel: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });


const staffModel = mongoose.models.staff || new mongoose.model("staff", staffSchema);
module.exports = staffModel;