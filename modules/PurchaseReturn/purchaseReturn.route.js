const router = require("express").Router();
const PurchaseReturnController = require("./purchaseReturn.controller");
const authMiddleware = require("../../middlewares/auth.middleware");


router
    .route("/add")
    .post(authMiddleware, PurchaseReturnController.add);

router
    .route("/get")
    .post(authMiddleware, PurchaseReturnController.get);

router
    .route("/delete")
    .delete(authMiddleware, PurchaseReturnController.remove)

router
    .route("/filter")
    .post(authMiddleware, PurchaseReturnController.filter)


module.exports = router;