const router = require("express").Router();
const AttendanceController = require("./attendance.controller");
const authMiddleware = require("../../middlewares/auth.middleware");



router
    .route("/add")
    .post(authMiddleware, AttendanceController.addAttendance)

router
    .route("/get")
    .post(authMiddleware, AttendanceController.getAttendance)

router
    .route("/get-user-attendance")
    .post(authMiddleware, AttendanceController.getUserAttendance)


module.exports = router;