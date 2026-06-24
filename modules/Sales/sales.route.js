const router = require("express").Router();
const SalesController = require("./sales.controller");
const authMiddleware = require("../../middlewares/auth.middleware");




router
    .route("/add")
    .post(authMiddleware, SalesController.add);

router
    .route("/get")
    .post(authMiddleware, SalesController.get);

router
    .route("/delete")
    .delete(authMiddleware, SalesController.remove)

router
    .route("/filter")
    .post(authMiddleware, SalesController.filter);

router
    .route("/get-total-collect")
    .post(SalesController.getTotalCollect);

router
    .route("/get-total-sale-amount")
    .post(authMiddleware, SalesController.getTotalSaleAmount);

router
    .route("/cancel-invoice")
    .post(authMiddleware, SalesController.cancelInvoice);



module.exports = router;