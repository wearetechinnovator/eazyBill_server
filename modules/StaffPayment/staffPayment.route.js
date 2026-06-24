const router = require("express").Router();
const StaffPaymentController = require("./staffPayment.controller");
const authMiddleware = require("../../middlewares/auth.middleware");



router
    .route("/add")
    .post(authMiddleware, StaffPaymentController.add);

router
    .route('/get')
    .post(authMiddleware, StaffPaymentController.get);

router
    .route("/delete")
    .delete(authMiddleware, StaffPaymentController.remove);

router
    .route("/get-total-loan")
    .post(authMiddleware, StaffPaymentController.getTotalLoan);

router
    .route("/get-total-due")
    .post(authMiddleware, StaffPaymentController.getTotalDues);

router
    .route("/get-last-month-due")
    .post(authMiddleware, StaffPaymentController.getLastMonthPayment);



module.exports = router;