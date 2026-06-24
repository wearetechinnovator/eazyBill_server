const {
    add, get, remove,
    addAttendanceSetting,
    getAttendanceSetting
} = require("../controllers/staff.controller");
const router = require("express").Router();


router
    .route("/add")
    .post(add);

router
    .route('/get')
    .post(get);

router
    .route("/delete")
    .delete(remove);

router
    .route("/attendance-setting/add")
    .post(addAttendanceSetting);

router
    .route("/attendance-setting/get")
    .post(getAttendanceSetting);


module.exports = router;