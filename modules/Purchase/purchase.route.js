const router = require("express").Router();
const PurchaseController = require("./purchase.controller");
const authMiddleware = require("../../middlewares/auth.middleware");


router
    .route("/add")
    .post(authMiddleware, PurchaseController.add);

router
    .route("/get")
    .post(authMiddleware, PurchaseController.get);

router
    .route("/delete")
    .delete(authMiddleware, PurchaseController.remove);

router
    .route("/filter")
    .post(authMiddleware, PurchaseController.filter);

router
    .route("/get-total-pay")
    .post(authMiddleware, PurchaseController.getTotalPay);

router
    .route("/get-total-purchase-amount")
    .post(authMiddleware, PurchaseController.getTotalPurchaseAmount);


    
module.exports = router;