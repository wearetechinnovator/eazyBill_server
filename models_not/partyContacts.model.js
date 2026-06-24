const mongoose = require('mongoose');

const partyContactSchema = new mongoose.Schema({
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
        ref: 'party',
        required: true,
        index: true
    },
    name: String,
    phone: Number,
    email: String,
    designation: String,
    isDel: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('party_contact', partyContactSchema);