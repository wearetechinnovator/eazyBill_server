const router = require("express").Router();
const StaffController = require("./staff.controller");
const authMiddleware = require("../../middlewares/auth.middleware");



router
    .route("/add")
    .post(authMiddleware, StaffController.add);

router
    .route('/get')
    .post(authMiddleware, StaffController.get);

router
    .route("/delete")
    .delete(authMiddleware, StaffController.remove);

router
    .route("/attendance-setting/add")
    .post(authMiddleware, StaffController.addAttendanceSetting);

router
    .route("/attendance-setting/get")
    .post(authMiddleware, StaffController.getAttendanceSetting);



module.exports = router;