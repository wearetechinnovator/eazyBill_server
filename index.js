require('dotenv').config();
const app = require("./app");
const mongoose = require("mongoose");
const attendanceReminder = require("./jobs/staffAttendanceReminder");
const staffAttendancePresent = require("./jobs/staffAttandancePresent");
const PORT = process.env.PORT || 8081;



mongoose.connect(process.env.MONGO_URI).then(() => {
	console.log("[*] Database run");

	//attendanceReminder(); //Staff Attendance Reminder Mail;
	//staffAttendancePresent(); // Default Present Attendance;

	app.listen(PORT, () => {
		console.log("[*] Server run", PORT)
	})

}).catch(err => {
	console.error("MongoDB connection error:", err)
});