const router = require("express").Router();
const PaymentInController = require("./paymentIn.controller");
const authMiddleware = require("../../middlewares/auth.middleware")



router
    .route("/add")
    .post(authMiddleware, PaymentInController.add);

router
    .route("/get")
    .post(authMiddleware, PaymentInController.get);

router
    .route("/delete")
    .delete(authMiddleware, PaymentInController.remove);

router
    .route("/filter")
    .post(authMiddleware, PaymentInController.filter);

router
    .route("/month-wise")
    .post(authMiddleware, PaymentInController.getMonthWisePaymentIn);

router
    .route("/get-payment-no")
    .post(authMiddleware, PaymentInController.getPaymentNo);

router
    .route("/get-cashin")
    .post(authMiddleware, PaymentInController.getCashIn);


module.exports = router;