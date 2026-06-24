const { addAttendance, getAttendance, getUserAttendance } = require("../controllers/attendance.controller");
const router = require("express").Router();




router
    .route("/add")
    .post(addAttendance)

router
    .route("/get")
    .post(getAttendance)

router
    .route("/get-user-attendance")
    .post(getUserAttendance)


module.exports = router;