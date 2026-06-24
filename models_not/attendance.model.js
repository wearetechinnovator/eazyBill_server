const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
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
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "staff",
        required: true,
        index: true
    },
    attendance: {
        type: String,
        enum: ['0', '1'], // 0=`Absent` | 1=`Present`
        default: '0'
    },
    date: Date,
    attendanceType: {
        type: String,
        enum: ['half-day', 'over-time', 'paid-leave', 'week-off', 'none'],
        default: 'none'
    },
    overTimeType: String,
    overTimeHour: Number,
    overTimeMinute: Number,
    overTimeRate: String,
    overTimeHourlyAmount: String,
    customeOverTimeRate: String,
    fixedOverTimeAmount: Number,
}, { timestamps: true });


const attendanceModel = new mongoose.model("staff_attendance", attendanceSchema);
module.exports = attendanceModel;