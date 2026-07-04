const attendanceModel = require("./attendance.model");
const { getId } = require('../../helper/getIdFromToken');
const userModel = require("../User/user.model");
const { default: mongoose } = require("mongoose");


class AttendanceController {
    static async addAttendance(req, res) {
        const { attendanceData, token } = req.body;

        if ([attendanceData, token].some((field) => !field || field === "") || attendanceData.length === 0) {
            return res.status(500).json({ err: "require fields are empty" });
        }

        for (let attData of attendanceData) {
            if (!attData.date || !attData.attendance || !attData.staffId) {
                return res.status(500).json({ err: "require fields are empty" });
            }

            if (attData.attendanceType === "over-time") {
                if (attData.overTimeType === "amount" && !attData.fixedOverTimeAmount) {
                    return res.status(500).json({ err: "Please enter fixed over time amount" })
                }

                else if (attData.overTimeType === "hourly") {
                    if (!attData.overTimeHour || !attData.overTimeMinute || !attData.overTimeRate) {
                        return res.status(500).json({ err: "Please enter over time hour minute and rate" })
                    }
                    else if (attData.overTimeRate === "custom" && !attData.customeOverTimeRate) {
                        return res.status(500).json({ err: "Please enter custom over time rate" })
                    }
                }
            }
        }

        try {
            const getInfo = await getId(token);
            const getUserData = await userModel.findOne({ _id: getInfo._id });

            const bulkOps = attendanceData.map(a => ({
                updateOne: {
                    filter: {
                        userId: getUserData._id,
                        companyId: getUserData.activeCompany,
                        date: a.date,
                        staffId: a.staffId
                    },
                    update: {
                        $set: {
                            ...a,
                            userId: getUserData._id,
                            companyId: getUserData.activeCompany,
                        },
                    },
                    upsert: true,
                }
            }));

            const result = await attendanceModel.bulkWrite(bulkOps);

            if (result.matchedCount === 0 && result.upsertedCount === 0 && result.modifiedCount === 0) {
                return res.status(500).json({ err: "Attendance not saved" });
            }

            return res.status(200).json({ msg: "Attendance saved successfully" });

        } catch (error) {
            console.log(error);
            return res.status(500).json({ err: "Something went wrong" });
        }

    }

    static async getAttendance(req, res) {
        const { token, date } = req.body;

        if ([token, date].some((field) => !field || field === "")) {
            return res.status(500).json({ err: "require fields are empty" });
        }

        try {
            const getInfo = await getId(token);
            const getUserData = await userModel.findOne({ _id: getInfo._id });

            const attendanceData = await attendanceModel.find({
                userId: getUserData._id,
                companyId: getUserData.activeCompany,
                date: new Date(date)
            })

            return res.status(200).json({ data: attendanceData })

        } catch (error) {
            return res.status(500).json({ err: "Something went wrong" });
        }
    }

    static async getUserAttendance(req, res) {
        const { staffId, token, month, year } = req.body;

        if ([staffId, token, month, year].some((field) => !field || field === "")) {
            return res.status(400).json({ err: "required field are empty" })
        }

        try {
            const getInfo = await getId(token);
            const getUserData = await userModel.findOne({ _id: getInfo._id });

            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 1);

            const staffAttendanceList = await attendanceModel.aggregate([
                {
                    $match: {
                        userId: getUserData._id,
                        companyId: getUserData.activeCompany,
                        staffId: new mongoose.Types.ObjectId(String(staffId)),
                        date: { $gte: startDate, $lt: endDate }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        date: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$date",
                                timezone: "Asia/Kolkata"
                            }
                        },
                        userId: 1,
                        companyId: 1,
                        staffId: 1,
                        attendance: 1,
                        attendanceType: 1,
                        overTimeType: 1,
                        overTimeHour: 1,
                        overTimeMinute: 1,
                        overTimeRate: 1,
                        customeOverTimeRate: 1,
                        fixedOverTimeAmount: 1,
                        overTimeHourlyAmount: 1,
                    }
                }
            ])

            if (!staffAttendanceList || staffAttendanceList.length === 0) {
                return res.status(400).json({ err: "Attendance not found" });
            }

            return res.status(200).json({ data: staffAttendanceList })

        } catch (error) {
            return res.status(500).json({ err: "Something went wrong" });
        }
    }

}

module.exports = AttendanceController;
