const router = require("express").Router();
const ItemController = require("./item.controller");
const authMiddleware = require("../../middlewares/auth.middleware")


router
    .route("/add")
    .post(authMiddleware, ItemController.add);

router
    .route("/get")
    .post(authMiddleware, ItemController.get);

router
    .route("/delete")
    .delete(authMiddleware, ItemController.remove);

router
    .route("/get-purchase-invoice")
    .post(authMiddleware, ItemController.getPurchaseInvoice);


module.exports = router;
