const router = require("express").Router();
const PaymentOutController = require("./paymentOut.controller");
const authMiddleware = require("../../middlewares/auth.middleware");


router
    .route("/add")
    .post(authMiddleware, PaymentOutController.add);

router
    .route("/get")
    .post(authMiddleware, PaymentOutController.get);

router
    .route("/delete")
    .delete(authMiddleware, PaymentOutController.remove);

router
    .route("/filter")
    .post(authMiddleware, PaymentOutController.filter);

router
    .route("/month-wise")
    .post(authMiddleware, PaymentOutController.getMonthWisePaymentOut);

router
    .route("/get-payment-no")
    .post(authMiddleware, PaymentOutController.getPaymentNo);

router
    .route("/get-cashout")
    .post(authMiddleware, PaymentOutController.getCashOut);


module.exports = router;