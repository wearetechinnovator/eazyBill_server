const {
    add, get, remove,
    getTotalLoan,
    getTotalDues,
    getLastMonthPayment,
} = require("../controllers/staffPayment.controller");
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
    .route("/get-total-loan")
    .post(getTotalLoan);

router
    .route("/get-total-due")
    .post(getTotalDues);

router
    .route("/get-last-month-due")
    .post(getLastMonthPayment);

module.exports = router;