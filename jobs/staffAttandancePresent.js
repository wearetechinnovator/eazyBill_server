const cron = require('node-cron');
const attendanceSettingModel = require('../modules/Attendance/attendanceSetting.model');
const staffModel = require('../modules/Staff/staff.model');
const attendanceModel = require('../modules/Attendance/attendance.model');



module.exports = async function staffAttendancePresent() {
    cron.schedule(`0 10 * * *`, async () => {
        try {
            // Today Date
            const today = new Date().toLocaleDateString("en-CA");
            // Today Day like: Sun, Sat, Mon
            const currentDay = new Date().toLocaleDateString("en-US", { weekday: "short" });

            const settings = await attendanceSettingModel
                .find({ defaultPresent: true })
                .populate("companyId")
                .lean();

            let attendanceDocs = [];

            for (let setting of settings) {
                const companyId = setting.companyId._id;
                const userId = setting.companyId.userId;
                const offDays = setting.weeklyOffDays || [];

                if (offDays.includes(currentDay)) continue;

                const staffs = await staffModel.find({
                    companyId,
                    userId,
                    isDel: false
                }, { _id: 1 }).lean();

                const staffIds = staffs.map(s => s._id);

                // find already marked attendance
                const existing = await attendanceModel.find({
                    companyId,
                    date: today,
                    staffId: { $in: staffIds }
                }, { staffId: 1 }).lean();

                const existingIds = new Set(existing.map(a => a.staffId.toString()));

                for (let staff of staffs) {
                    if (!existingIds.has(staff._id.toString())) {
                        attendanceDocs.push({
                            userId,
                            companyId,
                            staffId: staff._id,
                            attendance: '1',
                            date: today
                        });
                    }
                }
            }

            if (attendanceDocs.length) {
                await attendanceModel.insertMany(attendanceDocs, { ordered: false });
            }

        } catch (err) {
            console.log("Default Attendance Cron Error:", err);
        }

    }, { timezone: "Asia/Kolkata" });
}