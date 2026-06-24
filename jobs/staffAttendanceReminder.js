const cron = require('node-cron');
const attendanceSettingModel = require('../modules/Attendance/attendanceSetting.model');
const sendEmail = require("../helper/sendEmail");


const mailHTMLBody = `
<html>
    <body>
    <div style="font-family:Arial;padding:20px;background:#f4f4f4">
        <div style="max-width:600px;margin:auto;background:white;padding:20px;border-radius:8px">
            
            <h2 style="color:#333">Attendance Reminder</h2>
            
            <p>Hello Admin,</p>
            
            <p>
                This is a reminder to mark today's attendance for your employees.
                Please update the attendance records in the CRM system.
            </p>

            <div style="margin-top:20px">
                <a href="http://localhost:3000/admin/staff-attendance" 
                    style="background:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px">
                    Open CRM
                </a>
            </div>

            <hr style="margin-top:30px">

            <p style="font-size:12px;color:gray">
                This is an automated message from the CRM system.
            </p>

        </div>
    </div>
    </body>
</html>
`;

module.exports = async function remainder() {
    cron.schedule(`* * * * *`, async () => {
        const hour = String(new Date().getHours()).padStart(2, "0");
        const minute = String(new Date().getMinutes()).padStart(2, "0");
        let msgBody;

        const settings = await attendanceSettingModel.find({
            attendanceReminder: true,
            reminderTime: `${hour}:${minute}`
        }).populate('companyId');
        if (settings.length < 1) return;


        for (let setting of settings) {
            if (setting.defaultPresent === true)
                msgBody = "<p>As per default system setting today's attendance is updated as 'Present' for all active employees.</p>";
            else
                msgBody = mailHTMLBody;

            await sendEmail({
                to: setting?.companyId?.email,
                subject: "Attendance Reminder!",
                body: msgBody
            })
        }
    }, { timezone: "Asia/Kolkata" });
}
